import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import LeaveList from "./pages/LeaveList";
import AttendanceList from "./pages/AttendanceList";
import PayrollList from "./pages/PayrollList";
import PerformanceList from "./pages/PerformanceList";

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="leaves" element={<LeaveList />} />
                <Route path="attendance" element={<AttendanceList />} />
                <Route path="payroll" element={<PayrollList />} />
                <Route path="performance" element={<PerformanceList />} />
            </Route>
        </Routes>
    );
}

export default App;