const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../utils/mailer");
const { logAuditEvent } = require("../utils/auditLogger");
const {
    storePasswordSetupRequest,
    hashToken,
} = require("../utils/passwordSetup");
const {
    storePasswordResetRequest,
} = require("../utils/passwordReset");

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
            { expiresIn: process.env.JWT_EXPIRE || "7d" }
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

        await logAuditEvent(db, {
            userId,
            action: "UPDATE_PROFILE",
            tableName: "users",
            recordId: userId,
            details: {
                username: nextUsername,
                email: nextEmail,
            },
        });

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

        await logAuditEvent(db, {
            userId,
            action: "CHANGE_PASSWORD",
            tableName: "users",
            recordId: userId,
        });

        res.json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};

exports.register = async (req, res) => {
    let connection;

    try {
        if (!req.user || !['Admin', 'HR'].includes(req.user.role)) {
            return res.status(403).json({ message: "Only Admin and HR can create users" });
        }

        const { username, email, password, role, employee_id } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: "Username and email are required" });
        }

        const [existing] = await db.query(
            "SELECT * FROM users WHERE email = ? OR username = ?",
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        let linkedEmployeeId = employee_id || null;

        // Employee onboarding can start from either side: use the matching
        // employee profile when no explicit employee id was supplied.
        if (!linkedEmployeeId) {
            const [employees] = await connection.query(
                "SELECT employee_id FROM employees WHERE email = ?",
                [email]
            );
            linkedEmployeeId = employees[0]?.employee_id || null;
        }

        if (linkedEmployeeId) {
            const [linkedUsers] = await connection.query(
                "SELECT user_id FROM users WHERE employee_id = ?",
                [linkedEmployeeId]
            );
            if (linkedUsers.length > 0) {
                await connection.rollback();
                return res.status(400).json({ message: "This employee already has a user account" });
            }
        }

        const initialPassword = password || crypto.randomBytes(16).toString("hex");
        const hashedPassword = await bcrypt.hash(initialPassword, 10);

        const [result] = await connection.query(
            `INSERT INTO users (username, email, password, role, employee_id, status)
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [username, email, hashedPassword, role || "Employee", linkedEmployeeId]
        );

        const { setupUrl } = await storePasswordSetupRequest(connection, result.insertId);

        await logAuditEvent(connection, {
            userId: req.user.user_id,
            action: "CREATE_USER",
            tableName: "users",
            recordId: result.insertId,
            details: {
                username,
                email,
                role: role || "Employee",
                employee_id: linkedEmployeeId,
            },
        });

        await connection.commit();

        // Email a one-time password setup link instead of sending credentials.
        const emailSent = await mailer.sendPasswordSetupLink({
            to: email,
            name: username,
            username,
            setupUrl,
            role: role || "Employee"
        });

        res.status(201).json({
            message: "User created successfully",
            user_id: result.insertId,
            email_to: email,
            email_sent: emailSent
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

async function issuePasswordResetLink(connection, user, actorUserId) {
    const { resetUrl } = await storePasswordResetRequest(connection, user.user_id);

    const emailSent = await mailer.sendPasswordResetLink({
        to: user.email,
        name: user.username,
        username: user.username,
        resetUrl,
    });

    await logAuditEvent(connection, {
        userId: actorUserId,
        action: "PASSWORD_RESET_REQUESTED",
        tableName: "users",
        recordId: user.user_id,
        details: {
            email: user.email,
            username: user.username,
        },
    });

    return {
        email_to: user.email,
        email_sent: emailSent,
    };
}

exports.resetPassword = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Only Admin can reset passwords" });
        }

        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const [targets] = await db.query(
            "SELECT email, username, role FROM users WHERE user_id = ?",
            [user_id]
        );

        if (targets.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!targets[0].email) {
            return res.status(400).json({ message: "User does not have an email address" });
        }

        const result = await issuePasswordResetLink(db, {
            user_id: Number(user_id),
            email: targets[0].email,
            username: targets[0].username,
        }, req.user.user_id);

        res.json({
            message: "Password reset link sent successfully",
            ...result
        });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
};

exports.completePasswordSetup = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const tokenHash = hashToken(token);
        const [users] = await db.query(
            `SELECT user_id, password_setup_expires_at
             FROM users
             WHERE password_setup_token_hash = ?`,
            [tokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired password setup link" });
        }

        const user = users[0];
        const expiresAt = user.password_setup_expires_at ? new Date(user.password_setup_expires_at) : null;

        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
            await db.query(
                `UPDATE users
                 SET password_setup_token_hash = NULL,
                     password_setup_expires_at = NULL
                 WHERE user_id = ?`,
                [user.user_id]
            );
            return res.status(400).json({ message: "Invalid or expired password setup link" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `UPDATE users
             SET password = ?,
                 password_setup_token_hash = NULL,
                 password_setup_expires_at = NULL,
                 password_setup_requested_at = NULL,
                 password_setup_completed_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [hashedPassword, user.user_id]
        );

        await logAuditEvent(db, {
            userId: user.user_id,
            action: "COMPLETE_PASSWORD_SETUP",
            tableName: "users",
            recordId: user.user_id,
        });

        await db.query(
            `UPDATE users
             SET password_reset_token_hash = NULL,
                 password_reset_expires_at = NULL,
                 password_reset_requested_at = NULL,
                 password_reset_completed_at = NULL
             WHERE user_id = ?`,
            [user.user_id]
        );

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error completing password setup:", error);
        res.status(500).json({ message: "Failed to complete password setup" });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const [users] = await db.query(
            "SELECT user_id, username, email, status FROM users WHERE email = ?",
            [email.trim()]
        );

        if (users.length === 0) {
            return res.json({
                message: "If the account exists, a password reset email has been sent.",
                email_sent: false,
            });
        }

        const user = users[0];

        if (user.status === "Inactive") {
            return res.json({
                message: "If the account exists, a password reset email has been sent.",
                email_sent: false,
            });
        }

        const result = await issuePasswordResetLink(db, user, null);

        res.json({
            message: "If the account exists, a password reset email has been sent.",
            ...result,
        });
    } catch (error) {
        console.error("Error requesting password reset:", error);
        res.status(500).json({ message: "Failed to request password reset" });
    }
};

exports.completePasswordReset = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const tokenHash = hashToken(token);
        const [users] = await db.query(
            `SELECT user_id, password_reset_expires_at
             FROM users
             WHERE password_reset_token_hash = ?`,
            [tokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired password reset link" });
        }

        const user = users[0];
        const expiresAt = user.password_reset_expires_at ? new Date(user.password_reset_expires_at) : null;

        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
            await db.query(
                `UPDATE users
                 SET password_reset_token_hash = NULL,
                     password_reset_expires_at = NULL
                 WHERE user_id = ?`,
                [user.user_id]
            );
            return res.status(400).json({ message: "Invalid or expired password reset link" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `UPDATE users
             SET password = ?,
                 password_reset_token_hash = NULL,
                 password_reset_expires_at = NULL,
                 password_reset_requested_at = NULL,
                 password_reset_completed_at = CURRENT_TIMESTAMP,
                 password_setup_token_hash = NULL,
                 password_setup_expires_at = NULL
             WHERE user_id = ?`,
            [hashedPassword, user.user_id]
        );

        await logAuditEvent(db, {
            userId: user.user_id,
            action: "COMPLETE_PASSWORD_RESET",
            tableName: "users",
            recordId: user.user_id,
        });

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error completing password reset:", error);
        res.status(500).json({ message: "Failed to complete password reset" });
    }
};

exports.sendTestEmail = async (req, res) => {
    try {
        if (!["Admin", "HR"].includes(req.user.role)) {
            return res.status(403).json({ message: "Only Admin and HR can send test emails" });
        }

        const { to, subject, message } = req.body;
        const recipient = (to || req.user.email || "").trim();

        if (!recipient) {
            return res.status(400).json({ message: "Recipient email is required" });
        }

        const emailSent = await mailer.sendMail({
            to: recipient,
            subject: subject || "HRM SMTP test",
            text:
                message ||
                "This is a test email from the HRM employee management system.",
        });

        res.json({
            message: "Test email processed",
            email_to: recipient,
            email_sent: emailSent,
        });
    } catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({ message: "Failed to send test email" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT user_id, username, email, role, employee_id, status, created_at
             FROM users
             ORDER BY user_id`
        );
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Only Admin can edit user accounts" });
        }

        const { id } = req.params;
        const { username, email, role, employee_id, status } = req.body;

        const [users] = await db.query(
            "SELECT user_id, username, email, role, employee_id, status FROM users WHERE user_id = ?",
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentUser = users[0];
        const nextUsername = username?.trim() || currentUser.username;
        const nextEmail = email?.trim() || currentUser.email;
        const nextRole = role || currentUser.role;
        const nextEmployeeId = employee_id === "" || employee_id === null || employee_id === undefined
            ? null
            : Number(employee_id);
        const nextStatus = status || currentUser.status;

        if (!nextUsername || !nextEmail) {
            return res.status(400).json({ message: "Username and email are required" });
        }

        if (!["Admin", "HR", "Manager", "Employee"].includes(nextRole)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        if (!["Active", "Inactive"].includes(nextStatus)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const [duplicates] = await db.query(
            "SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?",
            [nextUsername, nextEmail, id]
        );

        if (duplicates.length > 0) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        if (nextEmployeeId) {
            const [linkedUsers] = await db.query(
                "SELECT user_id FROM users WHERE employee_id = ? AND user_id != ?",
                [nextEmployeeId, id]
            );

            if (linkedUsers.length > 0) {
                return res.status(400).json({ message: "This employee already has a user account" });
            }
        }

        await db.query(
            `UPDATE users
             SET username = ?, email = ?, role = ?, employee_id = ?, status = ?
             WHERE user_id = ?`,
            [nextUsername, nextEmail, nextRole, nextEmployeeId, nextStatus, id]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "UPDATE_USER",
            tableName: "users",
            recordId: Number(id),
            details: {
                username: nextUsername,
                email: nextEmail,
                role: nextRole,
                employee_id: nextEmployeeId,
                status: nextStatus,
            },
        });

        const [updated] = await db.query(
            `SELECT user_id, username, email, role, employee_id, status, created_at
             FROM users
             WHERE user_id = ?`,
            [id]
        );

        res.json({
            message: "User updated successfully",
            user: updated[0],
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
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

        const [result] = await db.query(
            "UPDATE users SET status = ? WHERE user_id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "UPDATE_USER_STATUS",
            tableName: "users",
            recordId: Number(id),
            details: {
                status,
            },
        });

        res.json({ message: `User status updated to ${status}` });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status" });
    }
};
