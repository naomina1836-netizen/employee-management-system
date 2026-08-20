const db = require("../config/db");

exports.getStats = async (req, res) => {
    try {
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