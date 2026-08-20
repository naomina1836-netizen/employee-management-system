const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/chat", authenticate, aiController.chat);
router.get("/insights", authenticate, aiController.insights);

module.exports = router;
