import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
        }
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/employees", label: "Employees", icon: "👥" },
        { path: "/leaves", label: "Leave Requests", icon: "📋" },
        { path: "/attendance", label: "Attendance", icon: "✅" },
        { path: "/payroll", label: "Payroll", icon: "💰" },
        { path: "/performance", label: "Performance", icon: "⭐" },
        { path: "/reports", label: "Reports", icon: "📈" },
        { path: "/profile", label: "Profile", icon: "👤" }
    ];

    const filteredNav = navItems.filter(item => {
        if (user?.role === 'Employee') {
            return ['/dashboard', '/leaves', '/attendance', '/payroll', '/performance', '/profile'].includes(item.path);
        }
        return true;
    });

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>⚡ HRM</h2>
                <span className="user-role">{user?.role}</span>
            </div>

            <nav className="sidebar-nav">
                {filteredNav.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <span className="user-name">👤 {user?.username}</span>
                    <span className="user-email">{user?.email}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    🚪 Logout
                </button>
            </div>
        </div>
    );
}

export default Sidebar;