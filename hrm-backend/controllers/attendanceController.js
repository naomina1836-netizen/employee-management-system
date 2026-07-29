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

exports.getMonthly = async (req, res) => {
    try {
        const { employeeId, month, year } = req.params;

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