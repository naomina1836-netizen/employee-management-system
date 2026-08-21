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

function AttendanceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const canManage = ["Admin", "HR"].includes(user?.role);
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadAttendance();
    }, [id]);

    async function loadAttendance() {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/${id}`);
            setAttendance(response.data);
        } catch (error) {
            console.error("Error loading attendance:", error);
            toast.error(error.response?.data?.message || "Failed to load attendance record");
            navigate("/attendance");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Delete this attendance record?")) return;

        setDeleting(true);
        try {
            await api.delete(`/attendance/${id}`);
            toast.success("Attendance record deleted successfully");
            navigate("/attendance");
        } catch (error) {
            console.error("Error deleting attendance:", error);
            toast.error(error.response?.data?.message || "Failed to delete attendance record");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading attendance details...</div>;
    }

    if (!attendance) {
        return <div className="empty-state">Attendance record not found</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Attendance #{attendance.attendance_id}</h1>
                    <p>{attendance.employee_name}</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {canManage && <Link to={`/attendance/edit/${attendance.attendance_id}`} className="btn-primary">
                        Edit Attendance
                    </Link>}
                    <button className="btn-secondary" onClick={() => navigate("/attendance")}>
                        Back to List
                    </button>
                    {canManage && <button className="btn-secondary" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                    </button>}
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-field">
                        <label>Employee</label>
                        <p>{attendance.employee_name}</p>
                    </div>
                    <div className="profile-field">
                        <label>Date</label>
                        <p>{formatDate(attendance.attendance_date)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Check In</label>
                        <p>{attendance.check_in || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Check Out</label>
                        <p>{attendance.check_out || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Hours Worked</label>
                        <p>{attendance.hours_worked ?? 0}</p>
                    </div>
                    <div className="profile-field">
                        <label>Status</label>
                        <p>
                            <span className={`status-badge ${attendance.status?.toLowerCase()}`}>
                                {attendance.status || "Present"}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttendanceDetails;
