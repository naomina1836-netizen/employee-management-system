const db = require("../config/db");

let auditLogWriteColumnsPromise = null;

async function getAuditLogWriteColumns() {
    if (!auditLogWriteColumnsPromise) {
        auditLogWriteColumnsPromise = (async () => {
            const [rows] = await db.query(
                `
                SELECT COLUMN_NAME
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'audit_logs'
                `
            );

            const columns = new Set(rows.map((row) => row.COLUMN_NAME));

            return {
                hasDetails: columns.has("details"),
            };
        })().catch((error) => {
            auditLogWriteColumnsPromise = null;
            throw error;
        });
    }

    return auditLogWriteColumnsPromise;
}

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
        const schema = await getAuditLogWriteColumns();
        const columns = ["user_id", "action", "table_name", "record_id"];
        const values = [userId, action, tableName, recordId];

        if (schema.hasDetails) {
            columns.push("details");
            values.push(payload);
        }

        await connection.query(
            `INSERT INTO audit_logs (${columns.join(", ")})
             VALUES (${columns.map(() => "?").join(", ")})`,
            values
        );
    } catch (error) {
        console.error("[audit] Failed to record event:", error.message);
    }
}

module.exports = {
    logAuditEvent,
};
