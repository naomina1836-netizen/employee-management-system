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

exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (req.user?.role === "Employee" && parseInt(employeeId, 10) !== parseInt(req.user.employee_id, 10)) {
            return res.status(403).json({ message: "You can only view your own leave requests" });
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
        let { employee_id, leave_type_id, start_date, end_date, reason } = req.body;

        if (req.user?.role === "Employee") {
            if (!req.user.employee_id) {
                return res.status(403).json({ message: "Your account is not linked to an employee profile" });
            }
            employee_id = req.user.employee_id;
        }

        if (!employee_id || !leave_type_id || !start_date || !end_date) {
            return res.status(400).json({ message: "Employee, leave type, start date, and end date are required" });
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

        await db.query(
            `INSERT INTO notifications (user_id, title, message) 
             VALUES ((SELECT user_id FROM users WHERE employee_id = ?), 
                     'Leave Request Updated', 
                     CONCAT('Your leave request has been ', ?))`,
            [existing[0].employee_id, status]
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

exports.getStats = async (req, res) => {
    try {
        const [statusStats] = await db.query(
            `SELECT status, COUNT(*) as count
             FROM leave_requests
             GROUP BY status`
        );

        const [typeStats] = await db.query(
            `SELECT lt.leave_name, COUNT(l.leave_id) as count
             FROM leave_types lt
             LEFT JOIN leave_requests l ON lt.leave_type_id = l.leave_type_id
             GROUP BY lt.leave_type_id`
        );

        const [monthlyTrend] = await db.query(
            `SELECT DATE_FORMAT(applied_at, '%Y-%m') as month, COUNT(*) as count
             FROM leave_requests
             WHERE applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(applied_at, '%Y-%m')
             ORDER BY month`
        );

        const [total] = await db.query(
            `SELECT COUNT(*) as total FROM leave_requests`
        );

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

exports.getBalance = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user?.employee_id;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    if (
      req.user.role === "Employee" &&
      parseInt(employeeId, 10) !== parseInt(req.user.employee_id, 10)
    ) {
      return res.status(403).json({ message: "You can only view your own leave balance" });
    }

    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const [types] = await db.query(
      `SELECT leave_type_id, leave_name, max_days FROM leave_types ORDER BY leave_type_id`
    );

    const [used] = await db.query(
      `SELECT leave_type_id, COALESCE(SUM(total_days), 0) AS used_days
       FROM leave_requests
       WHERE employee_id = ?
         AND status = 'Approved'
         AND YEAR(start_date) = ?
       GROUP BY leave_type_id`,
      [employeeId, year]
    );

    const usedMap = {};
    used.forEach((r) => {
      usedMap[r.leave_type_id] = Number(r.used_days);
    });

    const balances = types.map((t) => {
      const usedDays = usedMap[t.leave_type_id] || 0;
      const remaining = Math.max(0, t.max_days - usedDays);
      return {
        leave_type_id: t.leave_type_id,
        leave_name: t.leave_name,
        max_days: t.max_days,
        used_days: usedDays,
        remaining_days: remaining,
        year
      };
    });

    res.json({
      employee_id: Number(employeeId),
      year,
      balances
    });
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    res.status(500).json({ message: "Failed to fetch leave balance" });
  }
};
