import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EmployeeList from "./pages/EmployeeList";
import CreateEmployee from "./pages/CreateEmployee";
import EditEmployee from "./pages/EditEmployee";
import EmployeeDetails from "./pages/EmployeeDetails";
import CreateLeave from "./pages/CreateLeave";
import LeaveList from "./pages/LeaveList";
import AttendanceList from "./pages/AttendanceList";
import CreateAttendance from "./pages/CreateAttendance";
import AttendanceSelf from "./pages/AttendanceSelf";
import AttendanceDetails from "./pages/AttendanceDetails";
import EditAttendance from "./pages/EditAttendance";
import CreatePayroll from "./pages/CreatePayroll";
import PayrollDetails from "./pages/PayrollDetails";
import EditPayroll from "./pages/EditPayroll";
import PayrollList from "./pages/PayrollList";
import CreatePerformance from "./pages/CreatePerformance";
import PerformanceDetails from "./pages/PerformanceDetails";
import EditPerformance from "./pages/EditPerformance";
import PerformanceList from "./pages/PerformanceList";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import AdminUsers from "./pages/AdminUsers";

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    const isAdminOrHR = user.role === "Admin" || user.role === "HR";

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="employees/create" element={<CreateEmployee />} />
                <Route path="employees/edit/:id" element={<EditEmployee />} />
                <Route path="employees/:id" element={<EmployeeDetails />} />
                <Route path="leaves" element={<LeaveList />} />
                <Route path="leaves/create" element={<CreateLeave />} />
                <Route path="attendance" element={<AttendanceList />} />
                <Route path="attendance/create" element={<CreateAttendance />} />
                <Route path="attendance/self" element={<AttendanceSelf />} />
                <Route path="attendance/:id" element={<AttendanceDetails />} />
                <Route path="attendance/edit/:id" element={<EditAttendance />} />
                <Route path="payroll" element={<PayrollList />} />
                <Route path="payroll/create" element={<CreatePayroll />} />
                <Route path="payroll/:id" element={<PayrollDetails />} />
                <Route path="payroll/edit/:id" element={<EditPayroll />} />
                <Route path="performance" element={<PerformanceList />} />
                <Route path="performance/create" element={<CreatePerformance />} />
                <Route path="performance/:id" element={<PerformanceDetails />} />
                <Route path="performance/edit/:id" element={<EditPerformance />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reports" element={<Reports />} />
                {isAdminOrHR && (
                    <Route path="admin/users" element={<AdminUsers />} />
                )}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
