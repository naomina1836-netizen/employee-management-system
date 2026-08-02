import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployees();
    }, []);

    async function loadEmployees() {
        try {
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (error) {
            console.error("Error loading employees:", error);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading employees...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Employees</h1>
                <Link to="/employees/create" className="btn-primary">
                    Add Employee
                </Link>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-row">No employees found</td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.employee_id}>
                                    <td>{emp.employee_id}</td>
                                    <td>{emp.first_name} {emp.last_name}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.department_name || '-'}</td>
                                    <td>{emp.position_title || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${emp.employment_status?.toLowerCase()}`}>
                                            {emp.employment_status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/employees/${emp.employee_id}`} className="btn-sm">View</Link>
                                        <Link to={`/employees/edit/${emp.employee_id}`} className="btn-sm btn-edit">Edit</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EmployeeList;