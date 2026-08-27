import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function EditEmployee() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        gender: "Male",
        phone: "",
        email: "",
        address: "",
        date_of_birth: "",
        hire_date: "",
        department_id: "",
        position_id: "",
        manager_id: "",
        employment_status: "Active"
    });

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            const [employeeRes, deptRes, posRes, empRes] = await Promise.all([
                api.get(`/employees/${id}`),
                api.get("/employees/departments"),
                api.get("/employees/positions"),
                api.get("/employees")
            ]);
            
            setFormData(employeeRes.data);
            setDepartments(deptRes.data);
            setPositions(posRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            console.error("Error loading employee:", error);
            toast.error("Failed to load employee data");
            navigate("/employees");
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "department_id") {
            const departmentManagers = employees.filter(
                (employee) =>
                    String(employee.department_id) === String(value) &&
                    employee.user_role === "Manager"
            );
            setFormData({
                ...formData,
                department_id: value,
                position_id: "", // reset position when department changes
                manager_id: departmentManagers.length === 1
                    ? String(departmentManagers[0].employee_id)
                    : ""
            });
            return;
        }
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const filteredPositions = formData.department_id
        ? positions.filter(
              (pos) =>
                  String(pos.department_id) === String(formData.department_id) ||
                  pos.department_id == null
          )
        : positions;

    const departmentManagers = formData.department_id
        ? employees.filter(
              (employee) =>
                  String(employee.department_id) === String(formData.department_id) &&
                  employee.user_role === "Manager"
          )
        : [];
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(`/employees/${id}`, formData);
            navigate("/employees");
        } catch (error) {
            console.error("Error updating employee:", error);
            toast.error(error.response?.data?.message || "Failed to update employee");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading employee data...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Edit Employee</h1>
                <button className="btn-secondary" onClick={() => navigate("/employees")}>
                    Cancel
                </button>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth?.split('T')[0] || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Hire Date</label>
                        <input
                            type="date"
                            name="hire_date"
                            value={formData.hire_date?.split('T')[0] || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <select name="department_id" value={formData.department_id || ""} onChange={handleChange}>
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept.department_id} value={dept.department_id}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Position</label>
                        <select
                            name="position_id"
                            value={formData.position_id || ""}
                            onChange={handleChange}
                            disabled={!formData.department_id}
                        >
                            <option value="">
                                {formData.department_id ? "Select Position" : "Select department first"}
                            </option>
                            {filteredPositions.map((pos) => (
                                <option key={pos.position_id} value={pos.position_id}>
                                    {pos.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Department Manager</label>
                        <select
                            name="manager_id"
                            value={formData.manager_id || ""}
                            onChange={handleChange}
                            disabled={!formData.department_id}
                        >
                            <option value="">
                                {!formData.department_id
                                    ? "Select department first"
                                    : departmentManagers.length
                                        ? "Select Department Manager"
                                        : "No manager assigned to this department"}
                            </option>
                            {departmentManagers.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Employment Status</label>
                        <select name="employment_status" value={formData.employment_status} onChange={handleChange}>
                            <option value="Active">Active</option>
                            <option value="Resigned">Resigned</option>
                            <option value="Terminated">Terminated</option>
                        </select>
                    </div>

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Update Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditEmployee;
