const db = require("../config/db");

exports.getAll = async (req, res) => {
    try {
        const [notifications] = await db.query(
            `SELECT notification_id, user_id, title, message, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.user.user_id]
        );

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE notification_id = ? AND user_id = ?`,
            [id, req.user.user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Failed to update notification" });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.user_id]
        );

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error updating notifications:", error);
        res.status(500).json({ message: "Failed to update notifications" });
    }
};
