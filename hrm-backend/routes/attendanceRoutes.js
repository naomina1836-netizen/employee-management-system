const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const attendanceController = require("../controllers/attendanceController");

router.get("/", authenticate, authorize("Admin", "HR", "Manager"), attendanceController.getAll);
router.get("/employee/:employeeId", authenticate, attendanceController.getByEmployee);
router.get("/employee/:employeeId/month/:month/year/:year", authenticate, attendanceController.getMonthly);
router.post("/", authenticate, authorize("Admin", "HR"), attendanceController.create);
router.put("/:id", authenticate, authorize("Admin", "HR"), attendanceController.update);
router.delete("/:id", authenticate, authorize("Admin", "HR"), attendanceController.delete);

module.exports = router;