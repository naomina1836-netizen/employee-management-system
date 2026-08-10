import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function Reports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [employeeStats, setEmployeeStats] = useState(null);
    const [leaveStats, setLeaveStats] = useState(null);
    const [payrollStats, setPayrollStats] = useState(null);
    const [performanceStats, setPerformanceStats] = useState(null);

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        try {
            setError("");

            const [employees, leaves, payroll, performance] = await Promise.allSettled([
                api.get("/employees/stats"),
                api.get("/leaves/stats"),
                api.get("/payroll/stats"),
                api.get("/performance/stats")
            ]);

            const failedRequests = [];

            if (employees.status === "fulfilled") {
                setEmployeeStats(employees.value.data);
            } else {
                failedRequests.push("employee");
                console.error("Error loading employee stats:", employees.reason);
            }

            if (leaves.status === "fulfilled") {
                setLeaveStats(leaves.value.data);
            } else {
                failedRequests.push("leave");
                console.error("Error loading leave stats:", leaves.reason);
            }

            if (payroll.status === "fulfilled") {
                setPayrollStats(payroll.value.data);
            } else {
                failedRequests.push("payroll");
                console.error("Error loading payroll stats:", payroll.reason);
            }

            if (performance.status === "fulfilled") {
                setPerformanceStats(performance.value.data);
            } else {
                failedRequests.push("performance");
                console.error("Error loading performance stats:", performance.reason);
            }

            if (failedRequests.length === 4) {
                setError("Failed to load report data");
                toast.error("Failed to load reports");
            } else if (failedRequests.length > 0) {
                setError("Some report sections failed to load");
                toast.error("Some report sections failed to load");
            }
        } catch (error) {
            console.error("Error loading reports:", error);
            setError("Failed to load reports");
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    }

    const formatNumber = (value, fallback = 0) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return fallback;
        }

        return Number(value).toLocaleString();
    };

    const formatScore = (value) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return "0.00";
        }

        return Number(value).toFixed(2);
    };

    const employeeTotal = employeeStats?.total || 0;
    const leaveTotal = leaveStats?.total || 0;
    const payrollThisMonth = payrollStats?.thisMonthTotal || 0;
    const averageScore = performanceStats?.averageScores?.avg_overall || 0;

    if (loading) {
        return <div className="loading-container loading-panel">Loading reports...</div>;
    }

    return (
        <div className="page-container reports-page">
            <div className="page-hero">
                <div>
                    <span className="eyebrow">Analytics overview</span>
                    <h1>Reports Dashboard</h1>
                    <p>Snapshot of employees, leave, payroll, and performance activity.</p>
                </div>
                <button className="btn-primary report-refresh" onClick={loadReports}>
                    Refresh data
                </button>
            </div>

            {error ? <div className="report-alert">{error}</div> : null}

            <div className="report-summary-grid">
                <div className="report-summary-card">
                    <span className="summary-label">Employees</span>
                    <strong>{formatNumber(employeeTotal)}</strong>
                    <p>{employeeStats?.byDepartment?.length || 0} departments represented</p>
                </div>
                <div className="report-summary-card">
                    <span className="summary-label">Leave requests</span>
                    <strong>{formatNumber(leaveTotal)}</strong>
                    <p>{leaveStats?.pending || 0} pending approvals</p>
                </div>
                <div className="report-summary-card">
                    <span className="summary-label">Payroll this month</span>
                    <strong>ETB {formatNumber(payrollThisMonth)}</strong>
                    <p>{payrollStats?.topEarners?.length || 0} top earners highlighted</p>
                </div>
                <div className="report-summary-card">
                    <span className="summary-label">Average score</span>
                    <strong>{formatScore(averageScore)}</strong>
                    <p>Across the current performance reviews</p>
                </div>
            </div>

            <div className="report-sections">
                <section className="report-section">
                    <div className="report-section-header">
                        <h2>Employee Statistics</h2>
                        <span>{employeeStats?.byDepartment?.length || 0} departments</span>
                    </div>
                    <div className="stats-grid report-stats-grid">
                        <div className="stat-card stat-card-compact">
                            <h3>Total Employees</h3>
                            <p className="stat-number">{formatNumber(employeeTotal)}</p>
                        </div>
                        <div className="stat-card stat-card-compact">
                            <h3>Departments</h3>
                            <p className="stat-number">{employeeStats?.byDepartment?.length || 0}</p>
                        </div>
                    </div>
                    <div className="report-chart">
                        <div className="report-section-header sub">
                            <h4>By Department</h4>
                            <span>Active staff distribution</span>
                        </div>
                        <div className="department-bars">
                            {(employeeStats?.byDepartment || []).map((dept) => {
                                const width = employeeTotal ? (dept.count / employeeTotal) * 100 : 0;

                                return (
                                    <div key={dept.department_name} className="bar-item">
                                        <span className="bar-label">{dept.department_name}</span>
                                        <div className="bar-track">
                                            <div
                                                className="bar-fill"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                        <span className="bar-count">{dept.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="report-section">
                    <div className="report-section-header">
                        <h2>Leave Statistics</h2>
                        <span>{leaveStats?.byStatus?.length || 0} status groups</span>
                    </div>
                    <div className="stats-grid report-stats-grid">
                        <div className="stat-card stat-card-compact">
                            <h3>Total Requests</h3>
                            <p className="stat-number">{formatNumber(leaveTotal)}</p>
                        </div>
                        <div className="stat-card stat-card-compact">
                            <h3>Pending</h3>
                            <p className="stat-number pending">{formatNumber(leaveStats?.pending || 0)}</p>
                        </div>
                    </div>
                    <div className="status-breakdown">
                        {(leaveStats?.byStatus || []).map((status) => (
                            <div key={status.status} className="status-item">
                                <span className={`status-badge ${String(status.status).toLowerCase()}`}>
                                    {status.status}
                                </span>
                                <span>{status.count}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="report-section">
                    <div className="report-section-header">
                        <h2>Payroll Statistics</h2>
                        <span>{payrollStats?.topEarners?.length || 0} top earners</span>
                    </div>
                    <div className="stats-grid report-stats-grid">
                        <div className="stat-card stat-card-compact">
                            <h3>This Month</h3>
                            <p className="stat-number">ETB {formatNumber(payrollThisMonth)}</p>
                        </div>
                        <div className="stat-card stat-card-compact">
                            <h3>Top Earners</h3>
                            <div className="mini-list">
                                {(payrollStats?.topEarners || []).length === 0 ? (
                                    <p className="muted-copy">No payroll data yet</p>
                                ) : (
                                    payrollStats.topEarners.map((earner, index) => (
                                        <p key={`${earner.employee_name}-${index}`}>
                                            {index + 1}. {earner.employee_name}
                                        </p>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="report-section">
                    <div className="report-section-header">
                        <h2>Performance Statistics</h2>
                        <span>{performanceStats?.totalReviews || 0} reviews</span>
                    </div>
                    <div className="stats-grid report-stats-grid">
                        <div className="stat-card stat-card-compact">
                            <h3>Total Reviews</h3>
                            <p className="stat-number">{formatNumber(performanceStats?.totalReviews || 0)}</p>
                        </div>
                        <div className="stat-card stat-card-compact">
                            <h3>Average Score</h3>
                            <p className="stat-number">{formatScore(averageScore)}</p>
                        </div>
                    </div>
                    <div className="score-breakdown">
                        <div className="score-item">
                            <span>Teamwork</span>
                            <span>{formatScore(performanceStats?.averageScores?.avg_teamwork)}/5</span>
                        </div>
                        <div className="score-item">
                            <span>Communication</span>
                            <span>{formatScore(performanceStats?.averageScores?.avg_communication)}/5</span>
                        </div>
                        <div className="score-item">
                            <span>Productivity</span>
                            <span>{formatScore(performanceStats?.averageScores?.avg_productivity)}/5</span>
                        </div>
                        <div className="score-item">
                            <span>Leadership</span>
                            <span>{formatScore(performanceStats?.averageScores?.avg_leadership)}/5</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Reports;
