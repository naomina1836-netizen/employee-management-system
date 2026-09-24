const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/permissionMiddleware");
const settingsController = require("../controllers/settingsController");

// Departments
router.get("/departments", authenticate, settingsController.getDepartments);
router.post("/departments", authenticate, authorize("manageSettings"), settingsController.createDepartment);
router.put("/departments/:id", authenticate, authorize("manageSettings"), settingsController.updateDepartment);
router.delete("/departments/:id", authenticate, authorize("manageSettings"), settingsController.deleteDepartment);

// Positions
router.get("/positions", authenticate, settingsController.getPositions);
router.post("/positions", authenticate, authorize("manageSettings"), settingsController.createPosition);
router.put("/positions/:id", authenticate, authorize("manageSettings"), settingsController.updatePosition);
router.delete("/positions/:id", authenticate, authorize("manageSettings"), settingsController.deletePosition);

module.exports = router;
