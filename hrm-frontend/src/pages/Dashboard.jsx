import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
    Building2,
    ClipboardList,
    Star,
    Users,
    Wallet,
} from "lucide-react";

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        totalLeaves: 0,
        pendingLeaves: 0,
        totalPayroll: 0,
        totalReviews: 0,
        todayAttendance: { total: 0, present: 0, absent: 0, late: 0 }
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
        return <div className="loading-container">Loading dashboard...</div>;
    }

    const isAdminOrHR = ["Admin", "HR"].includes(user?.role);
    const isManager = user?.role === "Manager";
    const isStaff = isAdminOrHR || isManager;
    const staffOnlyPath = isStaff ? "/employees" : "/profile";
    const isPersonal = stats.scope === "personal";
    const isTeam = stats.scope === "team";
    const employeeLabel = isPersonal ? "My Profile" : isTeam ? "Team Members" : "Total Employees";
    const departmentLabel = isPersonal ? "My Department" : isTeam ? "Team Departments" : "Departments";
    const leaveLabel = isPersonal ? "My Leave Requests" : isTeam ? "Team Leave Requests" : "Leave Requests";
    const payrollLabel = isPersonal ? "My Payroll Records" : isTeam ? "Team Payroll Records" : "Payroll Records";
    const reviewLabel = isPersonal ? "My Performance Reviews" : isTeam ? "Team Performance Reviews" : "Performance Reviews";

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back, {user?.username}. Choose an action to continue.</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {isAdminOrHR && <Link to="/employees/create" className="btn-primary">Add Employee</Link>}
                    {isAdminOrHR && <Link to="/attendance/bulk" className="btn-secondary">Record Attendance</Link>}
                    {isManager && <Link to="/leaves" className="btn-primary">Review Leave</Link>}
                    {!isAdminOrHR && !isManager && <Link to="/attendance/self" className="btn-primary">My Attendance</Link>}
                    {!isAdminOrHR && !isManager && <Link to="/leaves/create" className="btn-secondary">Request Leave</Link>}
                </div>
            </div>

            <div className="stats-grid">
                <Link to={staffOnlyPath} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="stat-icon">
                        <Users size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalEmployees}</h3>
                        <p>{employeeLabel}</p>
                    </div>
                </Link>
                <Link to={staffOnlyPath} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="stat-icon">
                        <Building2 size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalDepartments}</h3>
                        <p>{departmentLabel}</p>
                    </div>
                </Link>
                <Link to="/leaves" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="stat-icon">
                        <ClipboardList size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalLeaves}</h3>
                        <p>{leaveLabel}</p>
                        <span className="stat-badge pending">{stats.pendingLeaves} Pending</span>
                    </div>
                </Link>
                <Link to="/payroll" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="stat-icon">
                        <Wallet size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalPayroll}</h3>
                        <p>{payrollLabel}</p>
                    </div>
                </Link>
                <Link to="/performance" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="stat-icon">
                        <Star size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalReviews}</h3>
                        <p>{reviewLabel}</p>
                    </div>
                </Link>
            </div>

            <div className="attendance-summary">
                <h2>{isPersonal ? "My Attendance Today" : isTeam ? "Team Attendance Today" : "Today's Attendance"}</h2>
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
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
