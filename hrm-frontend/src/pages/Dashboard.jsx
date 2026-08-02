import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        totalLeaves: 0,
        pendingLeaves: 0,
        todayAttendance: { total: 0, present: 0, absent: 0, late: 0, halfDay: 0 },
        totalPayroll: 0,
        totalReviews: 0,
        recentLeaves: [],
        recentAttendance: [],
        departmentStats: [],
        leaveTrends: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const response = await api.get("/dashboard/stats");
            setStats(response.data);
        } catch (error) {
            console.error("Error loading dashboard:", error);
            toast.error("Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <h2>Loading Dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Welcome back, {user?.username}</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{stats.totalEmployees}</h3>
                        <p>Total Employees</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-info">
                        <h3>{stats.totalDepartments}</h3>
                        <p>Departments</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <h3>{stats.totalLeaves}</h3>
                        <p>Leave Requests</p>
                        <span className="stat-badge pending">{stats.pendingLeaves} Pending</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3>{stats.totalPayroll}</h3>
                        <p>Payroll Records</p>
                    </div>
                </div>
            </div>

            {/* Attendance Stats */}
            <div className="attendance-summary">
                <h2>Today's Attendance</h2>
                <div className="attendance-stats">
                    <div className="attendance-stat present">
                        <span className="count">{stats.todayAttendance?.present || 0}</span>
                        <span className="label">Present</span>
                    </div>
                    <div className="attendance-stat absent">
                        <span className="count">{stats.todayAttendance?.absent || 0}</span>
                        <span className="label">Absent</span>
                    </div>
                    <div className="attendance-stat late">
                        <span className="count">{stats.todayAttendance?.late || 0}</span>
                        <span className="label">Late</span>
                    </div>
                    <div className="attendance-stat halfday">
                        <span className="count">{stats.todayAttendance?.halfDay || 0}</span>
                        <span className="label">Half Day</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-grid">
                {/* Recent Leaves */}
                <div className="recent-card">
                    <div className="card-header">
                        <h3>Recent Leave Requests</h3>
                        <Link to="/leaves">View All →</Link>
                    </div>
                    <div className="card-body">
                        {stats.recentLeaves?.length === 0 ? (
                            <p className="empty-message">No recent leave requests</p>
                        ) : (
                            stats.recentLeaves?.map((leave) => (
                                <div key={leave.leave_id} className="activity-item">
                                    <div className="activity-info">
                                        <span className="activity-name">{leave.employee_name}</span>
                                        <span className="activity-detail">{leave.leave_name}</span>
                                    </div>
                                    <span className={`status-badge ${leave.status.toLowerCase()}`}>
                                        {leave.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Attendance */}
                <div className="recent-card">
                    <div className="card-header">
                        <h3>Recent Attendance</h3>
                        <Link to="/attendance">View All →</Link>
                    </div>
                    <div className="card-body">
                        {stats.recentAttendance?.length === 0 ? (
                            <p className="empty-message">No recent attendance records</p>
                        ) : (
                            stats.recentAttendance?.map((att) => (
                                <div key={att.attendance_id} className="activity-item">
                                    <div className="activity-info">
                                        <span className="activity-name">{att.employee_name}</span>
                                        <span className="activity-detail">{att.attendance_date}</span>
                                    </div>
                                    <span className={`status-badge ${att.status.toLowerCase()}`}>
                                        {att.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Department Stats (Admin/HR only) */}
            {(user?.role === 'Admin' || user?.role === 'HR') && stats.departmentStats?.length > 0 && (
                <div className="department-stats">
                    <h2>Department Overview</h2>
                    <div className="department-grid">
                        {stats.departmentStats.map((dept) => (
                            <div key={dept.department_name} className="dept-card">
                                <span className="dept-name">{dept.department_name}</span>
                                <span className="dept-count">{dept.count} employees</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;