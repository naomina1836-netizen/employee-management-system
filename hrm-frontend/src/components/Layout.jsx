import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
    const location = useLocation();
    const topLevel = location.pathname.split("/")[1] || "dashboard";
    const routeClass = `route-${topLevel}`;

    return (
        <div className="layout">
            <Sidebar />
            <div className={`main-content ${routeClass}`}>
                <Outlet />
            </div>
        </div>
    );
}

export default Layout;
