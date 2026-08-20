const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

// Public routes (stricter rate limit on login)
router.post("/login", authLimiter, authController.login);

// Protected routes
router.get("/me", authenticate, authController.me);
router.put("/me", authenticate, authController.updateMe);
router.post("/change-password", authenticate, authController.changePassword);

// Admin / HR routes
router.post("/register", authenticate, authorize("Admin", "HR"), authController.register);
router.post("/reset-password", authenticate, authorize("Admin"), authController.resetPassword);

module.exports = router;
