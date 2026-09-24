const ROLE_PERMISSIONS = {
    Admin: [
        "createUsers",
        "manageUsers",
        "viewAuditLogs",
        "manageEmployees",
        "createEmployees",
        "editEmployees",
        "deleteEmployees",
        "manageSettings",
        "manageAttendance",
        "managePayroll",
        "managePerformance",
        "manageLeaves",
        "resetPasswords",
    ],
    HR: [
        "createUsers",
        "manageEmployees",
        "createEmployees",
        "viewEmployees",
        "manageSettings",
        "manageAttendance",
        "managePayroll",
        "managePerformance",
        "manageLeaves",
    ],
    Manager: [
        "managePerformance",
        "manageLeaves",
        "manageAttendance",
        "viewEmployees",
        "viewPayroll",
        "viewPerformance",
        "viewAttendance",
    ],
    Employee: [
        "viewOwnProfile",
        "editOwnProfile",
        "submitLeaves",
        "viewOwnAttendance",
        "viewOwnPayroll",
        "viewOwnPerformance",
    ],
};

function canPerform(user, action) {
    if (!user || !action) {
        return false;
    }

    if (user.role === "Admin") {
        return true;
    }

    return (ROLE_PERMISSIONS[user.role] || []).includes(action);
}

function authorizePermission(action) {
    return (req, res, next) => {
        if (canPerform(req.user, action)) {
            return next();
        }

        return res.status(403).json({
            message: `Access denied. Required permission: ${action}`,
            your_role: req.user?.role,
        });
    };
}

module.exports = {
    ROLE_PERMISSIONS,
    canPerform,
    authorizePermission,
};
