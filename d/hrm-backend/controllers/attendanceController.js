const db = require("../config/db");
const {
  computeHoursWorked,
  deriveStatus,
  nowTimeString
} = require("../utils/attendanceMath");

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
    if (
      req.user?.role === "Employee" &&
      parseInt(employeeId, 10) !== parseInt(req.user.employee_id, 10)
    ) {
      return res.status(403).json({ message: "You can only view your own attendance" });
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
    if (
      req.user?.role === "Employee" &&
      parseInt(employeeId, 10) !== parseInt(req.user.employee_id, 10)
    ) {
      return res.status(403).json({ message: "You can only view your own attendance" });
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
      return res.json(null);
    }
    const [rows] = await db.query(
      `SELECT a.*,
              CONCAT(e.first_name, ' ', e.last_name) as employee_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.employee_id
       WHERE a.employee_id = ? AND a.attendance_date = CURDATE()`,
      [employeeId]
    );
    res.json(rows[0] || null);
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

    const checkIn = nowTimeString();
    const status = deriveStatus({ checkIn, checkOut: null, hoursWorked: 0 });

    if (existing.length === 0) {
      await db.query(
        `INSERT INTO attendance (employee_id, attendance_date, check_in, status, hours_worked)
         VALUES (?, CURDATE(), ?, ?, 0)`,
        [employeeId, checkIn, status]
      );
    } else {
      await db.query(
        `UPDATE attendance SET check_in = ?, status = ?, hours_worked = 0
         WHERE attendance_id = ?`,
        [checkIn, status, existing[0].attendance_id]
      );
    }

    res.json({ message: "Checked in successfully", check_in: checkIn, status });
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

    const checkOut = nowTimeString();
    const checkIn = existing[0].check_in;
    const hoursWorked = computeHoursWorked(checkIn, checkOut);
    const status = deriveStatus({
      checkIn,
      checkOut,
      hoursWorked,
      explicitStatus: existing[0].status
    });

    await db.query(
      `UPDATE attendance
       SET check_out = ?, hours_worked = ?, status = ?
       WHERE attendance_id = ?`,
      [checkOut, hoursWorked, status, existing[0].attendance_id]
    );

    res.json({
      message: "Checked out successfully",
      check_out: checkOut,
      hours_worked: hoursWorked,
      status
    });
  } catch (error) {
    console.error("Error checking out:", error);
    res.status(500).json({ message: "Failed to check out", detail: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { employee_id, attendance_date, check_in, check_out, status } = req.body;
    if (!employee_id || !attendance_date) {
      return res.status(400).json({ message: "Employee and date are required" });
    }

    const hours_worked = computeHoursWorked(check_in, check_out);
    const finalStatus = deriveStatus({
      checkIn: check_in,
      checkOut: check_out,
      hoursWorked: hours_worked,
      explicitStatus: status
    });

    const [result] = await db.query(
      `INSERT INTO attendance
       (employee_id, attendance_date, check_in, check_out, hours_worked, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        attendance_date,
        check_in || null,
        check_out || null,
        hours_worked,
        finalStatus
      ]
    );

    res.status(201).json({
      message: "Attendance created successfully",
      attendance_id: result.insertId,
      hours_worked,
      status: finalStatus
    });
  } catch (error) {
    console.error("Error creating attendance:", error);
    res.status(500).json({ message: "Failed to create attendance" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, status, attendance_date } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM attendance WHERE attendance_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const row = existing[0];
    const nextIn = check_in !== undefined ? check_in : row.check_in;
    const nextOut = check_out !== undefined ? check_out : row.check_out;
    const hours_worked = computeHoursWorked(nextIn, nextOut);
    const finalStatus = deriveStatus({
      checkIn: nextIn,
      checkOut: nextOut,
      hoursWorked: hours_worked,
      explicitStatus: status !== undefined ? status : row.status
    });

    await db.query(
      `UPDATE attendance SET
         check_in = ?, check_out = ?, hours_worked = ?, status = ?,
         attendance_date = COALESCE(?, attendance_date)
       WHERE attendance_id = ?`,
      [nextIn || null, nextOut || null, hours_worked, finalStatus, attendance_date || null, id]
    );

    res.json({
      message: "Attendance updated successfully",
      hours_worked,
      status: finalStatus
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Failed to update attendance" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "DELETE FROM attendance WHERE attendance_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ message: "Failed to delete attendance" });
  }
};

exports.search = async (req, res) => {
  try {
    const { keyword, status, start_date, end_date, employee_id } = req.query;
    let query = `
      SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      WHERE 1=1`;
    const params = [];

    if (keyword) {
      query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    if (employee_id) {
      query += ` AND a.employee_id = ?`;
      params.push(employee_id);
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

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error searching attendance:", error);
    res.status(500).json({ message: "Failed to search attendance" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [byStatus] = await db.query(
      `SELECT status, COUNT(*) as count FROM attendance GROUP BY status`
    );
    const [today] = await db.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
         SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
         SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_day,
         ROUND(AVG(hours_worked), 2) as avg_hours
       FROM attendance WHERE attendance_date = CURDATE()`
    );
    res.json({ byStatus, today: today[0] || {} });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ message: "Failed to fetch attendance statistics" });
  }
};

exports.bulkCreate = async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "records array is required" });
    }

    let created = 0;
    for (const rec of records) {
      const { employee_id, attendance_date, check_in, check_out, status } = rec;
      if (!employee_id || !attendance_date) continue;

      const hours_worked = computeHoursWorked(check_in, check_out);
      const finalStatus = deriveStatus({
        checkIn: check_in,
        checkOut: check_out,
        hoursWorked: hours_worked,
        explicitStatus: status
      });

      await db.query(
        `INSERT INTO attendance
         (employee_id, attendance_date, check_in, check_out, hours_worked, status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           check_in = VALUES(check_in),
           check_out = VALUES(check_out),
           hours_worked = VALUES(hours_worked),
           status = VALUES(status)`,
        [
          employee_id,
          attendance_date,
          check_in || null,
          check_out || null,
          hours_worked,
          finalStatus
        ]
      );
      created += 1;
    }

    res.status(201).json({ message: `Processed ${created} attendance records`, created });
  } catch (error) {
    console.error("Error bulk creating attendance:", error);
    res.status(500).json({ message: "Failed to bulk create attendance" });
  }
};
