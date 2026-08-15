import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function AttendanceList() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendance();
    }, []);

    async function loadAttendance() {
        try {
            const response = await api.get("/attendance");
            setAttendance(response.data);
        } catch (error) {
            console.error("Error loading attendance:", error);
            toast.error("Failed to load attendance records");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading attendance records...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Attendance</h1>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Link to="/attendance/bulk" className="btn-primary">
                        Bulk Attendance
                    </Link>
                    <Link to="/attendance/create" className="btn-secondary">
                        Add One
                    </Link>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Hours</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-row">No attendance records found</td>
                            </tr>
                        ) : (
                            attendance.map((att) => (
                                <tr key={att.attendance_id}>
                                    <td>{att.attendance_id}</td>
                                    <td>{att.employee_name || '-'}</td>
                                    <td>{new Date(att.attendance_date).toLocaleDateString()}</td>
                                    <td>{att.check_in || '-'}</td>
                                    <td>{att.check_out || '-'}</td>
                                    <td>{att.hours_worked || '0'}</td>
                                    <td>
                                        <span className={`status-badge ${att.status?.toLowerCase()}`}>
                                            {att.status || 'Present'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/attendance/${att.attendance_id}`} className="btn-sm">View</Link>
                                        <Link to={`/attendance/edit/${att.attendance_id}`} className="btn-sm btn-edit">Edit</Link>
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

export default AttendanceList;