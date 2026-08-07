const { body, validationResult } = require("express-validator");

// Employee validation rules
const validateEmployee = [
    body("first_name").notEmpty().withMessage("First name is required"),
    body("last_name").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").optional().isString().withMessage("Phone must be a string"),
    body("gender").optional().isIn(["Male", "Female"]).withMessage("Gender must be Male or Female"),
    body("employment_status").optional().isIn(["Active", "Resigned", "Terminated"]).withMessage("Invalid employment status")
];

// Leave validation rules
const validateLeave = [
    body("employee_id").isInt().withMessage("Valid employee ID is required"),
    body("leave_type_id").isInt().withMessage("Valid leave type is required"),
    body("start_date").isDate().withMessage("Valid start date is required"),
    body("end_date").isDate().withMessage("Valid end date is required")
];

// Payroll validation rules
const validatePayroll = [
    body("employee_id").isInt().withMessage("Valid employee ID is required"),
    body("month").isString().withMessage("Month is required"),
    body("year").isInt().withMessage("Valid year is required"),
    body("basic_salary").isDecimal().withMessage("Basic salary must be a number")
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: "Validation failed", 
            errors: errors.array() 
        });
    }
    next();
};

module.exports = {
    validateEmployee,
    validateLeave,
    validatePayroll,
    handleValidationErrors
};