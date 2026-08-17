import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
    Building2,
    ClipboardList,
    Star,
    Users,
    Wallet,
} from "lucide-react";

function Dashboard() {
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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Users size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalEmployees}</h3>
                        <p>Total Employees</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Building2 size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalDepartments}</h3>
                        <p>Departments</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <ClipboardList size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalLeaves}</h3>
                        <p>Leave Requests</p>
                        <span className="stat-badge pending">{stats.pendingLeaves} Pending</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Wallet size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalPayroll}</h3>
                        <p>Payroll Records</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Star size={28} strokeWidth={2.2} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.totalReviews}</h3>
                        <p>Performance Reviews</p>
                    </div>
                </div>
            </div>

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
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
