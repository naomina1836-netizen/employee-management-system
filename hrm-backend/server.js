const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const { apiLimiter } = require("./middleware/rateLimiter");

// CORS Configuration
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:5176")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

// Import Routes
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
const { ensureDatabaseSchema } = require("./config/bootstrap");

// Use Routes
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

// Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "HRM Server Running" });
});

// Root Route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to HRM API",
        version: "1.0.0",
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
            admin: "/api/admin"
        }
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("Global error:", err.stack);
    res.status(500).json({ error: "Something went wrong", message: err.message });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
    try {
        const bootstrapResult = await ensureDatabaseSchema();

        if (bootstrapResult.seededSchema) {
            console.log("Database schema initialized from database/schema.sql");
        }

        if (bootstrapResult.seededAdmin) {
            console.log("Default admin user seeded. Use the ADMIN_PASSWORD configured in your environment.");
        }

        app.listen(PORT, () => {
            console.log("=================================");
            console.log("HRM Server running on port " + PORT);
            console.log("http://localhost:" + PORT);
            console.log("=================================");
        });
    } catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
