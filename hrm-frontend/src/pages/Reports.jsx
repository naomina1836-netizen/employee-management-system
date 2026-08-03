import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function Reports() {
    const [loading, setLoading] = useState(true);
    const [employeeStats, setEmployeeStats] = useState(null);
    const [leaveStats, setLeaveStats] = useState(null);
    const [payrollStats, setPayrollStats] = useState(null);
    const [performanceStats, setPerformanceStats] = useState(null);

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        try {
            const [employees, leaves, payroll, performance] = await Promise.all([
                api.get("/employees/stats"),
                api.get("/leaves/stats"),
                api.get("/payroll/stats"),
                api.get("/performance/stats")
            ]);
            
            setEmployeeStats(employees.data);
            setLeaveStats(leaves.data);
            setPayrollStats(payroll.data);
            setPerformanceStats(performance.data);
        } catch (error) {
            console.error("Error loading reports:", error);
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading reports...</div>;
    }

    return (
        <div className="page-container">
            <h1>Reports Dashboard</h1>
            
            {/* Employee Statistics */}
            <div className="report-section">
                <h2>Employee Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Employees</h3>
                        <p className="stat-number">{employeeStats?.total || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Departments</h3>
                        <p className="stat-number">{employeeStats?.byDepartment?.length || 0}</p>
                    </div>
                </div>
                <div className="report-chart">
                    <h4>By Department</h4>
                    <div className="department-bars">
                        {employeeStats?.byDepartment?.map((dept) => (
                            <div key={dept.department_name} className="bar-item">
                                <span className="bar-label">{dept.department_name}</span>
                                <div className="bar-track">
                                    <div 
                                        className="bar-fill" 
                                        style={{ width: `${(dept.count / employeeStats.total) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="bar-count">{dept.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leave Statistics */}
            <div className="report-section">
                <h2>Leave Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Requests</h3>
                        <p className="stat-number">{leaveStats?.total || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pending</h3>
                        <p className="stat-number pending">{leaveStats?.pending || 0}</p>
                    </div>
                </div>
                <div className="status-breakdown">
                    {leaveStats?.byStatus?.map((status) => (
                        <div key={status.status} className="status-item">
                            <span className={`status-badge ${status.status.toLowerCase()}`}>
                                {status.status}
                            </span>
                            <span>{status.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payroll Statistics */}
            <div className="report-section">
                <h2>Payroll Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>This Month</h3>
                        <p className="stat-number">ETB {payrollStats?.thisMonthTotal?.toLocaleString() || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Top Earners</h3>
                        {payrollStats?.topEarners?.map((earner, index) => (
                            <p key={index}>{index + 1}. {earner.employee_name}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Statistics */}
            <div className="report-section">
                <h2>Performance Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Reviews</h3>
                        <p className="stat-number">{performanceStats?.totalReviews || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Average Score</h3>
                        <p className="stat-number">{performanceStats?.averageScores?.avg_overall?.toFixed(2) || 0}</p>
                    </div>
                </div>
                <div className="score-breakdown">
                    <div className="score-item">
                        <span>Teamwork</span>
                        <span>{performanceStats?.averageScores?.avg_teamwork?.toFixed(2) || 0}/5</span>
                    </div>
                    <div className="score-item">
                        <span>Communication</span>
                        <span>{performanceStats?.averageScores?.avg_communication?.toFixed(2) || 0}/5</span>
                    </div>
                    <div className="score-item">
                        <span>Productivity</span>
                        <span>{performanceStats?.averageScores?.avg_productivity?.toFixed(2) || 0}/5</span>
                    </div>
                    <div className="score-item">
                        <span>Leadership</span>
                        <span>{performanceStats?.averageScores?.avg_leadership?.toFixed(2) || 0}/5</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reports;