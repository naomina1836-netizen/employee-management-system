const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const settingsController = require("../controllers/settingsController");

router.get("/departments", authenticate, settingsController.getDepartments);
router.post("/departments", authenticate, authorize("Admin", "HR"), settingsController.createDepartment);
router.put("/departments/:id", authenticate, authorize("Admin", "HR"), settingsController.updateDepartment);
router.delete("/departments/:id", authenticate, authorize("Admin"), settingsController.deleteDepartment);

router.get("/positions", authenticate, settingsController.getPositions);
router.post("/positions", authenticate, authorize("Admin", "HR"), settingsController.createPosition);
router.put("/positions/:id", authenticate, authorize("Admin", "HR"), settingsController.updatePosition);
router.delete("/positions/:id", authenticate, authorize("Admin"), settingsController.deletePosition);

module.exports = router;
