import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    CalendarCheck2,
    Wallet,
    Star,
    Bell,
    BarChart3,
    UserCircle2,
    LogOut,
    ShieldCheck,
} from "lucide-react";

function Sidebar() {
    const { user, logout } = useAuth();
    const attendancePath = user?.role === "Employee" ? "/attendance/self" : "/attendance";

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
        }
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/employees", label: "Employees", icon: Users },
        { path: "/leaves", label: "Leave Requests", icon: ClipboardList },
        { path: attendancePath, label: "Attendance", icon: CalendarCheck2 },
        { path: "/payroll", label: "Payroll", icon: Wallet },
        { path: "/performance", label: "Performance", icon: Star },
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/reports", label: "Reports", icon: BarChart3 },
        { path: "/profile", label: "Profile", icon: UserCircle2 }
    ];

    const filteredNav = navItems.filter((item) => {
        if (item.roles && !item.roles.includes(user?.role)) {
            return false;
        }
        if (user?.role === "Employee") {
            return ["/dashboard", "/leaves", "/attendance/self", "/payroll", "/performance", "/profile", "/notifications"].includes(item.path);
        }
        return true;
    });

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2><ShieldCheck size={22} strokeWidth={2.2} /> HRM</h2>
                <span className="user-role">{user?.role}</span>
            </div>

            <nav className="sidebar-nav">
                {filteredNav.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon" aria-hidden="true">
                            <item.icon size={18} strokeWidth={2.2} />
                        </span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <span className="user-name">
                        <UserCircle2 size={16} strokeWidth={2.2} />
                        {user?.username}
                    </span>
                    <span className="user-email">{user?.email}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={16} strokeWidth={2.2} />
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
