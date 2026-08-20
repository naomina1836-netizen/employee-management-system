import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function EditAttendance() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        check_in: "",
        check_out: "",
        status: "Present"
    });
    const [meta, setMeta] = useState({
        employee_name: "",
        attendance_date: ""
    });

    useEffect(() => {
        loadAttendance();
    }, [id]);

    async function loadAttendance() {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/${id}`);
            setFormData({
                check_in: response.data.check_in || "",
                check_out: response.data.check_out || "",
                status: response.data.status || "Present"
            });
            setMeta({
                employee_name: response.data.employee_name || "-",
                attendance_date: response.data.attendance_date || ""
            });
        } catch (error) {
            console.error("Error loading attendance:", error);
            toast.error(error.response?.data?.message || "Failed to load attendance record");
            navigate("/attendance");
        } finally {
            setLoading(false);
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
        setSaving(true);

        try {
            await api.put(`/attendance/${id}`, formData);
            toast.success("Attendance record updated successfully!");
            navigate(`/attendance/${id}`);
        } catch (error) {
            console.error("Error updating attendance:", error);
            toast.error(error.response?.data?.message || "Failed to update attendance record");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading attendance data...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Edit Attendance</h1>
                    <p>{meta.employee_name}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate(`/attendance/${id}`)}>
                    Cancel
                </button>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Employee</label>
                        <input type="text" value={meta.employee_name} disabled />
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={meta.attendance_date?.split("T")[0] || ""} disabled />
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
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange}>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Half Day">Half Day</option>
                        </select>
                    </div>

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Update Attendance"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditAttendance;
