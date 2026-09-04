const db = require("../config/db");
const { parsePagination, paginatedResponse } = require("../utils/pagination");

let auditLogColumnsPromise = null;

async function getAuditLogColumns() {
    if (!auditLogColumnsPromise) {
        auditLogColumnsPromise = (async () => {
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
                idColumn: columns.has("audit_log_id")
                    ? "audit_log_id"
                    : columns.has("log_id")
                        ? "log_id"
                        : "audit_log_id",
                createdAtColumn: columns.has("created_at")
                    ? "created_at"
                    : columns.has("action_time")
                        ? "action_time"
                        : "created_at",
                hasDetails: columns.has("details"),
            };
        })().catch((error) => {
            auditLogColumnsPromise = null;
            throw error;
        });
    }

    return auditLogColumnsPromise;
}

function escapeCsv(value) {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function buildCsv(rows) {
    const headers = [
        "audit_log_id",
        "user_id",
        "username",
        "email",
        "role",
        "action",
        "table_name",
        "record_id",
        "details",
        "created_at",
    ];

    const lines = [headers.join(",")];
    rows.forEach((row) => {
        lines.push([
            row.audit_log_id,
            row.user_id,
            row.username,
            row.email,
            row.role,
            row.action,
            row.table_name,
            row.record_id,
            row.details,
            row.created_at,
        ].map(escapeCsv).join(","));
    });

    return lines.join("\n");
}

exports.getAuditLogs = async (req, res) => {
    try {
        const schema = await getAuditLogColumns();
        const idExpr = `a.${schema.idColumn}`;
        const createdAtExpr = `a.${schema.createdAtColumn}`;
        const detailsExpr = schema.hasDetails ? "a.details" : "NULL";

        const wantsPagination = req.query.page !== undefined || req.query.limit !== undefined;
        const where = [];
        const params = [];

        if (req.query.table_name) {
            where.push("a.table_name = ?");
            params.push(req.query.table_name);
        }

        if (req.query.action) {
            where.push("a.action = ?");
            params.push(req.query.action);
        }

        if (req.query.q) {
            where.push(`(
                a.action LIKE ?
                OR a.table_name LIKE ?
                OR CAST(a.record_id AS CHAR) LIKE ?
                OR COALESCE(${detailsExpr}, '') LIKE ?
                OR COALESCE(u.username, '') LIKE ?
                OR COALESCE(u.email, '') LIKE ?
            )`);
            const searchTerm = `%${req.query.q.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (req.query.from_date) {
            where.push("DATE(a.created_at) >= ?");
            params.push(req.query.from_date);
        }

        if (req.query.to_date) {
            where.push("DATE(a.created_at) <= ?");
            params.push(req.query.to_date);
        }

        if (req.query.user_id) {
            const userId = Number(req.query.user_id);
            if (!Number.isNaN(userId)) {
                where.push("a.user_id = ?");
                params.push(userId);
            }
        }

        if (req.query.record_id) {
            const recordId = Number(req.query.record_id);
            if (!Number.isNaN(recordId)) {
                where.push("a.record_id = ?");
                params.push(recordId);
            }
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
        const baseQuery = `
            FROM audit_logs a
            LEFT JOIN users u ON u.user_id = a.user_id
            ${whereClause}
        `;

        const selectQuery = `
            SELECT ${idExpr} AS audit_log_id, a.user_id, a.action, a.table_name, a.record_id,
                   ${detailsExpr} AS details, ${createdAtExpr} AS created_at,
                   u.username, u.email, u.role
        `;

        const wantsCsv = String(req.query.format || "").toLowerCase() === "csv";

        if (wantsCsv) {
            const [rows] = await db.query(
                `
                ${selectQuery}
                ${baseQuery}
                ORDER BY ${idExpr} DESC
                `,
                params
            );

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.csv"');
            return res.send(buildCsv(rows));
        }

        if (!wantsPagination) {
            const [rows] = await db.query(
                `
                ${selectQuery}
                ${baseQuery}
                ORDER BY ${idExpr} DESC
                LIMIT 200
                `,
                params
            );
            return res.json(rows);
        }

        const { limit, offset, page } = parsePagination(req.query);
        const [countRows] = await db.query(
            `SELECT COUNT(*) AS total ${baseQuery}`,
            params
        );
        const [rows] = await db.query(
            `
            ${selectQuery}
            ${baseQuery}
            ORDER BY ${idExpr} DESC
            LIMIT ${limit} OFFSET ${offset}
            `,
            params
        );

        res.json(paginatedResponse(rows, countRows[0].total, { limit, offset, page }));
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
};
