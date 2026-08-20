import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const attendancePath = user?.role === "Employee" ? "/attendance/self" : "/attendance";

  const handleLogout = () => {
    if (window.confirm("Sign out of D.E.N.Y HRMS?")) logout();
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "◇" },
    { path: "/employees", label: "Employees", icon: "◎", roles: ["Admin", "HR", "Manager"] },
    { path: "/leaves", label: "Leave", icon: "▢" },
    { path: attendancePath, label: "Attendance", icon: "✓" },
    { path: "/payroll", label: "Payroll", icon: "◈" },
    { path: "/performance", label: "Performance", icon: "★" },
    { path: "/notifications", label: "Alerts", icon: "◉" },
    { path: "/reports", label: "Reports", icon: "▦", roles: ["Admin", "HR", "Manager"] },
    { path: "/admin/users", label: "Users", icon: "▣", roles: ["Admin", "HR"] },
    { path: "/profile", label: "Profile", icon: "○" }
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role)) return false;
    if (user?.role === "Employee") {
      return ["/dashboard", "/leaves", "/attendance/self", "/payroll", "/performance", "/profile", "/notifications"].includes(item.path);
    }
    return true;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-mark">D</div>
        <div>
          <h2>D.E.N.Y HRMS</h2>
          <span className="user-role">{user?.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-hint">Ask DENY AI about your workplace</p>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
