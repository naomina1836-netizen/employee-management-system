const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.get("/", authenticate, notificationController.getAll);
router.patch("/:id/read", authenticate, notificationController.markAsRead);
router.patch("/read-all", authenticate, notificationController.markAllAsRead);

module.exports = router;
