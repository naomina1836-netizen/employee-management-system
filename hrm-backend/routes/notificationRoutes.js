const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.get("/", authenticate, notificationController.getAll);
router.patch("/read-all", authenticate, notificationController.markAllAsRead);
router.patch("/:id/read", authenticate, notificationController.markAsRead);

module.exports = router;
