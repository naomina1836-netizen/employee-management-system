const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const performanceController = require("../controllers/performanceController");

router.get("/search", authenticate, authorize("Admin", "HR", "Manager"), performanceController.search);
router.get("/stats", authenticate, authorize("Admin", "HR", "Manager"), performanceController.getStats);
router.get("/employee/:employeeId", authenticate, performanceController.getByEmployee);
router.get("/:id", authenticate, authorize("Admin", "HR", "Manager"), performanceController.getOne);
router.get("/", authenticate, authorize("Admin", "HR", "Manager"), performanceController.getAll);
router.post("/", authenticate, authorize("Admin", "HR", "Manager"), performanceController.create);
router.put("/:id", authenticate, authorize("Admin", "HR", "Manager"), performanceController.update);
router.delete("/:id", authenticate, authorize("Admin", "HR"), performanceController.delete);

module.exports = router;
