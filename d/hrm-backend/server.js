const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const { apiLimiter } = require("./middleware/rateLimiter");

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isDev = (process.env.NODE_ENV || "development") !== "production";

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
}));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));
app.use("/api", apiLimiter);

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { ensureDatabaseSchema } = require("./config/bootstrap");

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "HRM Server Running", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HRM API",
    version: "1.3.0",
    endpoints: {
      auth: "/api/auth",
      employees: "/api/employees",
      leaves: "/api/leaves",
      attendance: "/api/attendance",
      payroll: "/api/payroll",
      performance: "/api/performance",
      dashboard: "/api/dashboard",
      notifications: "/api/notifications",
      settings: "/api/settings",
      admin: "/api/admin",
      ai: "/api/ai",
      health: "/api/health"
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.stack || err);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    error: "Something went wrong",
    message: isProd ? "Internal server error" : (err.message || "Unknown error")
  });
});

const PORT = process.env.PORT || 5001;

function validateEnv() {
  const secret = process.env.JWT_SECRET || "";
  if (!secret || secret.includes("change_me") || secret.length < 16) {
    console.warn("WARNING: JWT_SECRET is weak or default. Set a strong secret (min 32 chars) before production use.");
  }
  if (!process.env.DB_HOST) {
    console.warn("WARNING: DB_HOST not set, defaulting to localhost");
  }
}

async function startServer() {
  try {
    validateEnv();
    const bootstrapResult = await ensureDatabaseSchema();

    if (bootstrapResult.seededSchema) {
      console.log("Database schema initialized from database/schema.sql");
    } else if (bootstrapResult.seededAdmin) {
      console.log("Demo admin user seeded: admin@hrm.com / password123  (CHANGE THIS PASSWORD)");
    }

    app.listen(PORT, () => {
      console.log("=================================");
      console.log("HRM Server running on port " + PORT);
      console.log("http://localhost:" + PORT);
      console.log("Environment:", process.env.NODE_ENV || "development");
      console.log("=================================");
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
