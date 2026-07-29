const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const leaveController = require("../controllers/leaveController");

router.get("/", authenticate, authorize("Admin", "HR", "Manager"), leaveController.getAll);
router.get("/employee/:employeeId", authenticate, leaveController.getByEmployee);
router.post("/", authenticate, authorize("Admin", "HR", "Employee"), leaveController.create);
router.patch("/:id/status", authenticate, authorize("Admin", "HR", "Manager"), leaveController.updateStatus);
router.get("/types", authenticate, leaveController.getLeaveTypes);

module.exports = router;