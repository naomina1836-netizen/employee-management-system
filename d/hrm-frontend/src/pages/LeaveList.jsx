import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { useAuth } from "../context/AuthContext";

function LeaveList() {
  const { user } = useAuth();
  const isEmployee = user?.role === "Employee";
  const canManage = ["Admin", "HR", "Manager"].includes(user?.role);
  const canDelete = ["Admin", "HR"].includes(user?.role);

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [searchVersion, setSearchVersion] = useState(0);
  const [filterVersion, setFilterVersion] = useState(0);

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [filters, user?.employee_id]);

  async function loadLeaveTypes() {
    try {
      const response = await api.get("/leaves/types");
      setLeaveTypes(response.data);
    } catch {
      toast.error("Failed to load leave filters");
    }
  }

  async function loadLeaves() {
    setLoading(true);
    try {
      if (isEmployee) {
        if (!user?.employee_id) {
          setLeaves([]);
          toast.error("Your account is not linked to an employee profile");
          return;
        }
        const response = await api.get(`/leaves/employee/${user.employee_id}`);
        setLeaves(response.data);
        return;
      }

      let url = "/leaves";
      const params = new URLSearchParams();
      if (filters.keyword) params.append("keyword", filters.keyword);
      if (filters.status) params.append("status", filters.status);
      if (filters.leave_type) params.append("leave_type", filters.leave_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      const query = params.toString();
      if (query) url = `/leaves/search?${query}`;
      const response = await api.get(url);
      setLeaves(response.data);
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (keyword) => {
    setFilters({ ...filters, keyword });
    setSearchVersion((v) => v + 1);
  };

  const handleFilterChange = (name, value) => {
    if (value) setFilters({ ...filters, [name]: value });
    else {
      const next = { ...filters };
      delete next[name];
      setFilters(next);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setFilterVersion((v) => v + 1);
    setSearchVersion((v) => v + 1);
  };

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Mark this leave as ${status}?`)) return;
    try {
      await api.patch(`/leaves/${id}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      loadLeaves();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteLeave = async (id) => {
    if (!window.confirm("Delete this leave request?")) return;
    try {
      await api.delete(`/leaves/${id}`);
      toast.success("Deleted");
      loadLeaves();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
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
    { name: "start_date", label: "From", type: "date" },
    { name: "end_date", label: "To", type: "date" }
  ];

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading leave…</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">{isEmployee ? "My requests" : "Approvals"}</p>
          <h1>Leave ({leaves.length})</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!isEmployee && (
            <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>
          )}
          <Link to="/leaves/create" className="btn-primary">Request leave</Link>
        </div>
      </div>

      {!isEmployee && (
        <>
          <SearchBar key={searchVersion} onSearch={handleSearch} placeholder="Search employee or type…" />
          <FilterBar key={filterVersion} filters={filterOptions} onFilterChange={handleFilterChange} />
        </>
      )}

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {!isEmployee && <th>Employee</th>}
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Days</th>
              <th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan="8" className="empty-row">No leave requests</td></tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave.leave_id}>
                  <td>{leave.leave_id}</td>
                  {!isEmployee && <td>{leave.employee_name || "—"}</td>}
                  <td>{leave.leave_name || "—"}</td>
                  <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td>{leave.total_days}</td>
                  <td>
                    <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                      {leave.status || "Pending"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="action-cell">
                      {leave.status === "Pending" && (
                        <>
                          <button type="button" className="btn-approve" onClick={() => updateStatus(leave.leave_id, "Approved")}>Approve</button>
                          <button type="button" className="btn-danger" onClick={() => updateStatus(leave.leave_id, "Rejected")}>Reject</button>
                        </>
                      )}
                      {canDelete && (
                        <button type="button" className="btn-danger" onClick={() => deleteLeave(leave.leave_id)}>Delete</button>
                      )}
                    </td>
                  )}
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
