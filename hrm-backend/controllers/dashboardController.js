const db = require("../config/db");

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const role = req.user.role;
        const employeeId = req.user.employee_id;

        let stats = {};

        // Total Employees
        const [employeeCount] = await db.query(
            "SELECT COUNT(*) as total FROM employees WHERE employment_status = 'Active'"
        );
        stats.totalEmployees = employeeCount[0].total;

        // Total Departments
        const [departmentCount] = await db.query(
            "SELECT COUNT(*) as total FROM departments"
        );
        stats.totalDepartments = departmentCount[0].total;

        // Total Leave Requests
        const [leaveCount] = await db.query(
            "SELECT COUNT(*) as total FROM leave_requests"
        );
        stats.totalLeaves = leaveCount[0].total;

        // Pending Leave Requests
        const [pendingLeaves] = await db.query(
            "SELECT COUNT(*) as total FROM leave_requests WHERE status = 'Pending'"
        );
        stats.pendingLeaves = pendingLeaves[0].total;

        // Today's Attendance
        const [todayAttendance] = await db.query(
            `SELECT COUNT(*) as total, 
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
                    SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as halfDay
             FROM attendance WHERE attendance_date = CURDATE()`
        );
        stats.todayAttendance = todayAttendance[0];

        // Total Payroll Records
        const [payrollCount] = await db.query(
            "SELECT COUNT(*) as total FROM payroll"
        );
        stats.totalPayroll = payrollCount[0].total;

        // Total Performance Reviews
        const [reviewCount] = await db.query(
            "SELECT COUNT(*) as total FROM performance_reviews"
        );
        stats.totalReviews = reviewCount[0].total;

        // Recent Leave Requests (last 5)
        const [recentLeaves] = await db.query(
            `SELECT l.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    lt.leave_name
             FROM leave_requests l
             JOIN employees e ON l.employee_id = e.employee_id
             JOIN leave_types lt ON l.leave_type_id = lt.leave_type_id
             ORDER BY l.applied_at DESC
             LIMIT 5`
        );
        stats.recentLeaves = recentLeaves;

        // Recent Attendance (last 5)
        const [recentAttendance] = await db.query(
            `SELECT a.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             ORDER BY a.attendance_date DESC
             LIMIT 5`
        );
        stats.recentAttendance = recentAttendance;

        // If employee, get personal stats
        if (role === 'Employee' && employeeId) {
            // My leave requests
            const [myLeaves] = await db.query(
                `SELECT COUNT(*) as total, 
                        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
                 FROM leave_requests WHERE employee_id = ?`,
                [employeeId]
            );
            stats.myLeaves = myLeaves[0];

            // My attendance this month
            const [myAttendance] = await db.query(
                `SELECT COUNT(*) as total,
                        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
                 FROM attendance 
                 WHERE employee_id = ? AND MONTH(attendance_date) = MONTH(CURDATE()) AND YEAR(attendance_date) = YEAR(CURDATE())`,
                [employeeId]
            );
            stats.myAttendance = myAttendance[0];

            // My payroll (last month)
            const [myPayroll] = await db.query(
                `SELECT * FROM payroll 
                 WHERE employee_id = ? 
                 ORDER BY year DESC, FIELD(month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December') DESC
                 LIMIT 1`,
                [employeeId]
            );
            stats.myPayroll = myPayroll[0] || null;

            // My performance reviews
            const [myReviews] = await db.query(
                `SELECT * FROM performance_reviews 
                 WHERE employee_id = ? 
                 ORDER BY review_date DESC 
                 LIMIT 3`,
                [employeeId]
            );
            stats.myReviews = myReviews;
        }

        // If HR or Admin, get all stats
        if (role === 'Admin' || role === 'HR') {
            // Department wise employee count
            const [deptStats] = await db.query(
                `SELECT d.department_name, COUNT(e.employee_id) as count
                 FROM departments d
                 LEFT JOIN employees e ON d.department_id = e.department_id AND e.employment_status = 'Active'
                 GROUP BY d.department_id`
            );
            stats.departmentStats = deptStats;

            // Monthly leave trends (last 6 months)
            const [leaveTrends] = await db.query(
                `SELECT MONTHNAME(applied_at) as month, YEAR(applied_at) as year, COUNT(*) as count
                 FROM leave_requests
                 WHERE applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                 GROUP BY YEAR(applied_at), MONTH(applied_at)
                 ORDER BY YEAR(applied_at), MONTH(applied_at)`
            );
            stats.leaveTrends = leaveTrends;
        }

        res.json(stats);

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};