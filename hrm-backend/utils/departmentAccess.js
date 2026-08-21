const db = require("../config/db");

async function getManagerDepartmentId(user) {
    if (user.role !== "Manager") return null;

    if (!user.employee_id) {
        const error = new Error("No employee profile is linked to this manager account");
        error.statusCode = 403;
        throw error;
    }

    const [employees] = await db.query(
        "SELECT department_id FROM employees WHERE employee_id = ?",
        [user.employee_id]
    );

    if (!employees[0]?.department_id) {
        const error = new Error("Your manager profile must be assigned to a department");
        error.statusCode = 403;
        throw error;
    }

    return employees[0].department_id;
}

async function managerCanAccessEmployee(user, employeeId) {
    const departmentId = await getManagerDepartmentId(user);
    if (departmentId === null) return true;

    const [employees] = await db.query(
        "SELECT department_id FROM employees WHERE employee_id = ?",
        [employeeId]
    );

    return Number(employees[0]?.department_id) === Number(departmentId);
}

module.exports = {
    getManagerDepartmentId,
    managerCanAccessEmployee,
};
