const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

router.get("/stats", authenticate, dashboardController.getStats);

module.exports = router;