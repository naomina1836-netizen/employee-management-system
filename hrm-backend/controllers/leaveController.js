const db = require("../config/db");
exports.getAll = async (req, res) => {
    try {
        const [leaves] = await db.query(
            `SELECT l.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    lt.leave_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM leave_requests l
             JOIN employees e ON l.employee_id = e.employee_id
             JOIN leave_types lt ON l.leave_type_id = lt.leave_type_id
             LEFT JOIN employees a ON l.approved_by = a.employee_id
             ORDER BY l.applied_at DESC`
        );

        res.json(leaves);

    } catch (error) {
        console.error("Error fetching leave requests:", error);
        res.status(500).json({ message: "Failed to fetch leave requests" });
    }
};

// GET LEAVE REQUESTS BY EMPLOYEE
exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

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

        // Calculate total days
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

        // Create notification for HR
        await db.query(
            `INSERT INTO notifications (user_id, title, message) 
             VALUES ((SELECT user_id FROM users WHERE employee_id = ?), 
                     'New Leave Request', 
                     'Leave request submitted for approval')`,
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
        const { status, approved_by } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const [existing] = await db.query(
            "SELECT * FROM leave_requests WHERE leave_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        await db.query(
            `UPDATE leave_requests 
             SET status = ?, approved_by = ?
             WHERE leave_id = ?`,
            [status, approved_by || null, id]
        );

        // Create notification for employee
        await db.query(
            `INSERT INTO notifications (user_id, title, message) 
             VALUES ((SELECT user_id FROM users WHERE employee_id = ?), 
                     'Leave Request Updated', 
                     'Your leave request has been ' + ?)`,
            [existing[0].employee_id, status]
        );

        res.json({ message: "Leave request status updated successfully" });

    } catch (error) {
        console.error("Error updating leave status:", error);
        res.status(500).json({ message: "Failed to update leave status" });
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