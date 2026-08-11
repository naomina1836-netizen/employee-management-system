const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const leaveController = require("../controllers/leaveController");

router.get("/search", authenticate, authorize("Admin", "HR", "Manager"), leaveController.search);
router.get("/stats", authenticate, authorize("Admin", "HR", "Manager"), leaveController.getStats);
router.get("/types", authenticate, leaveController.getLeaveTypes);
router.get("/employee/:employeeId", authenticate, leaveController.getByEmployee);
router.get("/", authenticate, authorize("Admin", "HR", "Manager"), leaveController.getAll);
router.post("/", authenticate, authorize("Admin", "HR", "Employee"), leaveController.create);
router.patch("/:id/status", authenticate, authorize("Admin", "HR", "Manager"), leaveController.updateStatus);
router.delete("/:id", authenticate, authorize("Admin", "HR"), leaveController.delete);

module.exports = router;
