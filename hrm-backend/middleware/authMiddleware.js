const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Check if user owns the resource or has admin/HR role
const checkOwnership = (req, res, next) => {
    const userId = parseInt(req.params.id) || parseInt(req.params.employeeId);
    const currentUserId = req.user.user_id;
    const currentRole = req.user.role;

    // Admin and HR can access everything
    if (currentRole === 'Admin' || currentRole === 'HR') {
        return next();
    }

    // Managers can access their direct reports
    if (currentRole === 'Manager') {
        req.isManager = true;
        return next();
    }

    // Employees can only access their own data
    if (currentRole === 'Employee') {
        if (userId && userId !== currentUserId) {
            return res.status(403).json({ 
                message: "Access denied. You can only view your own data." 
            });
        }
        return next();
    }

    return res.status(403).json({ message: "Access denied" });
};

module.exports = { authenticate, checkOwnership };