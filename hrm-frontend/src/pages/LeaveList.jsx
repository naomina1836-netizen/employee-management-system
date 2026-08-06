import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";

function LeaveList() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        loadLeaves();
    }, [filters]);

    async function loadLeaves() {
        setLoading(true);
        try {
            let url = "/leaves";
            const params = new URLSearchParams();
            if (filters.keyword) params.append("keyword", filters.keyword);
            if (filters.status) params.append("status", filters.status);
            
            const query = params.toString();
            if (query) url += `/search?${query}`;
            
            const response = await api.get(url);
            setLeaves(response.data);
        } catch (error) {
            console.error("Error loading leaves:", error);
            toast.error("Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (keyword) => {
        setFilters({ ...filters, keyword });
    };

    const handleStatusFilter = (e) => {
        setFilters({ ...filters, status: e.target.value });
    };

    const updateStatus = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this leave request?`)) return;

        try {
            await api.patch(`/leaves/${id}/status`, { status });
            toast.success(`Leave request ${status.toLowerCase()} successfully!`);
            loadLeaves();
        } catch (error) {
            console.error("Error updating leave status:", error);
            toast.error("Failed to update leave status");
        }
    };

    if (loading) {
        return <div className="loading-container">Loading leave requests...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Leave Requests ({leaves.length})</h1>
                <Link to="/leaves/create" className="btn-primary">
                    Request Leave
                </Link>
            </div>

            <div className="filter-section">
                <SearchBar onSearch={handleSearch} placeholder="Search by employee name..." />
                <div className="filter-group">
                    <select onChange={handleStatusFilter} defaultValue="">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
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
                                        {leave.status === 'Pending' && (
                                            <>
                                                <button 
                                                    onClick={() => updateStatus(leave.leave_id, 'Approved')}
                                                    className="btn-sm btn-approve"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(leave.leave_id, 'Rejected')}
                                                    className="btn-sm btn-danger"
                                                >
                                                    Reject
                                                </button>
                                            </>
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