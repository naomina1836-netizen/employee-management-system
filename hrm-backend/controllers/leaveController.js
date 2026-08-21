const db = require("../config/db");
const { getManagerDepartmentId, managerCanAccessEmployee } = require("../utils/departmentAccess");

exports.getAll = async (req, res) => {
    try {
        let query = `SELECT l.*,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    lt.leave_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM leave_requests l
             JOIN employees e ON l.employee_id = e.employee_id
             JOIN leave_types lt ON l.leave_type_id = lt.leave_type_id
             LEFT JOIN employees a ON l.approved_by = a.employee_id
             WHERE 1=1`;
        const params = [];
        const departmentId = await getManagerDepartmentId(req.user);
        if (departmentId !== null) {
            query += " AND e.department_id = ?";
            params.push(departmentId);
        }
        query += " ORDER BY l.applied_at DESC";
        const [leaves] = await db.query(query, params);

        res.json(leaves);

    } catch (error) {
        console.error("Error fetching leave requests:", error);
        res.status(500).json({ message: "Failed to fetch leave requests" });
    }
};

exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (req.user.role === "Employee" &&
            (!req.user.employee_id || Number(employeeId) !== Number(req.user.employee_id))) {
            return res.status(403).json({ message: "You can only view your own leave requests" });
        }

        if (req.user.role === "Manager" && !(await managerCanAccessEmployee(req.user, employeeId))) {
            return res.status(403).json({ message: "You can only view leave requests from your department" });
        }

        const [leaves] = await db.query(
            `SELECT l.*, 
                    lt.leave_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM leave_requests l
             JOIN leave_types lt ON l.leave_type_id = lt.leave_type_id
             LEFT JOIN employees a ON l.approved_by = a.employee_id
             WHERE l.employee_id = ?
             ORDER BY l.applied_at DESC`,
            [employeeId]
        );

        res.json(leaves);

    } catch (error) {
        console.error("Error fetching employee leaves:", error);
        res.status(500).json({ message: "Failed to fetch leave requests" });
    }
};

exports.create = async (req, res) => {
    try {
        const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;

        if (!employee_id || !leave_type_id || !start_date || !end_date) {
            return res.status(400).json({ message: "Employee, leave type, start date, and end date are required" });
        }

        if (["Employee", "Manager"].includes(req.user.role) && Number(req.user.employee_id) !== Number(employee_id)) {
            return res.status(403).json({ message: "You can only submit leave for your own employee profile" });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end - start);
        const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const [result] = await db.query(
            `INSERT INTO leave_requests 
             (employee_id, leave_type_id, start_date, end_date, total_days, reason) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [employee_id, leave_type_id, start_date, end_date, total_days, reason || null]
        );

        // Notify the employee's manager and HR/Admin approvers.
        await db.query(
            `INSERT INTO notifications (user_id, title, message)
             SELECT u.user_id, 'New Leave Request', 'A leave request is awaiting review'
             FROM users u
             WHERE u.role IN ('Admin', 'HR')
                OR u.employee_id = (SELECT manager_id FROM employees WHERE employee_id = ?)` ,
            [employee_id]
        );

        res.status(201).json({
            message: "Leave request submitted successfully",
            leave_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating leave request:", error);
        res.status(500).json({ message: "Failed to create leave request" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be Approved or Rejected" });
        }

        const [existing] = await db.query(
            `SELECT l.*, e.manager_id
             FROM leave_requests l
             JOIN employees e ON e.employee_id = l.employee_id
             WHERE l.leave_id = ?`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        if (req.user.role === "Manager" && Number(existing[0].manager_id) !== Number(req.user.employee_id)) {
            return res.status(403).json({ message: "Managers can only review leave requests from their direct reports" });
        }

        await db.query(
            `UPDATE leave_requests 
             SET status = ?, approved_by = ?
             WHERE leave_id = ?`,
            [status, req.user.employee_id || null, id]
        );

        await db.query(
            `INSERT INTO notifications (user_id, title, message)
             SELECT user_id, 'Leave Request Updated', CONCAT('Your leave request has been ', ?)
             FROM users WHERE employee_id = ?`,
            [status, existing[0].employee_id]
        );

        res.json({ message: "Leave request status updated successfully" });

    } catch (error) {
        console.error("Error updating leave status:", error);
        res.status(500).json({ message: "Failed to update leave status" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            "SELECT * FROM leave_requests WHERE leave_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        await db.query(
            "DELETE FROM leave_requests WHERE leave_id = ?",
            [id]
        );

        res.json({ message: "Leave request deleted successfully" });
    } catch (error) {
        console.error("Error deleting leave request:", error);
        res.status(500).json({ message: "Failed to delete leave request" });
    }
};

exports.getLeaveTypes = async (req, res) => {
    try {
        const [leaveTypes] = await db.query(
            "SELECT * FROM leave_types ORDER BY leave_name"
        );
        res.json(leaveTypes);

    } catch (error) {
        console.error("Error fetching leave types:", error);
        res.status(500).json({ message: "Failed to fetch leave types" });
    }
};
// SEARCH LEAVE REQUESTS
exports.search = async (req, res) => {
    try {
        const { keyword, status, leave_type, start_date, end_date } = req.query;
        
        let query = `
            SELECT l.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    lt.leave_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.employee_id
            JOIN leave_types lt ON l.leave_type_id = lt.leave_type_id
            LEFT JOIN employees a ON l.approved_by = a.employee_id
            WHERE 1=1
        `;
        
        const params = [];

        const departmentId = await getManagerDepartmentId(req.user);
        if (departmentId !== null) {
            query += " AND e.department_id = ?";
            params.push(departmentId);
        }
        
        if (keyword) {
            query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR lt.leave_name LIKE ?)`;
            const searchTerm = `%${keyword}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (status) {
            query += ` AND l.status = ?`;
            params.push(status);
        }
        
        if (leave_type) {
            query += ` AND l.leave_type_id = ?`;
            params.push(leave_type);
        }
        
        if (start_date) {
            query += ` AND l.start_date >= ?`;
            params.push(start_date);
        }
        
        if (end_date) {
            query += ` AND l.end_date <= ?`;
            params.push(end_date);
        }
        
        query += ` ORDER BY l.applied_at DESC`;
        
        const [leaves] = await db.query(query, params);
        res.json(leaves);

    } catch (error) {
        console.error("Error searching leave requests:", error);
        res.status(500).json({ message: "Failed to search leave requests" });
    }
};

// GET LEAVE STATISTICS (Report)
exports.getStats = async (req, res) => {
    try {
        // By status
        const [statusStats] = await db.query(
            `SELECT status, COUNT(*) as count
             FROM leave_requests
             GROUP BY status`
        );
        
        // By leave type
        const [typeStats] = await db.query(
            `SELECT lt.leave_name, COUNT(l.leave_id) as count
             FROM leave_types lt
             LEFT JOIN leave_requests l ON lt.leave_type_id = l.leave_type_id
             GROUP BY lt.leave_type_id`
        );
        
        // Monthly trend (last 6 months)
        const [monthlyTrend] = await db.query(
            `SELECT DATE_FORMAT(applied_at, '%Y-%m') as month, COUNT(*) as count
             FROM leave_requests
             WHERE applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(applied_at, '%Y-%m')
             ORDER BY month`
        );
        
        // Total
        const [total] = await db.query(
            `SELECT COUNT(*) as total FROM leave_requests`
        );
        
        // Pending
        const [pending] = await db.query(
            `SELECT COUNT(*) as pending FROM leave_requests WHERE status = 'Pending'`
        );
        
        res.json({
            total: total[0].total,
            pending: pending[0].pending,
            byStatus: statusStats,
            byType: typeStats,
            monthlyTrend: monthlyTrend
        });

    } catch (error) {
        console.error("Error fetching leave stats:", error);
        res.status(500).json({ message: "Failed to fetch leave statistics" });
    }
};
