const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===========================
// PUBLIC ROUTES
// ===========================

exports.login = async (req, res) => {
    try {
        console.log("=== LOGIN USER ===");
        console.log("Email received:", req.body.email);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            console.log("User not found:", email);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = users[0];
        console.log("User found:", user.email);

        if (user.status === "Inactive") {
            return res.status(401).json({ message: "Your account is inactive. Please contact HR." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
            console.log("Invalid password for:", email);
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

// ===========================
// PROTECTED ROUTES
// ===========================

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

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'CHANGE_PASSWORD', 'users', ?)`,
            [req.user.user_id, userId]
        );

        res.json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};

// ===========================
// ADMIN ONLY ROUTES
// ===========================

exports.register = async (req, res) => {
    try {
        // Only Admin and HR can create users
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        if (!['Admin', 'HR'].includes(req.user.role)) {
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

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'CREATE_USER', 'users', ?)`,
            [req.user.user_id, result.insertId]
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
        const { user_id, new_password } = req.body;

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Only Admin can reset passwords" });
        }

        if (!user_id || !new_password) {
            return res.status(400).json({ message: "User ID and new password are required" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE user_id = ?",
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, user_id]
        );

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'RESET_PASSWORD', 'users', ?)`,
            [req.user.user_id, user_id]
        );

        res.json({ message: "Password reset successfully" });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
};