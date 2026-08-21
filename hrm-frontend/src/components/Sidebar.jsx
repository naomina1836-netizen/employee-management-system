import { useState } from "react";
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
    X,
} from "lucide-react";

function Sidebar() {
    const { user, logout } = useAuth();
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const attendancePath = user?.role === "Employee" ? "/attendance/self" : "/attendance";

    const handleLogout = () => {
        setLogoutDialogOpen(false);
        logout();
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/employees", label: "Employees", icon: Users },
        { path: "/leaves", label: "Leave Requests", icon: ClipboardList },
        { path: attendancePath, label: "Attendance", icon: CalendarCheck2 },
        { path: "/payroll", label: "Payroll", icon: Wallet },
        { path: "/performance", label: "Performance", icon: Star },
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/reports", label: "Reports", icon: BarChart3, roles: ["Admin", "HR"] },
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
        <>
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
                <button onClick={() => setLogoutDialogOpen(true)} className="logout-btn">
                    <LogOut size={16} strokeWidth={2.2} />
                    Logout
                </button>
                </div>
            </div>

            {logoutDialogOpen && (
                <div
                    className="modal-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setLogoutDialogOpen(false);
                    }}
                >
                    <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setLogoutDialogOpen(false)}
                            aria-label="Close logout dialog"
                        >
                            <X size={18} />
                        </button>
                        <span className="eyebrow">Secure session</span>
                        <h2 id="logout-dialog-title">Ready to sign out?</h2>
                        <p>Your session will end on this device. You can sign in again whenever you need to continue.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setLogoutDialogOpen(false)}>
                                Stay signed in
                            </button>
                            <button type="button" className="logout-btn logout-confirm" onClick={handleLogout}>
                                <LogOut size={16} strokeWidth={2.2} />
                                Sign out
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}

export default Sidebar;
