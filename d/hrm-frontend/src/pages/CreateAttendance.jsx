import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function CreateAttendance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: "",
        attendance_date: new Date().toISOString().split('T')[0],
        check_in: "",
        check_out: "",
        status: "Present"
    });

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
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/attendance", formData);
            toast.success("Attendance record created successfully!");
            navigate("/attendance");
        } catch (error) {
            console.error("Error creating attendance:", error);
            toast.error(error.response?.data?.message || "Failed to create attendance record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Add Attendance</h1>
                <button className="btn-secondary" onClick={() => navigate("/attendance")}>
                    Cancel
                </button>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Employee *</label>
                        <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date *</label>
                        <input
                            type="date"
                            name="attendance_date"
                            value={formData.attendance_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Check In</label>
                        <input
                            type="time"
                            name="check_in"
                            value={formData.check_in}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Check Out</label>
                        <input
                            type="time"
                            name="check_out"
                            value={formData.check_out}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Status *</label>
                        <select name="status" value={formData.status} onChange={handleChange} required>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Half Day">Half Day</option>
                        </select>
                    </div>

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Creating..." : "Create Attendance"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateAttendance;