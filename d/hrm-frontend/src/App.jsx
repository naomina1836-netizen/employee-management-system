import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
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

const MGMT = ["Admin", "HR", "Manager"];
const HR_ADMIN = ["Admin", "HR"];
const MGMT_PERF = ["Admin", "HR", "Manager"];

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen page-loading">
        <div className="spinner" />
        <p>Loading D.E.N.Y HRMS…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />

        {}
        <Route path="employees" element={<ProtectedRoute roles={MGMT}><EmployeeList /></ProtectedRoute>} />
        <Route path="employees/create" element={<ProtectedRoute roles={HR_ADMIN}><CreateEmployee /></ProtectedRoute>} />
        <Route path="employees/edit/:id" element={<ProtectedRoute roles={HR_ADMIN}><EditEmployee /></ProtectedRoute>} />
        <Route path="employees/:id" element={<ProtectedRoute roles={MGMT}><EmployeeDetails /></ProtectedRoute>} />

        {}
        <Route path="leaves" element={<LeaveList />} />
        <Route path="leaves/create" element={<CreateLeave />} />

        {}
        <Route path="attendance" element={<ProtectedRoute roles={MGMT}><AttendanceList /></ProtectedRoute>} />
        <Route path="attendance/create" element={<ProtectedRoute roles={HR_ADMIN}><CreateAttendance /></ProtectedRoute>} />
        <Route path="attendance/bulk" element={<ProtectedRoute roles={HR_ADMIN}><BulkAttendance /></ProtectedRoute>} />
        <Route path="attendance/self" element={<AttendanceSelf />} />
        <Route path="attendance/:id" element={<ProtectedRoute roles={MGMT}><AttendanceDetails /></ProtectedRoute>} />
        <Route path="attendance/edit/:id" element={<ProtectedRoute roles={HR_ADMIN}><EditAttendance /></ProtectedRoute>} />

        {}
        <Route path="payroll" element={<PayrollList />} />
        <Route path="payroll/create" element={<ProtectedRoute roles={HR_ADMIN}><CreatePayroll /></ProtectedRoute>} />
        <Route path="payroll/:id" element={<PayrollDetails />} />
        <Route path="payroll/edit/:id" element={<ProtectedRoute roles={HR_ADMIN}><EditPayroll /></ProtectedRoute>} />

        {}
        <Route path="performance" element={<PerformanceList />} />
        <Route path="performance/create" element={<ProtectedRoute roles={MGMT_PERF}><CreatePerformance /></ProtectedRoute>} />
        <Route path="performance/:id" element={<PerformanceDetails />} />
        <Route path="performance/edit/:id" element={<ProtectedRoute roles={MGMT_PERF}><EditPerformance /></ProtectedRoute>} />

        {}
        <Route path="reports" element={<ProtectedRoute roles={MGMT}><Reports /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={HR_ADMIN}><AdminUsers /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
