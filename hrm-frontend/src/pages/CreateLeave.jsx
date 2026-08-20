import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function CreateLeave() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: "",
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: ""
    });
    const [totalDays, setTotalDays] = useState(0);

    useEffect(() => {
        loadDropdownData();
    }, [user]);

    useEffect(() => {
        calculateDays();
    }, [formData.start_date, formData.end_date]);

    async function loadDropdownData() {
        try {
            if (user?.role === "Employee") {
                if (!user.employee_id) {
                    toast.error("Your account is not linked to an employee profile");
                    return;
                }
                const typeRes = await api.get("/leaves/types");
                setFormData((current) => ({ ...current, employee_id: String(user.employee_id) }));
                setLeaveTypes(typeRes.data);
                return;
            }

            const [empRes, typeRes] = await Promise.all([api.get("/employees"), api.get("/leaves/types")]);
            setEmployees(empRes.data);
            setLeaveTypes(typeRes.data);
        } catch (error) {
            console.error("Error loading dropdown data:", error);
            toast.error("Failed to load form data");
        }
    }

    function calculateDays() {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end - start);
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setTotalDays(days);
        } else {
            setTotalDays(0);
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
            await api.post("/leaves", formData);
            toast.success("Leave request submitted successfully!");
            navigate("/leaves");
        } catch (error) {
            console.error("Error creating leave request:", error);
            toast.error(error.response?.data?.message || "Failed to submit leave request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Request Leave</h1>
                <button className="btn-secondary" onClick={() => navigate("/leaves")}>
                    Cancel
                </button>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    {user?.role === "Employee" ? (
                    <div className="form-group">
                        <label>Employee</label>
                        <input value={user.username} disabled />
                    </div>
                    ) : (
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
                    )}

                    <div className="form-group">
                        <label>Leave Type *</label>
                        <select name="leave_type_id" value={formData.leave_type_id} onChange={handleChange} required>
                            <option value="">Select Leave Type</option>
                            {leaveTypes.map((type) => (
                                <option key={type.leave_type_id} value={type.leave_type_id}>
                                    {type.leave_name} (Max: {type.max_days} days)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Start Date *</label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>End Date *</label>
                        <input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Total Days</label>
                        <input type="text" value={totalDays} disabled style={{ background: "#f5f5f5" }} />
                    </div>

                    <div className="form-group full-width">
                        <label>Reason</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Enter reason for leave..."
                        />
                    </div>

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateLeave;
