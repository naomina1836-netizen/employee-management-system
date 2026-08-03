const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const payrollController = require("../controllers/payrollController");

router.get("/search", authenticate, authorize("Admin", "HR", "Manager"), payrollController.search);
router.get("/stats", authenticate, authorize("Admin", "HR", "Manager"), payrollController.getStats);
router.get("/employee/:employeeId", authenticate, payrollController.getByEmployee);
router.post("/generate", authenticate, authorize("Admin", "HR"), payrollController.generate);
router.get("/", authenticate, authorize("Admin", "HR", "Manager"), payrollController.getAll);
router.post("/", authenticate, authorize("Admin", "HR"), payrollController.create);
router.put("/:id", authenticate, authorize("Admin", "HR"), payrollController.update);
router.delete("/:id", authenticate, authorize("Admin"), payrollController.delete);

module.exports = router;