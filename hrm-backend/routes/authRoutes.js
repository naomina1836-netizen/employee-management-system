const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/permissionMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

// Public routes (stricter rate limit on login)
router.post("/login", authLimiter, authController.login);
router.post("/complete-password-setup", authLimiter, authController.completePasswordSetup);
router.post("/request-password-reset", authLimiter, authController.requestPasswordReset);
router.post("/complete-password-reset", authLimiter, authController.completePasswordReset);

// Protected routes
router.get("/me", authenticate, authController.me);
router.put("/me", authenticate, authController.updateMe);
router.post("/change-password", authenticate, authController.changePassword);

// Admin / HR routes
router.post("/register", authenticate, authorize("createUsers"), authController.register);
router.post("/reset-password", authenticate, authorize("resetPasswords"), authController.resetPassword);

module.exports = router;
