import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function EmployeeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const canEdit = user?.role === "Admin";
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployee();
    }, [id]);

    async function loadEmployee() {
        setLoading(true);
        try {
            const response = await api.get(`/employees/${id}`);
            setEmployee(response.data);
        } catch (error) {
            console.error("Error loading employee details:", error);
            toast.error(error.response?.data?.message || "Failed to load employee");
            navigate("/employees");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading employee details...</div>;
    }

    if (!employee) {
        return <div className="empty-state">Employee not found</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>{employee.first_name} {employee.last_name}</h1>
                    <p>Employee #{employee.employee_id}</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {canEdit && <Link to={`/employees/edit/${employee.employee_id}`} className="btn-primary">
                        Edit Employee
                    </Link>}
                    {canEdit && (
                        <>
                            <Link
                                to={`/admin/audit-logs?table_name=employees&record_id=${employee.employee_id}`}
                                className="btn-secondary"
                            >
                                View Audit
                            </Link>
                            <span className="permission-hint" style={{ alignSelf: "center" }}>
                                Admin only
                            </span>
                        </>
                    )}
                    <button className="btn-secondary" onClick={() => navigate("/employees")}>
                        Back to List
                    </button>
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-field">
                        <label>Status</label>
                        <p>
                            <span className={`status-badge ${employee.employment_status?.toLowerCase()}`}>
                                {employee.employment_status || "Active"}
                            </span>
                        </p>
                    </div>
                    <div className="profile-field">
                        <label>Full Name</label>
                        <p>{employee.first_name} {employee.last_name}</p>
                    </div>
                    <div className="profile-field">
                        <label>Email</label>
                        <p>{employee.email || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Phone</label>
                        <p>{employee.phone || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Gender</label>
                        <p>{employee.gender || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Department</label>
                        <p>{employee.department_name || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Position</label>
                        <p>{employee.position_title || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Manager</label>
                        <p>{employee.manager_name || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Hire Date</label>
                        <p>{formatDate(employee.hire_date)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Date of Birth</label>
                        <p>{formatDate(employee.date_of_birth)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Address</label>
                        <p>{employee.address || "-"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDetails;
