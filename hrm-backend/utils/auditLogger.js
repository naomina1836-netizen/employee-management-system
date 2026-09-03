const db = require("../config/db");

function serializeDetails(details) {
    if (details === undefined || details === null) {
        return null;
    }

    if (typeof details === "string") {
        return details;
    }

    try {
        return JSON.stringify(details);
    } catch (error) {
        return String(details);
    }
}

async function logAuditEvent(connectionOrDb, { userId = null, action, tableName, recordId = null, details = null }) {
    if (!action || !tableName) {
        return;
    }

    const connection = connectionOrDb || db;
    const payload = serializeDetails(details);

    try {
        await connection.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, action, tableName, recordId, payload]
        );
    } catch (error) {
        console.error("[audit] Failed to record event:", error.message);
    }
}

module.exports = {
    logAuditEvent,
};
