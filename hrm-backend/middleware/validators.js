// Lightweight validators (no express-validator dependency)

function runRules(req, rules) {
    const errors = [];
    for (const rule of rules) {
        const value = req.body?.[rule.field];
        if (rule.required && (value === undefined || value === null || value === "")) {
            errors.push({ field: rule.field, message: rule.message || `${rule.field} is required` });
            continue;
        }
        if (value === undefined || value === null || value === "") continue;

        if (rule.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            errors.push({ field: rule.field, message: rule.message || "Valid email is required" });
        }
        if (rule.type === "int" && !Number.isInteger(Number(value))) {
            errors.push({ field: rule.field, message: rule.message || `${rule.field} must be an integer` });
        }
        if (rule.type === "number" && Number.isNaN(Number(value))) {
            errors.push({ field: rule.field, message: rule.message || `${rule.field} must be a number` });
        }
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push({ field: rule.field, message: rule.message || `Invalid value for ${rule.field}` });
        }
        if (rule.minLength && String(value).length < rule.minLength) {
            errors.push({ field: rule.field, message: rule.message || `${rule.field} is too short` });
        }
    }
    return errors;
}

function makeValidator(rules) {
    return (req, res, next) => {
        const errors = runRules(req, rules);
        if (errors.length) {
            return res.status(400).json({ message: "Validation failed", errors });
        }
        next();
    };
}

const validateEmployee = makeValidator([
    { field: "first_name", required: true },
    { field: "last_name", required: true },
    { field: "email", required: true, type: "email" },
    { field: "gender", enum: ["Male", "Female"] },
    { field: "employment_status", enum: ["Active", "Resigned", "Terminated"] }
]);

const validateLeave = makeValidator([
    { field: "employee_id", required: true, type: "int" },
    { field: "leave_type_id", required: true, type: "int" },
    { field: "start_date", required: true },
    { field: "end_date", required: true }
]);

const validatePayroll = makeValidator([
    { field: "employee_id", required: true, type: "int" },
    { field: "month", required: true },
    { field: "year", required: true, type: "int" },
    { field: "basic_salary", required: true, type: "number" }
]);

const handleValidationErrors = (req, res, next) => next();

module.exports = {
    validateEmployee,
    validateLeave,
    validatePayroll,
    handleValidationErrors
};
