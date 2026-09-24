const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/permissionMiddleware");
const authController = require("../controllers/authController");
const auditController = require("../controllers/auditController");

// Admin user management
router.get("/users", authenticate, authorize("manageUsers"), authController.getAllUsers);
router.put("/users/:id", authenticate, authorize("manageUsers"), authController.updateUser);
router.patch("/users/:id/status", authenticate, authorize("manageUsers"), authController.updateUserStatus);
router.post("/test-email", authenticate, authorize("manageUsers"), authController.sendTestEmail);
router.get("/audit-logs", authenticate, authorize("viewAuditLogs"), auditController.getAuditLogs);

module.exports = router;
