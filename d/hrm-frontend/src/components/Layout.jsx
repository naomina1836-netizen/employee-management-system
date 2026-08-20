import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import AIAssistant from "./AIAssistant";
import { useAuth } from "../context/AuthContext";

function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const topLevel = location.pathname.split("/")[1] || "dashboard";
  const routeClass = `route-${topLevel}`;

  const titleMap = {
    dashboard: "Dashboard",
    employees: "Employees",
    leaves: "Leave",
    attendance: "Attendance",
    payroll: "Payroll",
    performance: "Performance",
    notifications: "Notifications",
    reports: "Reports",
    profile: "Profile",
    admin: "Administration"
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className={`main-shell ${routeClass}`}>
        <header className="topbar glass-panel">
          <div>
            <p className="topbar-kicker">D.E.N.Y HRMS</p>
            <h1 className="topbar-title">{titleMap[topLevel] || "D.E.N.Y HRMS"}</h1>
          </div>
          <div className="topbar-user">
            <div className="avatar-circle">{(user?.username || "U").slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.username || "User"}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
        </header>
        <div className={`main-content ${routeClass}`}>
          <Outlet />
        </div>
      </div>
      <AIAssistant />
    </div>
  );
}

export default Layout;
