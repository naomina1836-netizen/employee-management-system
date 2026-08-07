const db = require("../config/db");

// Soft delete employee (set status to 'Terminated')
const softDelete = async (employeeId, userId) => {
    try {
        await db.query(
            `UPDATE employees SET 
                employment_status = 'Terminated',
                updated_at = NOW()
             WHERE employee_id = ?`,
            [employeeId]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'SOFT_DELETE', 'employees', ?)`,
            [userId, employeeId]
        );

        return true;
    } catch (error) {
        throw error;
    }
};

// Restore employee (set status back to 'Active')
const restore = async (employeeId, userId) => {
    try {
        await db.query(
            `UPDATE employees SET 
                employment_status = 'Active',
                updated_at = NOW()
             WHERE employee_id = ?`,
            [employeeId]
        );

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'RESTORE', 'employees', ?)`,
            [userId, employeeId]
        );

        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = { softDelete, restore };