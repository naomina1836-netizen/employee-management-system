const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const authController = require("../controllers/authController");

router.get("/users", authenticate, authorize("Admin", "HR"), authController.getAllUsers);
router.patch("/users/:id/status", authenticate, authorize("Admin"), authController.updateUserStatus);

module.exports = router;
