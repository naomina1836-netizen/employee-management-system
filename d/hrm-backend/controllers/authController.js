const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_EXPIRE = process.env.JWT_EXPIRE || "7d";
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || "7", 10) || 7;
const BCRYPT_ROUNDS = 12;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || String(secret).trim().length < 8) {
    return null;
  }
  return String(secret).trim();
}

function signAccessToken(user) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is missing or too short (min 8 characters)");
  }
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id
    },
    secret,
    { expiresIn: ACCESS_EXPIRE }
  );
}

async function ensureRefreshTokensTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token VARCHAR(512) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked TINYINT(1) DEFAULT 0,
      INDEX idx_token (token(255)),
      INDEX idx_user (user_id),
      INDEX idx_expires (expires_at)
    )
  `);
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

  const insert = async () => {
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [userId, token, expiresAt]
    );
  };

  try {
    await insert();
  } catch (err) {
    const msg = String(err.message || "");
    if (err.code === "ER_NO_SUCH_TABLE" || msg.includes("refresh_tokens")) {
      await ensureRefreshTokensTable();
      await insert();
    } else {
      throw err;
    }
  }
  return { token, expiresAt };
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!getJwtSecret()) {
      console.error("JWT_SECRET missing. Check hrm-backend/.env");
      return res.status(500).json({
        message: "Server misconfigured: JWT_SECRET",
        detail: "Set JWT_SECRET in hrm-backend/.env (min 8 chars) and restart the backend"
      });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    if (user.status === "Inactive") {
      return res.status(401).json({ message: "Your account is inactive" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user);

    let refreshToken = null;
    try {
      const refresh = await createRefreshToken(user.user_id);
      refreshToken = refresh.token;
    } catch (refreshErr) {
      console.error("Refresh token skipped:", refreshErr.message);
    }

    const safeUser = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
      status: user.status,
      created_at: user.created_at
    };

    return res.json({
      message: "Login successful",
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: ACCESS_EXPIRE,
      user: safeUser
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      message: "Failed to login",
      detail: error.message || String(error)
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
      await ensureRefreshTokensTable();
    } catch (_) {}

    const [rows] = await db.query(
      `SELECT rt.*, u.user_id, u.username, u.email, u.role, u.employee_id, u.status
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.user_id
       WHERE rt.token = ? AND (rt.revoked = 0 OR rt.revoked = FALSE) AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const row = rows[0];
    if (row.status === "Inactive") {
      return res.status(401).json({ message: "Account is inactive" });
    }

    await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE token_id = ?", [row.token_id]);

    const user = {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      employee_id: row.employee_id
    };

    const accessToken = signAccessToken(user);
    const refresh = await createRefreshToken(user.user_id);

    res.json({
      message: "Token refreshed",
      token: accessToken,
      accessToken,
      refreshToken: refresh.token,
      expiresIn: ACCESS_EXPIRE
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Failed to refresh token", detail: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?", [refreshToken]);
    }
    if (req.user?.user_id) {
      await db.query(
        "UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND (revoked = 0 OR revoked = FALSE)",
        [req.user.user_id]
      );
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Failed to logout" });
  }
};

exports.me = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT user_id, username, email, role, employee_id, status, created_at 
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { username, email } = req.body;
    const [users] = await db.query(
      "SELECT user_id, username, email FROM users WHERE user_id = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentUser = users[0];
    const nextUsername = username?.trim() || currentUser.username;
    const nextEmail = email?.trim() || currentUser.email;
    if (!nextUsername || !nextEmail) {
      return res.status(400).json({ message: "Username and email are required" });
    }
    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?",
      [nextUsername, nextEmail, userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    await db.query("UPDATE users SET username = ?, email = ? WHERE user_id = ?", [
      nextUsername,
      nextEmail,
      userId
    ]);
    const [updatedUsers] = await db.query(
      `SELECT user_id, username, email, role, employee_id, status, created_at 
       FROM users WHERE user_id = ?`,
      [userId]
    );
    res.json({ message: "Profile updated successfully", user: updatedUsers[0] });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.user_id;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, userId]);
    try {
      await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [userId]);
    } catch (_) {}
    res.json({ message: "Password changed successfully. Please login again." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

exports.register = async (req, res) => {
  try {
    if (!req.user || !["Admin", "HR"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only Admin and HR can create users" });
    }
    const { username, email, password, role, employee_id } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, role, employee_id, status) 
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      [username, email, hashedPassword, role || "Employee", employee_id || null]
    );
    res.status(201).json({ message: "User created successfully", user_id: result.insertId });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can reset passwords" });
    }
    const { user_id, new_password } = req.body;
    if (!user_id || !new_password) {
      return res.status(400).json({ message: "User ID and new password are required" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    const hashedPassword = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, user_id]);
    try {
      await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [user_id]);
    } catch (_) {}
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT user_id, username, email, role, employee_id, status, created_at
       FROM users ORDER BY user_id`
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be Active or Inactive" });
    }
    if (parseInt(id, 10) === req.user.user_id) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }
    const [result] = await db.query("UPDATE users SET status = ? WHERE user_id = ?", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    if (status === "Inactive") {
      try {
        await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [id]);
      } catch (_) {}
    }
    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};
