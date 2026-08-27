import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";

function LeaveList() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [searchVersion, setSearchVersion] = useState(0);
    const [filterVersion, setFilterVersion] = useState(0);
    const { user } = useAuth();
    const confirm = useConfirm();
    const isEmployee = user?.role === "Employee";
    const canApprove = ["Admin", "HR", "Manager"].includes(user?.role);
    const canDelete = ["Admin", "HR"].includes(user?.role);

    useEffect(() => {
        loadLeaveTypes();
    }, []);

    useEffect(() => {
        loadLeaves();
    }, [filters, user]);

    async function loadLeaveTypes() {
        try {
            const response = await api.get("/leaves/types");
            setLeaveTypes(response.data);
        } catch (error) {
            console.error("Error loading leave types:", error);
            toast.error("Failed to load leave filters");
        }
    }

    async function loadLeaves() {
        setLoading(true);
        try {
            if (isEmployee && !user?.employee_id) {
                setLeaves([]);
                return;
            }
            let url = isEmployee ? `/leaves/employee/${user.employee_id}` : "/leaves";
            const params = new URLSearchParams();
            if (filters.keyword) params.append("keyword", filters.keyword);
            if (filters.status) params.append("status", filters.status);
            if (filters.leave_type) params.append("leave_type", filters.leave_type);
            if (filters.start_date) params.append("start_date", filters.start_date);
            if (filters.end_date) params.append("end_date", filters.end_date);
            
            const query = params.toString();
            if (!isEmployee && query) url += `/search?${query}`;
            
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
        setSearchVersion((value) => value + 1);
    };

    const handleFilterChange = (name, value) => {
        if (value) {
            setFilters({ ...filters, [name]: value });
        } else {
            const nextFilters = { ...filters };
            delete nextFilters[name];
            setFilters(nextFilters);
        }
    };

    const clearFilters = () => {
        setFilters({});
        setSearchVersion((value) => value + 1);
        setFilterVersion((value) => value + 1);
    };

    const updateStatus = async (id, status) => {
        const confirmed = await confirm({
            title: "Update leave request",
            message: `Are you sure you want to ${status} this leave request?`,
            confirmText: status
        });
        if (!confirmed) return;

        try {
            await api.patch(`/leaves/${id}/status`, { status });
            loadLeaves();
        } catch (error) {
            console.error("Error updating leave status:", error);
            toast.error("Failed to update leave status");
        }
    };

    const deleteLeave = async (id) => {
        const confirmed = await confirm({
            title: "Delete leave request",
            message: "Delete this leave request?",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        try {
            await api.delete(`/leaves/${id}`);
            loadLeaves();
        } catch (error) {
            console.error("Error deleting leave request:", error);
            toast.error(error.response?.data?.message || "Failed to delete leave request");
        }
    };

    const filterOptions = [
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "Pending", label: "Pending" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" }
            ]
        },
        {
            name: "leave_type",
            label: "Leave Type",
            type: "select",
            options: leaveTypes.map((type) => ({
                value: String(type.leave_type_id),
                label: type.leave_name
            }))
        },
        {
            name: "start_date",
            label: "From",
            type: "date"
        },
        {
            name: "end_date",
            label: "To",
            type: "date"
        }
    ];

    if (loading) {
        return <div className="loading-container">Loading leave requests...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Leave Requests ({leaves.length})</h1>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" className="btn-secondary" onClick={clearFilters}>
                        Clear Filters
                    </button>
                    <Link to="/leaves/create" className="btn-primary">
                        Request Leave
                    </Link>
                </div>
            </div>

            {!isEmployee && <>
                <SearchBar key={searchVersion} onSearch={handleSearch} placeholder="Search by employee or leave type..." />
                <FilterBar key={filterVersion} filters={filterOptions} onFilterChange={handleFilterChange} />
            </>}

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
                                        {canApprove && leave.status === 'Pending' && (
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
                                        {canDelete && <button
                                            onClick={() => deleteLeave(leave.leave_id)}
                                            className="btn-sm btn-danger"
                                        >
                                            Delete
                                        </button>}
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
