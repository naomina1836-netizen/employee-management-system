// Lightweight in-memory rate limiters (no external dependency)

function createRateLimiter({ windowMs, max, message }) {
    const hits = new Map();

    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits.entries()) {
            if (now - entry.start >= windowMs) {
                hits.delete(key);
            }
        }
    }, Math.min(windowMs, 60_000)).unref?.();

    return (req, res, next) => {
        const key = req.ip || req.connection?.remoteAddress || "unknown";
        const now = Date.now();
        let entry = hits.get(key);

        if (!entry || now - entry.start >= windowMs) {
            entry = { start: now, count: 0 };
            hits.set(key, entry);
        }

        entry.count += 1;

        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));

        if (entry.count > max) {
            return res.status(429).json(
                typeof message === "string" ? { message } : message
            );
        }

        next();
    };
}

const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: "Too many requests from this IP, please try again later." }
});

const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many login attempts, please try again later." }
});

module.exports = { apiLimiter, authLimiter };