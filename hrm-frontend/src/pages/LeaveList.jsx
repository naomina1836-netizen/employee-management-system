import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function LeaveList() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaves();
    }, []);

    async function loadLeaves() {
        try {
            const response = await api.get("/leaves");
            setLeaves(response.data);
        } catch (error) {
            console.error("Error loading leaves:", error);
            toast.error("Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading leave requests...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Leave Requests</h1>
                <Link to="/leaves/create" className="btn-primary">
                    Request Leave
                </Link>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Employee</th>
                            <th>Leave Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Days</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-row">No leave requests found</td>
                            </tr>
                        ) : (
                            leaves.map((leave) => (
                                <tr key={leave.leave_id}>
                                    <td>{leave.leave_id}</td>
                                    <td>{leave.employee_name || '-'}</td>
                                    <td>{leave.leave_name || '-'}</td>
                                    <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                                    <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                                    <td>{leave.total_days}</td>
                                    <td>
                                        <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                                            {leave.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/leaves/${leave.leave_id}`} className="btn-sm">View</Link>
                                        {leave.status === 'Pending' && (
                                            <Link to={`/leaves/approve/${leave.leave_id}`} className="btn-sm btn-approve">Approve</Link>
                                        )}
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

export default LeaveList;