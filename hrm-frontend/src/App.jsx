import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import CreateEmployee from "./pages/CreateEmployee";
import EditEmployee from "./pages/EditEmployee";
import LeaveList from "./pages/LeaveList";
import CreateLeave from "./pages/CreateLeave";
import AttendanceList from "./pages/AttendanceList";
import CreateAttendance from "./pages/CreateAttendance";
import PayrollList from "./pages/PayrollList";
import CreatePayroll from "./pages/CreatePayroll";
import PerformanceList from "./pages/PerformanceList";
import CreatePerformance from "./pages/CreatePerformance";
import Reports from "./pages/Reports";

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
                
                {/* Employee Routes */}
                <Route path="employees" element={<EmployeeList />} />
                <Route path="employees/create" element={<CreateEmployee />} />
                <Route path="employees/edit/:id" element={<EditEmployee />} />
                
                {/* Leave Routes */}
                <Route path="leaves" element={<LeaveList />} />
                <Route path="leaves/create" element={<CreateLeave />} />
                
                {/* Attendance Routes */}
                <Route path="attendance" element={<AttendanceList />} />
                <Route path="attendance/create" element={<CreateAttendance />} />
                
                {/* Payroll Routes */}
                <Route path="payroll" element={<PayrollList />} />
                <Route path="payroll/create" element={<CreatePayroll />} />
                
                {/* Performance Routes */}
                <Route path="performance" element={<PerformanceList />} />
                <Route path="performance/create" element={<CreatePerformance />} />
                
                {/* Reports */}
                <Route path="reports" element={<Reports />} />
            </Route>
        </Routes>
    );
}

export default App;