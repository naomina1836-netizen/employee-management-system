const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const attendanceController = require("../controllers/attendanceController");

router.get("/search", authenticate, authorize("Admin", "HR", "Manager"), attendanceController.search);
router.get("/stats", authenticate, authorize("Admin", "HR", "Manager"), attendanceController.getStats);
router.get("/today", authenticate, attendanceController.getToday);
router.post("/self/check-in", authenticate, attendanceController.selfCheckIn);
router.post("/self/check-out", authenticate, attendanceController.selfCheckOut);
router.get("/employee/:employeeId/month/:month/year/:year", authenticate, attendanceController.getMonthly);
router.get("/employee/:employeeId", authenticate, attendanceController.getByEmployee);
router.get("/:id", authenticate, authorize("Admin", "HR", "Manager"), attendanceController.getOne);
router.get("/", authenticate, authorize("Admin", "HR", "Manager"), attendanceController.getAll);
router.post("/", authenticate, authorize("Admin", "HR"), attendanceController.create);
router.put("/:id", authenticate, authorize("Admin", "HR"), attendanceController.update);
router.delete("/:id", authenticate, authorize("Admin", "HR"), attendanceController.delete);

module.exports = router;
