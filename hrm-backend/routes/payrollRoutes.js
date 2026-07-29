const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const payrollController = require("../controllers/payrollController");

router.get("/", authenticate, authorize("Admin", "HR", "Manager"), payrollController.getAll);
router.get("/employee/:employeeId", authenticate, payrollController.getByEmployee);
router.post("/", authenticate, authorize("Admin", "HR"), payrollController.create);
router.put("/:id", authenticate, authorize("Admin", "HR"), payrollController.update);
router.delete("/:id", authenticate, authorize("Admin"), payrollController.delete);
router.post("/generate", authenticate, authorize("Admin", "HR"), payrollController.generate);

module.exports = router;