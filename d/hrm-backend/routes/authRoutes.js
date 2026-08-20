const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");
const { validateLogin, validateChangePassword } = require("../middleware/validators");

router.post("/login", authLimiter, validateLogin, authController.login);
router.post("/refresh", authLimiter, authController.refresh);

router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);
router.put("/me", authenticate, authController.updateMe);
router.post("/change-password", authenticate, validateChangePassword, authController.changePassword);

router.post("/register", authenticate, authController.register);
router.post("/reset-password", authenticate, authController.resetPassword);

module.exports = router;
