const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const employeeController = require("../controllers/employeeController");

router.get("/", authenticate, authorize("Admin", "HR", "Manager"), employeeController.getAll);
router.get("/:id", authenticate, authorize("Admin", "HR", "Manager"), employeeController.getOne);
router.post("/", authenticate, authorize("Admin", "HR"), employeeController.create);
router.put("/:id", authenticate, authorize("Admin", "HR"), employeeController.update);
router.delete("/:id", authenticate, authorize("Admin"), employeeController.delete);
router.get("/departments", authenticate, employeeController.getDepartments);
router.get("/positions", authenticate, employeeController.getPositions);

module.exports = router;