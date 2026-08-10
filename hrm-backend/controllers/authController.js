const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

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

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        delete user.password;

        res.json({
            message: "Login successful",
            token,
            user
        });

    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Failed to login" });
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

        await db.query(
            "UPDATE users SET username = ?, email = ? WHERE user_id = ?",
            [nextUsername, nextEmail, userId]
        );

        const [updatedUsers] = await db.query(
            `SELECT user_id, username, email, role, employee_id, status, created_at 
             FROM users WHERE user_id = ?`,
            [userId]
        );

        res.json({
            message: "Profile updated successfully",
            user: updatedUsers[0]
        });
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

        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(current_password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, userId]
        );

        res.json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};

exports.register = async (req, res) => {
    try {
        if (!req.user || !['Admin', 'HR'].includes(req.user.role)) {
            return res.status(403).json({ message: "Only Admin and HR can create users" });
        }

        const { username, email, password, role, employee_id } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" });
        }

        const [existing] = await db.query(
            "SELECT * FROM users WHERE email = ? OR username = ?",
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (username, email, password, role, employee_id, status) 
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [username, email, hashedPassword, role || "Employee", employee_id || null]
        );

        res.status(201).json({
            message: "User created successfully",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Only Admin can reset passwords" });
        }

        const { user_id, new_password } = req.body;

        if (!user_id || !new_password) {
            return res.status(400).json({ message: "User ID and new password are required" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, user_id]
        );

        res.json({ message: "Password reset successfully" });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
};
