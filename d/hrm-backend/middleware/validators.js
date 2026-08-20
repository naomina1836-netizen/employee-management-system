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
    if (rule.type === "date") {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        errors.push({ field: rule.field, message: rule.message || `${rule.field} must be a valid date` });
      }
    }
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({ field: rule.field, message: rule.message || `Invalid value for ${rule.field}` });
    }
    if (rule.minLength && String(value).length < rule.minLength) {
      errors.push({ field: rule.field, message: rule.message || `${rule.field} is too short` });
    }
    if (rule.maxLength && String(value).length > rule.maxLength) {
      errors.push({ field: rule.field, message: rule.message || `${rule.field} is too long` });
    }
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors.push({ field: rule.field, message: rule.message || `${rule.field} is too small` });
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
  { field: "first_name", required: true, minLength: 1, maxLength: 50 },
  { field: "last_name", required: true, minLength: 1, maxLength: 50 },
  { field: "email", required: true, type: "email", maxLength: 100 },
  { field: "gender", enum: ["Male", "Female", "Other", "Prefer not to say"] },
  { field: "employment_status", enum: ["Active", "Resigned", "Terminated"] },
  { field: "phone", maxLength: 20 },
  { field: "date_of_birth", type: "date" },
  { field: "hire_date", type: "date" }
]);

const validateLeave = makeValidator([
  { field: "employee_id", required: true, type: "int" },
  { field: "leave_type_id", required: true, type: "int" },
  { field: "start_date", required: true, type: "date" },
  { field: "end_date", required: true, type: "date" },
  { field: "reason", maxLength: 1000 }
]);

const validatePayroll = makeValidator([
  { field: "employee_id", required: true, type: "int" },
  { field: "month", required: true, maxLength: 20 },
  { field: "year", required: true, type: "int", min: 2000 },
  { field: "basic_salary", required: true, type: "number", min: 0 },
  { field: "allowance", type: "number", min: 0 },
  { field: "overtime", type: "number", min: 0 },
  { field: "deduction", type: "number", min: 0 },
  { field: "tax", type: "number", min: 0 }
]);

const validateLogin = makeValidator([
  { field: "email", required: true, type: "email" },
  { field: "password", required: true, minLength: 6 }
]);

const validateChangePassword = makeValidator([
  { field: "current_password", required: true },
  { field: "new_password", required: true, minLength: 8 }
]);

const handleValidationErrors = (req, res, next) => next();

module.exports = {
  validateEmployee,
  validateLeave,
  validatePayroll,
  validateLogin,
  validateChangePassword,
  handleValidationErrors
};
