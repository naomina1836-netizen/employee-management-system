const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const employeeController = require("../controllers/employeeController");
const { validateEmployee } = require("../middleware/validators");

router.get("/search", authenticate, authorize("Admin", "HR", "Manager"), employeeController.search);
router.get("/stats", authenticate, authorize("Admin", "HR", "Manager"), employeeController.getStats);
router.get("/departments", authenticate, employeeController.getDepartments);
router.get("/positions", authenticate, employeeController.getPositions);
router.get("/", authenticate, authorize("Admin", "HR", "Manager"), employeeController.getAll);
router.get("/:id", authenticate, authorize("Admin", "HR", "Manager"), employeeController.getOne);
router.post("/", authenticate, authorize("Admin", "HR"), validateEmployee, employeeController.create);
router.put("/:id", authenticate, authorize("Admin", "HR"), validateEmployee, employeeController.update);
router.delete("/:id", authenticate, authorize("Admin"), employeeController.delete);

module.exports = router;
