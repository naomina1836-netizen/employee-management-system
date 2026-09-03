const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/permissionMiddleware");
const employeeController = require("../controllers/employeeController");
const { validateEmployee } = require("../middleware/validators");

router.get("/search", authenticate, authorize("viewEmployees"), employeeController.search);
router.get("/stats", authenticate, authorize("viewEmployees"), employeeController.getStats);
router.get("/departments", authenticate, employeeController.getDepartments);
router.get("/positions", authenticate, employeeController.getPositions);
router.get("/", authenticate, authorize("viewEmployees"), employeeController.getAll);
router.get("/:id", authenticate, authorize("viewEmployees"), employeeController.getOne);
router.post("/", authenticate, authorize("createEmployees"), validateEmployee, employeeController.create);
router.put("/:id", authenticate, authorize("editEmployees"), validateEmployee, employeeController.update);
router.delete("/:id", authenticate, authorize("deleteEmployees"), employeeController.delete);

module.exports = router;
