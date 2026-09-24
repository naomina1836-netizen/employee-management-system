import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Download, FilterX } from "lucide-react";

const DEFAULT_FILTERS = {
    q: "",
    action: "",
    table_name: "",
    from_date: "",
    to_date: "",
    user_id: "",
    record_id: "",
};

const ACTION_OPTIONS = [
    "",
    "CREATE",
    "UPDATE",
    "DELETE",
    "UPDATE_PROFILE",
    "CHANGE_PASSWORD",
    "CREATE_USER",
    "UPDATE_USER",
    "UPDATE_USER_STATUS",
    "PASSWORD_RESET_REQUESTED",
    "COMPLETE_PASSWORD_RESET",
    "COMPLETE_PASSWORD_SETUP",
];

const TABLE_OPTIONS = [
    "",
    "users",
    "employees",
    "departments",
    "positions",
];

function readFilters(params) {
    return {
        q: params.get("q") || "",
        action: params.get("action") || "",
        table_name: params.get("table_name") || "",
        from_date: params.get("from_date") || "",
        to_date: params.get("to_date") || "",
        user_id: params.get("user_id") || "",
        record_id: params.get("record_id") || "",
    };
}

function buildParams(filters, extra = {}) {
    const params = {
        ...extra,
        ...filters,
    };

    Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
            delete params[key];
        }
    });

    return params;
}

function AdminAuditLogs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, ...readFilters(searchParams) }));
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const skipSearchSyncRef = useRef(false);

    const loadLogs = async (nextPage = page, nextFilters = filters) => {
        setLoading(true);
        try {
            const params = buildParams(nextFilters, {
                page: nextPage,
                limit: 20,
            });

            const response = await api.get("/admin/audit-logs", {
                params,
            });
            setLogs(response.data.data || []);
            setPagination(response.data.pagination || null);
            setPage(response.data.pagination?.page || nextPage);
        } catch (error) {
            console.error("Error loading audit logs:", error);
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    const applyFilters = (e) => {
        e.preventDefault();
        const nextFilters = { ...DEFAULT_FILTERS, ...filters };
        skipSearchSyncRef.current = true;
        setPage(1);
        setSearchParams(buildParams(nextFilters, { page: 1, limit: 20 }));
        loadLogs(1, nextFilters);
    };

    const clearFilters = () => {
        const nextFilters = { ...DEFAULT_FILTERS };
        skipSearchSyncRef.current = true;
        setFilters(nextFilters);
        setPage(1);
        setSearchParams({ page: 1, limit: 20 });
        loadLogs(1, nextFilters);
    };

    useEffect(() => {
        const nextFilters = readFilters(searchParams);
        setFilters((current) => ({ ...DEFAULT_FILTERS, ...nextFilters }));
        if (skipSearchSyncRef.current) {
            skipSearchSyncRef.current = false;
            return;
        }

        setPage(1);
        loadLogs(1, nextFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const formatDetails = (details) => {
        if (!details) {
            return "-";
        }

        try {
            const parsed = typeof details === "string" ? JSON.parse(details) : details;
            if (parsed && typeof parsed === "object") {
                return Object.entries(parsed)
                    .map(([key, value]) => `${key}: ${value ?? "-"}`)
                    .join(", ");
            }
        } catch (error) {
            return String(details);
        }

        return String(details);
    };

    const openDetails = (log) => {
        setSelectedLog(log);
        setShowDetails(true);
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedLog(null);
    };

    const handleExportCsv = async () => {
        try {
            const params = buildParams(filters, { format: "csv" });

            const response = await api.get("/admin/audit-logs", {
                params,
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "audit-logs.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Audit log CSV exported");
        } catch (error) {
            console.error("Error exporting audit logs:", error);
            toast.error("Failed to export CSV");
        }
    };

    const selectedDetails = (() => {
        if (!selectedLog) return [];
        try {
            const parsed = typeof selectedLog.details === "string"
                ? JSON.parse(selectedLog.details)
                : selectedLog.details;
            if (parsed && typeof parsed === "object") {
                return Object.entries(parsed);
            }
        } catch (error) {
            return [["details", String(selectedLog.details)]];
        }
        return [["details", String(selectedLog.details || "-")]];
    })();

    if (loading) {
        return <div className="loading-container">Loading audit logs...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p style={{ margin: "0.25rem 0 0", color: "#6b7280" }}>
                        Admin only access
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button className="btn-secondary" onClick={handleExportCsv}>
                        <Download size={16} strokeWidth={2.2} style={{ marginRight: "0.35rem" }} />
                        Export CSV
                    </button>
                    <button type="button" className="btn-secondary" onClick={clearFilters}>
                        <FilterX size={16} strokeWidth={2.2} style={{ marginRight: "0.35rem" }} />
                        Clear Filters
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => loadLogs(page)}>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="form-container" style={{ marginBottom: "1rem" }}>
                <form onSubmit={applyFilters} className="form-grid">
                    <div className="form-group">
                        <label>Search</label>
                        <input
                            type="text"
                            name="q"
                            value={filters.q}
                            onChange={handleFilterChange}
                            placeholder="Action, table, user, details, record ID"
                        />
                    </div>
                    <div className="form-group">
                        <label>Action</label>
                        <select name="action" value={filters.action} onChange={handleFilterChange}>
                            <option value="">All actions</option>
                            {ACTION_OPTIONS.filter(Boolean).map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Table</label>
                        <select name="table_name" value={filters.table_name} onChange={handleFilterChange}>
                            <option value="">All tables</option>
                            {TABLE_OPTIONS.filter(Boolean).map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>User ID</label>
                        <input
                            type="number"
                            name="user_id"
                            value={filters.user_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by user"
                        />
                    </div>
                    <div className="form-group">
                        <label>Record ID</label>
                        <input
                            type="number"
                            name="record_id"
                            value={filters.record_id}
                            onChange={handleFilterChange}
                            placeholder="Filter by record"
                        />
                    </div>
                    <div className="form-group">
                        <label>From date</label>
                        <input
                            type="date"
                            name="from_date"
                            value={filters.from_date}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>To date</label>
                        <input
                            type="date"
                            name="to_date"
                            value={filters.to_date}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary">
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Action</th>
                            <th>Table</th>
                            <th>Record</th>
                            <th>By</th>
                            <th>Details</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-row">No audit logs found</td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log.audit_log_id}
                                    onClick={() => openDetails(log)}
                                    style={{ cursor: "pointer" }}
                                    title="Click to view details"
                                >
                                    <td>{log.audit_log_id}</td>
                                    <td>{log.action}</td>
                                    <td>{log.table_name}</td>
                                    <td>{log.record_id || "-"}</td>
                                    <td>
                                        <div>
                                            <strong>{log.username || "System"}</strong>
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                                {log.role || "N/A"}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: "360px" }}>{formatDetails(log.details)}</td>
                                    <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="form-actions" style={{ marginTop: "1rem" }}>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadLogs(Math.max(1, page - 1))}
                    disabled={page <= 1}
                >
                    Previous
                </button>
                <span style={{ color: "#6b7280" }}>
                    Page {pagination?.page || page}
                    {pagination?.totalPages ? ` of ${pagination.totalPages}` : ""}
                    {pagination?.total ? ` · ${pagination.total} entries` : ""}
                </span>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadLogs((pagination?.page || page) + 1)}
                    disabled={pagination ? pagination.page >= pagination.totalPages : logs.length === 0}
                >
                    Next
                </button>
            </div>

            {showDetails && selectedLog && (
                <div className="modal-overlay" onClick={closeDetails}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
                            <div>
                                <h2 style={{ marginBottom: "0.25rem" }}>Audit Log Details</h2>
                                <p style={{ margin: 0, color: "#6b7280" }}>
                                    Entry #{selectedLog.audit_log_id}
                                </p>
                            </div>
                            <button type="button" className="btn-secondary" onClick={closeDetails}>
                                Close
                            </button>
                        </div>

                        <div className="profile-container" style={{ marginTop: "1rem" }}>
                            <div className="profile-card">
                                <div className="profile-field">
                                    <label>Action</label>
                                    <p>{selectedLog.action}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Table</label>
                                    <p>{selectedLog.table_name}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Record ID</label>
                                    <p>{selectedLog.record_id || "-"}</p>
                                </div>
                                <div className="profile-field">
                                    <label>User</label>
                                    <p>{selectedLog.username || "System"}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Email</label>
                                    <p>{selectedLog.email || "-"}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Role</label>
                                    <p>{selectedLog.role || "-"}</p>
                                </div>
                                <div className="profile-field full-width">
                                    <label>Details</label>
                                    <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.5rem" }}>
                                        {selectedDetails.map(([key, value]) => (
                                            <div key={key} style={{ padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.75rem" }}>
                                                <div style={{ fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                    {key}
                                                </div>
                                                <div style={{ wordBreak: "break-word" }}>{String(value ?? "-")}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="profile-field full-width">
                                    <label>Created</label>
                                    <p>{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : "-"}</p>
                                </div>
                                <div className="profile-field full-width">
                                    <label>Quick filters</label>
                                    <p style={{ margin: 0 }}>
                                        <Link to={`/admin/audit-logs?table_name=${encodeURIComponent(selectedLog.table_name || "")}&record_id=${encodeURIComponent(selectedLog.record_id || "")}&user_id=${encodeURIComponent(selectedLog.user_id || "")}`}>
                                            Open filtered audit history
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminAuditLogs;
