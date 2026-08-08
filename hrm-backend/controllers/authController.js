const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ============ REGISTER ============
exports.register = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Check if user has permission
        if (!['Admin', 'HR'].includes(req.user.role)) {
            return res.status(403).json({ message: "Only Admin and HR can create users" });
        }

        const { username, email, password, role, employee_id } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" });
        }

        // Check if user already exists
        const [existing] = await db.query(
            "SELECT * FROM users WHERE email = ? OR username = ?",
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (username, email, password, role, employee_id, status) 
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [username, email, hashedPassword, role || "Employee", employee_id || null]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'INSERT', 'users', ?)`,
            [req.user.user_id, result.insertId]
        );

        res.status(201).json({
            message: "User created successfully",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Failed to create user" });
    }
};

// ============ CHANGE PASSWORD (for logged-in users) ============
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.user_id;

        // Validate inputs
        if (!current_password || !new_password) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        // Get user from database
        const [users] = await db.query(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(current_password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password in database
        await db.query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, userId]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'CHANGE_PASSWORD', 'users', ?)`,
            [req.user.user_id, userId]
        );

        res.json({ 
            message: "Password changed successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};

// ============ RESET PASSWORD (Admin only) ============
exports.resetPassword = async (req, res) => {
    try {
        const { user_id, new_password } = req.body;

        // Check if user is Admin
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Only Admin can reset passwords" });
        }

        // Validate inputs
        if (!user_id || !new_password) {
            return res.status(400).json({ message: "User ID and new password are required" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        // Check if user exists
        const [users] = await db.query(
            "SELECT * FROM users WHERE user_id = ?",
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, user_id]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'RESET_PASSWORD', 'users', ?)`,
            [req.user.user_id, user_id]
        );

        res.json({ 
            message: "Password reset successfully",
            user_id: user_id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
};

// ============ LOGIN (if not already implemented) ============
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate inputs
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = users[0];

        // Check if user is active
        if (user.status !== 'Active') {
            return res.status(403).json({ message: "Account is inactive. Please contact administrator." });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        // Update last login
        await db.query(
            "UPDATE users SET last_login = NOW() WHERE user_id = ?",
            [user.user_id]
        );

        // Log login action
        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'LOGIN', 'users', ?)`,
            [user.user_id, user.user_id]
        );

        // Return user data (excluding password)
        const { password: _, ...userData } = user;
        
        res.json({
            message: "Login successful",
            token,
            user: userData
        });

    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Failed to login" });
    }
};

// ============ LOGOUT ============
exports.logout = async (req, res) => {
    try {
        // Log logout action if user is authenticated
        if (req.user && req.user.user_id) {
            await db.query(
                `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
                 VALUES (?, 'LOGOUT', 'users', ?)`,
                [req.user.user_id, req.user.user_id]
            );
        }
        
        // Client-side should remove the token
        res.json({ 
            message: "Logged out successfully",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ message: "Failed to logout" });
    }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const [users] = await db.query(
            "SELECT user_id, username, email, role, employee_id, status, created_at, last_login FROM users WHERE user_id = ?",
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error("Error getting current user:", error);
        res.status(500).json({ message: "Failed to get user information" });
    }
};