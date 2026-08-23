const db = require("../config/db");

exports.getAll = async (req, res) => {
    try {
        const [attendance] = await db.query(
            `SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             ORDER BY a.attendance_date DESC, a.attendance_id DESC`
        );

        res.json(attendance);

    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Failed to fetch attendance" });
    }
};

exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (req.user.role === "Employee" &&
            (!req.user.employee_id || Number(employeeId) !== Number(req.user.employee_id))) {
            return res.status(403).json({ message: "You can only view your own attendance records" });
        }

        const [attendance] = await db.query(
            `SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE a.employee_id = ?
             ORDER BY a.attendance_date DESC`,
            [employeeId]
        );

        res.json(attendance);

    } catch (error) {
        console.error("Error fetching employee attendance:", error);
        res.status(500).json({ message: "Failed to fetch attendance" });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;

        const [attendance] = await db.query(
            `SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE a.attendance_id = ?`,
            [id]
        );

        if (attendance.length === 0) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.json(attendance[0]);
    } catch (error) {
        console.error("Error fetching attendance record:", error);
        res.status(500).json({ message: "Failed to fetch attendance record" });
    }
};

exports.getMonthly = async (req, res) => {
    try {
        const { employeeId, month, year } = req.params;

        if (req.user.role === "Employee" &&
            (!req.user.employee_id || Number(employeeId) !== Number(req.user.employee_id))) {
            return res.status(403).json({ message: "You can only view your own attendance records" });
        }

        const [attendance] = await db.query(
            `SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE a.employee_id = ? 
             AND MONTH(a.attendance_date) = ? 
             AND YEAR(a.attendance_date) = ?
             ORDER BY a.attendance_date`,
            [employeeId, month, year]
        );

        res.json(attendance);

    } catch (error) {
        console.error("Error fetching monthly attendance:", error);
        res.status(500).json({ message: "Failed to fetch monthly attendance" });
    }
};

exports.getToday = async (req, res) => {
    try {
        const employeeId = req.user?.employee_id;

        if (!employeeId) {
            return res.status(400).json({ message: "No employee profile is linked to this user" });
        }

        const [attendance] = await db.query(
            `SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE a.employee_id = ? AND a.attendance_date = CURDATE()
             LIMIT 1`,
            [employeeId]
        );

        res.json(attendance[0] || null);
    } catch (error) {
        console.error("Error fetching today's attendance:", error);
        res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
};

exports.selfCheckIn = async (req, res) => {
    try {
        const employeeId = req.user?.employee_id;

        if (!employeeId) {
            return res.status(400).json({ message: "No employee profile is linked to this user" });
        }

        const [existing] = await db.query(
            "SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = CURDATE()",
            [employeeId]
        );

        if (existing.length > 0 && existing[0].check_in) {
            return res.status(400).json({ message: "You have already checked in today" });
        }

        const checkIn = new Date().toTimeString().slice(0, 8);

        if (existing.length === 0) {
            await db.query(
                `INSERT INTO attendance (employee_id, attendance_date, check_in, status, hours_worked)
                 VALUES (?, CURDATE(), ?, 'Present', 0)`,
                [employeeId, checkIn]
            );
        } else {
            await db.query(
                `UPDATE attendance
                 SET check_in = ?, status = 'Present'
                 WHERE attendance_id = ?`,
                [checkIn, existing[0].attendance_id]
            );
        }

        res.json({ message: "Checked in successfully" });
    } catch (error) {
        console.error("Error checking in:", error);
        res.status(500).json({ message: "Failed to check in" });
    }
};

exports.selfCheckOut = async (req, res) => {
    try {
        const employeeId = req.user?.employee_id;

        if (!employeeId) {
            return res.status(400).json({ message: "No employee profile is linked to this user" });
        }

        const [existing] = await db.query(
            "SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = CURDATE()",
            [employeeId]
        );

        if (existing.length === 0 || !existing[0].check_in) {
            return res.status(400).json({ message: "You need to check in first" });
        }

        if (existing[0].check_out) {
            return res.status(400).json({ message: "You have already checked out today" });
        }

        const checkOut = new Date();
        const checkOutTime = checkOut.toTimeString().slice(0, 8);
        // Anchor both times to the same day so the difference is today's
        // hours worked, not the span since 1970.
        const checkInTime = new Date(`1970-01-01T${existing[0].check_in}`);
        const checkOutBasis = new Date(`1970-01-01T${checkOutTime}`);
        const diffMs = checkOutBasis - checkInTime;
        const hoursWorked = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

        await db.query(
            `UPDATE attendance
             SET check_out = ?, hours_worked = ?
             WHERE attendance_id = ?`,
            [checkOutTime, hoursWorked, existing[0].attendance_id]
        );

        res.json({ message: "Checked out successfully" });
    } catch (error) {
        console.error("Error checking out:", error);
        res.status(500).json({ message: "Failed to check out" });
    }
};

exports.create = async (req, res) => {
    try {
        const { employee_id, attendance_date, check_in, check_out, status } = req.body;

        if (!employee_id || !attendance_date) {
            return res.status(400).json({ message: "Employee and date are required" });
        }

        let hours_worked = 0;
        if (check_in && check_out) {
            const checkInTime = new Date("1970-01-01 " + check_in);
            const checkOutTime = new Date("1970-01-01 " + check_out);
            const diffMs = checkOutTime - checkInTime;
            hours_worked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        const [result] = await db.query(
            `INSERT INTO attendance 
             (employee_id, attendance_date, check_in, check_out, hours_worked, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [employee_id, attendance_date, check_in || null, check_out || null, hours_worked, status || "Present"]
        );

        res.status(201).json({
            message: "Attendance record created successfully",
            attendance_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating attendance:", error);
        res.status(500).json({ message: "Failed to create attendance record" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { check_in, check_out, status } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM attendance WHERE attendance_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        let hours_worked = existing[0].hours_worked;
        if (check_in && check_out) {
            const checkInTime = new Date("1970-01-01 " + check_in);
            const checkOutTime = new Date("1970-01-01 " + check_out);
            const diffMs = checkOutTime - checkInTime;
            hours_worked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        await db.query(
            `UPDATE attendance 
             SET check_in = ?, check_out = ?, hours_worked = ?, status = ?
             WHERE attendance_id = ?`,
            [check_in || null, check_out || null, hours_worked, status || "Present", id]
        );

        res.json({ message: "Attendance record updated successfully" });

    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ message: "Failed to update attendance record" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            "SELECT * FROM attendance WHERE attendance_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        await db.query(
            "DELETE FROM attendance WHERE attendance_id = ?",
            [id]
        );

        res.json({ message: "Attendance record deleted successfully" });

    } catch (error) {
        console.error("Error deleting attendance:", error);
        res.status(500).json({ message: "Failed to delete attendance record" });
    }
};
// SEARCH ATTENDANCE
exports.search = async (req, res) => {
    try {
        const { keyword, status, start_date, end_date } = req.query;
        
        let query = `
            SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (keyword) {
            query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ?)`;
            const searchTerm = `%${keyword}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (status) {
            query += ` AND a.status = ?`;
            params.push(status);
        }
        
        if (start_date) {
            query += ` AND a.attendance_date >= ?`;
            params.push(start_date);
        }
        
        if (end_date) {
            query += ` AND a.attendance_date <= ?`;
            params.push(end_date);
        }
        
        query += ` ORDER BY a.attendance_date DESC`;
        
        const [attendance] = await db.query(query, params);
        res.json(attendance);

    } catch (error) {
        console.error("Error searching attendance:", error);
        res.status(500).json({ message: "Failed to search attendance" });
    }
};

// GET ATTENDANCE STATISTICS (Report)
exports.getStats = async (req, res) => {
    try {
        // By status (this month)
        const [monthlyStats] = await db.query(
            `SELECT status, COUNT(*) as count
             FROM attendance
             WHERE MONTH(attendance_date) = MONTH(CURDATE()) AND YEAR(attendance_date) = YEAR(CURDATE())
             GROUP BY status`
        );
        
        // Daily trend (last 7 days)
        const [dailyTrend] = await db.query(
            `SELECT attendance_date, 
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
             FROM attendance
             WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY attendance_date
             ORDER BY attendance_date`
        );
        
        // Total this month
        const [total] = await db.query(
            `SELECT COUNT(*) as total FROM attendance
             WHERE MONTH(attendance_date) = MONTH(CURDATE()) AND YEAR(attendance_date) = YEAR(CURDATE())`
        );
        
        res.json({
            totalThisMonth: total[0].total,
            monthlyStats: monthlyStats,
            dailyTrend: dailyTrend
        });

    } catch (error) {
        console.error("Error fetching attendance stats:", error);
        res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
};

exports.bulkCreate = async (req, res) => {
    try {
        const { attendance_date, records } = req.body;

        if (!attendance_date) {
            return res.status(400).json({ message: "Attendance date is required" });
        }

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: "At least one attendance record is required" });
        }

        const results = { created: 0, updated: 0, skipped: 0, errors: [] };

        for (const row of records) {
            const employee_id = row.employee_id;
            if (!employee_id) {
                results.skipped += 1;
                results.errors.push({ employee_id: null, message: "Missing employee_id" });
                continue;
            }

            const status = row.status || "Present";
            const check_in = row.check_in || null;
            const check_out = row.check_out || null;

            let hours_worked = 0;
            if (check_in && check_out) {
                const checkInTime = new Date("1970-01-01 " + check_in);
                const checkOutTime = new Date("1970-01-01 " + check_out);
                const diffMs = checkOutTime - checkInTime;
                hours_worked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
                if (Number.isNaN(hours_worked) || hours_worked < 0) hours_worked = 0;
            }

            try {
                const [existing] = await db.query(
                    "SELECT attendance_id FROM attendance WHERE employee_id = ? AND attendance_date = ?",
                    [employee_id, attendance_date]
                );

                if (existing.length > 0) {
                    await db.query(
                        `UPDATE attendance
                         SET check_in = ?, check_out = ?, hours_worked = ?, status = ?
                         WHERE attendance_id = ?`,
                        [check_in, check_out, hours_worked, status, existing[0].attendance_id]
                    );
                    results.updated += 1;
                } else {
                    await db.query(
                        `INSERT INTO attendance
                         (employee_id, attendance_date, check_in, check_out, hours_worked, status)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [employee_id, attendance_date, check_in, check_out, hours_worked, status]
                    );
                    results.created += 1;
                }
            } catch (err) {
                results.skipped += 1;
                results.errors.push({
                    employee_id,
                    message: err.message || "Failed to save record"
                });
            }
        }

        res.status(201).json({
            message: "Bulk attendance processed",
            ...results
        });
    } catch (error) {
        console.error("Error bulk creating attendance:", error);
        res.status(500).json({ message: "Failed to process bulk attendance" });
    }
};
