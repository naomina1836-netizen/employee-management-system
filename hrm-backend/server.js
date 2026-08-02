const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes"); // Added dashboard import

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/dashboard", dashboardRoutes); // Added dashboard route

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "HRM Server Running" });
});

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
            dashboard: "/api/dashboard" // Added dashboard endpoint
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error:", err.stack);
    res.status(500).json({ error: "Something went wrong", message: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log("=================================");
    console.log("HRM Server running on port " + PORT);
    console.log("http://localhost:" + PORT);
    console.log("=================================");
});

module.exports = app;