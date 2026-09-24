const db = require("../config/db");

exports.getStats = async (req, res) => {
    try {
        const isEmployee = req.user.role === "Employee";
        const isManager = req.user.role === "Manager";
        const employeeId = req.user.employee_id;

        if ((isEmployee || isManager) && !employeeId) {
            return res.status(400).json({ message: "No employee profile is linked to this user" });
        }

        if (isEmployee) {
            const [[employeeCount], [departmentCount], [leaveCount], [pendingLeaves], [payrollCount], [reviewCount], [todayAttendance]] = await Promise.all([
                db.query("SELECT COUNT(*) AS total FROM employees WHERE employee_id = ?", [employeeId]),
                db.query("SELECT COUNT(DISTINCT department_id) AS total FROM employees WHERE employee_id = ?", [employeeId]),
                db.query("SELECT COUNT(*) AS total FROM leave_requests WHERE employee_id = ?", [employeeId]),
                db.query("SELECT COUNT(*) AS total FROM leave_requests WHERE employee_id = ? AND status = 'Pending'", [employeeId]),
                db.query("SELECT COUNT(*) AS total FROM payroll WHERE employee_id = ?", [employeeId]),
                db.query("SELECT COUNT(*) AS total FROM performance_reviews WHERE employee_id = ?", [employeeId]),
                db.query(`SELECT COUNT(*) AS total,
                    COALESCE(SUM(status = 'Present'), 0) AS present,
                    COALESCE(SUM(status = 'Absent'), 0) AS absent,
                    COALESCE(SUM(status = 'Late'), 0) AS late
                    FROM attendance WHERE employee_id = ? AND attendance_date = CURDATE()`, [employeeId])
            ]);

            return res.json({
                scope: "personal",
                totalEmployees: employeeCount[0].total,
                totalDepartments: departmentCount[0].total,
                totalLeaves: leaveCount[0].total,
                pendingLeaves: pendingLeaves[0].total,
                totalPayroll: payrollCount[0].total,
                totalReviews: reviewCount[0].total,
                todayAttendance: todayAttendance[0]
            });
        }

        if (isManager) {
            const [[employeeCount], [departmentCount], [leaveCount], [pendingLeaves], [payrollCount], [reviewCount], [todayAttendance]] = await Promise.all([
                db.query("SELECT COUNT(*) AS total FROM employees WHERE manager_id = ? AND employment_status = 'Active'", [employeeId]),
                db.query("SELECT COUNT(DISTINCT department_id) AS total FROM employees WHERE manager_id = ?", [employeeId]),
                db.query(`SELECT COUNT(*) AS total FROM leave_requests l JOIN employees e ON e.employee_id = l.employee_id WHERE e.manager_id = ?`, [employeeId]),
                db.query(`SELECT COUNT(*) AS total FROM leave_requests l JOIN employees e ON e.employee_id = l.employee_id WHERE e.manager_id = ? AND l.status = 'Pending'`, [employeeId]),
                db.query(`SELECT COUNT(*) AS total FROM payroll p JOIN employees e ON e.employee_id = p.employee_id WHERE e.manager_id = ?`, [employeeId]),
                db.query(`SELECT COUNT(*) AS total FROM performance_reviews r JOIN employees e ON e.employee_id = r.employee_id WHERE e.manager_id = ?`, [employeeId]),
                db.query(`SELECT COUNT(*) AS total,
                    COALESCE(SUM(a.status = 'Present'), 0) AS present,
                    COALESCE(SUM(a.status = 'Absent'), 0) AS absent,
                    COALESCE(SUM(a.status = 'Late'), 0) AS late
                    FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
                    WHERE e.manager_id = ? AND a.attendance_date = CURDATE()`, [employeeId])
            ]);

            return res.json({
                scope: "team",
                totalEmployees: employeeCount[0].total,
                totalDepartments: departmentCount[0].total,
                totalLeaves: leaveCount[0].total,
                pendingLeaves: pendingLeaves[0].total,
                totalPayroll: payrollCount[0].total,
                totalReviews: reviewCount[0].total,
                todayAttendance: todayAttendance[0]
            });
        }

        const [employeeCount] = await db.query(
            "SELECT COUNT(*) as total FROM employees WHERE employment_status = 'Active'"
        );
        
        const [departmentCount] = await db.query(
            "SELECT COUNT(*) as total FROM departments"
        );
        
        const [leaveCount] = await db.query(
            "SELECT COUNT(*) as total FROM leave_requests"
        );
        
        const [pendingLeaves] = await db.query(
            "SELECT COUNT(*) as total FROM leave_requests WHERE status = 'Pending'"
        );
        
        const [payrollCount] = await db.query(
            "SELECT COUNT(*) as total FROM payroll"
        );
        
        const [reviewCount] = await db.query(
            "SELECT COUNT(*) as total FROM performance_reviews"
        );

        const [todayAttendance] = await db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
             FROM attendance 
             WHERE attendance_date = CURDATE()`
        );

        res.json({
            scope: "organization",
            totalEmployees: employeeCount[0].total || 0,
            totalDepartments: departmentCount[0].total || 0,
            totalLeaves: leaveCount[0].total || 0,
            pendingLeaves: pendingLeaves[0].total || 0,
            totalPayroll: payrollCount[0].total || 0,
            totalReviews: reviewCount[0].total || 0,
            todayAttendance: todayAttendance[0] || { total: 0, present: 0, absent: 0, late: 0 }
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};
