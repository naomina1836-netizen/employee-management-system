const rateLimit = require("express-rate-limit");

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const apiMax = parseInt(process.env.RATE_LIMIT_MAX || "300", 10);
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "15", 10);

const apiLimiter = rateLimit({
  windowMs,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." }
});

const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." }
});

module.exports = { apiLimiter, authLimiter };
