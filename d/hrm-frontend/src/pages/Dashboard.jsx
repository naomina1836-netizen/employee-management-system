import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const isEmployee = user?.role === "Employee";
  const isMgmt = ["Admin", "HR", "Manager"].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, insightsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/ai/insights").catch(() => ({ data: { insights: [] } }))
        ]);
        if (!cancelled) {
          setStats(statsRes.data);
          setInsights(insightsRes.data?.insights || []);
        }
      } catch (e) {
        if (!cancelled) setError("Could not load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Preparing your workspace…</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const att = stats?.todayAttendance || {};

  return (
    <div className="dashboard-page">
      <section className="hero-banner glass-panel">
        <div>
          <p className="eyebrow">Good to see you</p>
          <h2>{user?.username || "Welcome"}</h2>
          <p className="muted">
            Here’s a live view of your workforce. Use the ✦ assistant anytime for guidance.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/leaves/create" className="btn-primary">
            Request leave
          </Link>
          <Link to="/attendance/self" className="btn-secondary">
            Attendance
          </Link>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card glass-panel">
          <div className="stat-icon">◎</div>
          <div className="stat-info">
            <h3>{stats?.totalEmployees ?? 0}</h3>
            <p>Active employees</p>
          </div>
        </article>
        <article className="stat-card glass-panel">
          <div className="stat-icon">▢</div>
          <div className="stat-info">
            <h3>{stats?.pendingLeaves ?? 0}</h3>
            <p>Pending leave</p>
            {(stats?.pendingLeaves || 0) > 0 && <span className="stat-badge pending">Action</span>}
          </div>
        </article>
        <article className="stat-card glass-panel">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <h3>{att.present ?? 0}</h3>
            <p>Present today</p>
          </div>
        </article>
        <article className="stat-card glass-panel">
          <div className="stat-icon">★</div>
          <div className="stat-info">
            <h3>{stats?.totalReviews ?? 0}</h3>
            <p>Performance reviews</p>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="recent-card glass-panel">
          <div className="card-header">
            <h3>Today’s attendance</h3>
          </div>
          <div className="card-body attendance-stats">
            <div className="attendance-stat present">
              <span className="count">{att.present ?? 0}</span>
              <span className="label">Present</span>
            </div>
            <div className="attendance-stat late">
              <span className="count">{att.late ?? 0}</span>
              <span className="label">Late</span>
            </div>
            <div className="attendance-stat absent">
              <span className="count">{att.absent ?? 0}</span>
              <span className="label">Absent</span>
            </div>
            <div className="attendance-stat halfday">
              <span className="count">{att.total ?? 0}</span>
              <span className="label">Records</span>
            </div>
          </div>
        </div>

        <div className="recent-card glass-panel ai-insights-card">
          <div className="card-header">
            <h3>AI insights</h3>
            <span className="ai-badge">Live</span>
          </div>
          <div className="card-body insights-list">
            {insights.length === 0 && <p className="muted">No insights yet.</p>}
            {insights.map((ins, i) => (
              <div key={i} className={`insight-item insight-${ins.type || "info"}`}>
                <strong>{ins.title}</strong>
                <p>{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="quick-links glass-panel">
        <h3>Quick links</h3>
        <div className="quick-links-grid">
          {isMgmt && <Link to="/employees">People directory</Link>}
          <Link to="/leaves">{isEmployee ? "My leave" : "Leave queue"}</Link>
          <Link to={isEmployee ? "/attendance/self" : "/attendance"}>Attendance</Link>
          <Link to="/payroll">{isEmployee ? "My payroll" : "Payroll"}</Link>
          {isMgmt && <Link to="/reports">Reports</Link>}
          <Link to="/profile">My profile</Link>
          <Link to="/notifications">Notifications</Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
