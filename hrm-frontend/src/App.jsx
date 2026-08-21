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
import BulkAttendance from "./pages/BulkAttendance";
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
    const isStaff = ["Admin", "HR", "Manager"].includes(user.role);
    const canManageAttendance = isAdminOrHR;
    const canManagePayroll = isAdminOrHR;
    const canManagePerformance = isStaff;

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="employees" element={isStaff ? <EmployeeList /> : <Navigate to="/dashboard" replace />} />
                <Route path="employees/create" element={isAdminOrHR ? <CreateEmployee /> : <Navigate to="/employees" replace />} />
                <Route path="employees/edit/:id" element={isAdminOrHR ? <EditEmployee /> : <Navigate to="/employees" replace />} />
                <Route path="employees/:id" element={isStaff ? <EmployeeDetails /> : <Navigate to="/dashboard" replace />} />
                <Route path="leaves" element={<LeaveList />} />
                <Route path="leaves/create" element={<CreateLeave />} />
                <Route path="attendance" element={isStaff ? <AttendanceList /> : <Navigate to="/attendance/self" replace />} />
                <Route path="attendance/create" element={canManageAttendance ? <CreateAttendance /> : <Navigate to="/attendance" replace />} />
                <Route path="attendance/bulk" element={canManageAttendance ? <BulkAttendance /> : <Navigate to="/attendance" replace />} />
                <Route path="attendance/self" element={<AttendanceSelf />} />
                <Route path="attendance/:id" element={isStaff ? <AttendanceDetails /> : <Navigate to="/attendance/self" replace />} />
                <Route path="attendance/edit/:id" element={canManageAttendance ? <EditAttendance /> : <Navigate to="/attendance" replace />} />
                <Route path="payroll" element={<PayrollList />} />
                <Route path="payroll/create" element={canManagePayroll ? <CreatePayroll /> : <Navigate to="/payroll" replace />} />
                <Route path="payroll/:id" element={isStaff ? <PayrollDetails /> : <Navigate to="/payroll" replace />} />
                <Route path="payroll/edit/:id" element={canManagePayroll ? <EditPayroll /> : <Navigate to="/payroll" replace />} />
                <Route path="performance" element={<PerformanceList />} />
                <Route path="performance/create" element={canManagePerformance ? <CreatePerformance /> : <Navigate to="/performance" replace />} />
                <Route path="performance/:id" element={isStaff ? <PerformanceDetails /> : <Navigate to="/performance" replace />} />
                <Route path="performance/edit/:id" element={canManagePerformance ? <EditPerformance /> : <Navigate to="/performance" replace />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reports" element={<Reports />} />
                {isAdminOrHR && <Route path="admin/users" element={<AdminUsers />} />}
                {!isAdminOrHR && <Route path="admin/users" element={<Navigate to="/dashboard" replace />} />}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
