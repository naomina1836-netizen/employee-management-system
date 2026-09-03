const crypto = require("crypto");

function getFrontendBaseUrl() {
    const raw = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";
    return raw.replace(/\/+$/, "");
}

function buildPasswordSetupUrl(token) {
    return `${getFrontendBaseUrl()}/set-password?token=${encodeURIComponent(token)}`;
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function createPasswordSetupToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresInHours = Number(process.env.PASSWORD_SETUP_TOKEN_HOURS) || 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    return {
        token,
        tokenHash: hashToken(token),
        expiresAt,
        expiresInHours,
    };
}

async function storePasswordSetupRequest(connection, userId) {
    const { token, tokenHash, expiresAt } = createPasswordSetupToken();

    await connection.query(
        `UPDATE users
         SET password_setup_token_hash = ?,
             password_setup_expires_at = ?,
             password_setup_requested_at = CURRENT_TIMESTAMP,
             password_setup_completed_at = NULL,
             password_reset_token_hash = NULL,
             password_reset_expires_at = NULL,
             password_reset_requested_at = NULL,
             password_reset_completed_at = NULL
         WHERE user_id = ?`,
        [tokenHash, expiresAt, userId]
    );

    return {
        token,
        tokenHash,
        expiresAt,
        setupUrl: buildPasswordSetupUrl(token),
    };
}

module.exports = {
    buildPasswordSetupUrl,
    createPasswordSetupToken,
    hashToken,
    storePasswordSetupRequest,
};
