const nodemailer = require("nodemailer");

// Outgoing email transport. Configure SMTP_USER + SMTP_PASS in hrm-backend/.env.
// By default this uses Gmail (App Password). Set SMTP_HOST to point at any other
// SMTP server instead - handy for test inboxes like Mailtrap or Ethereal. When
// SMTP_USER/SMTP_PASS are unset, email is disabled and every send becomes a
// no-op so the rest of the app keeps working.
let transporter;

function getTransporter() {
    if (transporter !== undefined) return transporter;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn("[mailer] SMTP_USER/SMTP_PASS not set - outgoing email is disabled.");
        transporter = null;
        return transporter;
    }

    // A custom SMTP_HOST (e.g. Mailtrap, Ethereal) takes precedence so email can
    // be pointed at a test inbox. Otherwise fall back to Gmail's known service.
    if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE === "true"
            : port === 465;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure,
            auth: { user, pass },
        });
    } else {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    }
    return transporter;
}

function formatDate(value) {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildTextMessage({ greeting, intro, details = [], closing, footer }) {
    const lines = [];

    if (greeting) {
        lines.push(`Hi ${greeting},`);
        lines.push("");
    }

    if (intro) {
        lines.push(intro);
        lines.push("");
    }

    if (details.length > 0) {
        details.forEach(({ label, value }) => {
            lines.push(`${label}: ${value}`);
        });
        lines.push("");
    }

    if (closing) {
        lines.push(closing);
        lines.push("");
    }

    if (footer) {
        lines.push(footer);
    }

    return lines.join("\n").trim();
}

function buildHtmlMessage({ greeting, intro, details = [], closing, footer }) {
    const detailRows = details
        .map(
            ({ label, value }) => `
                <tr>
                    <td style="padding: 8px 12px 8px 0; color: #6b7280; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${escapeHtml(value)}</td>
                </tr>`
        )
        .join("");

    return `
        <div style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.5;">
            ${greeting ? `<p style="margin: 0 0 16px;">Hi ${escapeHtml(greeting)},</p>` : ""}
            ${intro ? `<p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>` : ""}
            ${details.length > 0 ? `
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 16px;">
                    ${detailRows}
                </table>` : ""}
            ${closing ? `<p style="margin: 0 0 16px;">${escapeHtml(closing)}</p>` : ""}
            ${footer ? `<p style="margin: 24px 0 0; font-size: 12px; color: #6b7280;">${escapeHtml(footer)}</p>` : ""}
        </div>
    `.trim();
}

function buildFromAddress() {
    const from = process.env.MAIL_FROM;
    if (from) {
        return from;
    }

    const user = process.env.SMTP_USER;
    const name = process.env.MAIL_FROM_NAME;

    if (name && user) {
        return { name, address: user };
    }

    return user;
}

function buildReplyToAddress() {
    return process.env.SMTP_USER || process.env.MAIL_FROM || undefined;
}

// Base send. Resolves to true on success, false when email is disabled or the
// send fails - it never rejects, so callers can await it safely (no try/catch
// needed) and use the boolean to report status back to the UI.
async function sendMail({ to, subject, text, html }) {
    if (!to) return false;

    const tx = getTransporter();
    if (!tx) return false;

    const from = buildFromAddress();
    const replyTo = buildReplyToAddress();

    try {
        await tx.sendMail({ from, replyTo, to, subject, text, html });
        return true;
    } catch (err) {
        console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err.message);
        return false;
    }
}

function sendAccountCredentials({ to, name, username, setupUrl, role }) {
    return sendPasswordSetupLink({ to, name, username, setupUrl, role });
}

function sendPasswordReset({ to, name, username, setupUrl }) {
    return sendPasswordResetLink({ to, name, username, resetUrl: setupUrl });
}

function sendPasswordSetupLink({ to, name, username, setupUrl, role }) {
    const subject = "Set up your HRM password";
    const greeting = name || username || "there";
    const intro = "Your HRM account is ready. Use the link below to create your password.";
    const details = [
        { label: "Login email", value: to },
        { label: "Username", value: username },
        { label: "Role", value: role || "Employee" },
    ];
    const closing = "This link can be used once and expires soon. If it stops working, ask an HR administrator to send a new one.";
    const footer = "This message was sent automatically by the HRM system.";

    const htmlLink = setupUrl
        ? `<p style="margin: 0 0 16px;"><a href="${escapeHtml(setupUrl)}" style="color: #1d4ed8; font-weight: 700;">Set your password</a></p>`
        : "";

    return sendMail({
        to,
        subject,
        text: buildTextMessage({
            greeting,
            intro,
            details: [...details, ...(setupUrl ? [{ label: "Setup link", value: setupUrl }] : [])],
            closing,
            footer,
        }),
        html: `
            <div style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.5;">
                <p style="margin: 0 0 16px;">Hi ${escapeHtml(greeting)},</p>
                <p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>
                ${htmlLink}
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 16px;">
                    ${details
                        .map(
                            ({ label, value }) => `
                                <tr>
                                    <td style="padding: 8px 12px 8px 0; color: #6b7280; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
                                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${escapeHtml(value)}</td>
                                </tr>`
                        )
                        .join("")}
                </table>
                ${setupUrl ? `<p style="margin: 0 0 16px; word-break: break-all; color: #374151;">${escapeHtml(setupUrl)}</p>` : ""}
                <p style="margin: 0 0 16px;">${escapeHtml(closing)}</p>
                <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280;">${escapeHtml(footer)}</p>
            </div>
        `.trim(),
    });
}

function sendPasswordResetLink({ to, name, username, resetUrl }) {
    const subject = "Reset your HRM password";
    const greeting = name || username || "there";
    const intro = "You requested a password reset for your HRM account.";
    const details = [
        { label: "Login email", value: to },
        { label: "Username", value: username },
    ];
    const closing = "This link can only be used once and expires soon. If you did not request it, ignore this email.";
    const footer = "This message was sent automatically by the HRM system.";

    const htmlLink = resetUrl
        ? `<p style="margin: 0 0 16px;"><a href="${escapeHtml(resetUrl)}" style="color: #1d4ed8; font-weight: 700;">Reset your password</a></p>`
        : "";

    return sendMail({
        to,
        subject,
        text: buildTextMessage({
            greeting,
            intro,
            details: [...details, ...(resetUrl ? [{ label: "Reset link", value: resetUrl }] : [])],
            closing,
            footer,
        }),
        html: `
            <div style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.5;">
                <p style="margin: 0 0 16px;">Hi ${escapeHtml(greeting)},</p>
                <p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>
                ${htmlLink}
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 16px;">
                    ${details
                        .map(
                            ({ label, value }) => `
                                <tr>
                                    <td style="padding: 8px 12px 8px 0; color: #6b7280; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
                                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${escapeHtml(value)}</td>
                                </tr>`
                        )
                        .join("")}
                </table>
                ${resetUrl ? `<p style="margin: 0 0 16px; word-break: break-all; color: #374151;">${escapeHtml(resetUrl)}</p>` : ""}
                <p style="margin: 0 0 16px;">${escapeHtml(closing)}</p>
                <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280;">${escapeHtml(footer)}</p>
            </div>
        `.trim(),
    });
}

function sendLeaveStatus({ to, name, status, leaveName, startDate, endDate }) {
    const subject = `Your leave request was ${String(status).toLowerCase()}`;
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const range = start && end ? ` (${start} to ${end})` : "";
    const statusText = String(status).toLowerCase();
    const greeting = name || "there";
    const intro = `Your ${leaveName || "leave"} request${range} has been ${statusText}.`;
    const closing = "You can view the full details in the HRM system.";
    const footer = "This message was sent automatically by the HRM system.";
    return sendMail({
        to,
        subject,
        text: buildTextMessage({ greeting, intro, closing, footer }),
        html: buildHtmlMessage({ greeting, intro, closing, footer }),
    });
}

module.exports = {
    sendMail,
    sendAccountCredentials,
    sendPasswordReset,
    sendPasswordSetupLink,
    sendPasswordResetLink,
    sendLeaveStatus,
};
