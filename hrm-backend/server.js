const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS configuration
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const profileRoutes = require("./routes/profileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "OK", 
        message: "HRM Server Running",
        timestamp: new Date().toISOString()
    });
});

// Root endpoint with all available routes
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
            admin: "/api/admin",
            settings: "/api/settings",
            profile: "/api/profile",
            notifications: "/api/notifications"
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error:", err.stack);
    
    // Handle specific error types
    if (err.name === "ValidationError") {
        return res.status(400).json({ 
            error: "Validation Error", 
            message: err.message 
        });
    }
    
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({ 
            error: "Unauthorized", 
            message: "Invalid or missing token" 
        });
    }
    
    res.status(500).json({ 
        error: "Internal Server Error", 
        message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
    });
});

// 404 handler - should be last
app.use((req, res) => {
    res.status(404).json({ 
        error: "Route not found", 
        path: req.originalUrl,
        method: req.method
    });
});

// Start server
const PORT = process.env.PORT || 5001;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log("=================================");
        console.log("HRM Server running on port " + PORT);
        console.log(`http://localhost:${PORT}`);
        console.log("=================================");
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        console.log("=================================");
    });
}

module.exports = app;