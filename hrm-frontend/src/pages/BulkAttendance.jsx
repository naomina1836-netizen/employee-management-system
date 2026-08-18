import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const DEFAULT_STATUS = "Present";
const STATUSES = ["Present", "Absent", "Late", "Half Day"];

function BulkAttendance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [rows, setRows] = useState({});
    const [defaultCheckIn, setDefaultCheckIn] = useState("09:00");
    const [defaultCheckOut, setDefaultCheckOut] = useState("17:00");

    useEffect(() => {
        loadEmployees();
    }, []);

    async function loadEmployees() {
        try {
            const response = await api.get("/employees");
            const list = (response.data || []).filter(
                (e) => !e.employment_status || e.employment_status === "Active"
            );
            setEmployees(list);

            const initial = {};
            list.forEach((emp) => {
                initial[emp.employee_id] = {
                    selected: true,
                    status: DEFAULT_STATUS,
                    check_in: "09:00",
                    check_out: "17:00"
                };
            });
            setRows(initial);
        } catch (error) {
            console.error("Error loading employees:", error);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    }

    const updateRow = (employeeId, field, value) => {
        setRows((prev) => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]: value
            }
        }));
    };

    const setAllStatus = (status) => {
        setRows((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
                next[id] = { ...next[id], status };
                if (status === "Absent") {
                    next[id].check_in = "";
                    next[id].check_out = "";
                } else if (!next[id].check_in) {
                    next[id].check_in = defaultCheckIn;
                    next[id].check_out = defaultCheckOut;
                }
            });
            return next;
        });
    };

    const selectAll = (selected) => {
        setRows((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
                next[id] = { ...next[id], selected };
            });
            return next;
        });
    };

    const applyDefaultTimes = () => {
        setRows((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
                if (next[id].status !== "Absent") {
                    next[id] = {
                        ...next[id],
                        check_in: defaultCheckIn,
                        check_out: defaultCheckOut
                    };
                }
            });
            return next;
        });
        toast.success("Default times applied to non-absent rows");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const records = employees
            .filter((emp) => rows[emp.employee_id]?.selected)
            .map((emp) => {
                const row = rows[emp.employee_id];
                return {
                    employee_id: emp.employee_id,
                    status: row.status,
                    check_in: row.status === "Absent" ? null : row.check_in || null,
                    check_out: row.status === "Absent" ? null : row.check_out || null
                };
            });

        if (records.length === 0) {
            toast.error("Select at least one employee");
            return;
        }

        setSaving(true);
        try {
            const response = await api.post("/attendance/bulk", {
                attendance_date: attendanceDate,
                records
            });
            const { created = 0, updated = 0, skipped = 0 } = response.data;
            toast.success(
                `Saved: ${created} created, ${updated} updated` +
                    (skipped ? `, ${skipped} skipped` : "")
            );
            navigate("/attendance");
        } catch (error) {
            console.error("Bulk attendance error:", error);
            toast.error(error.response?.data?.message || "Failed to save bulk attendance");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading employees...</div>;
    }

    const selectedCount = Object.values(rows).filter((r) => r.selected).length;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Bulk Attendance</h1>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link to="/attendance" className="btn-secondary">
                        Back
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-container" style={{ marginBottom: "1rem" }}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Attendance Date *</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Default Check In</label>
                            <input
                                type="time"
                                value={defaultCheckIn}
                                onChange={(e) => setDefaultCheckIn(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Default Check Out</label>
                            <input
                                type="time"
                                value={defaultCheckOut}
                                onChange={(e) => setDefaultCheckOut(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button type="button" className="btn-secondary" onClick={applyDefaultTimes}>
                                Apply times
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setAllStatus("Present")}>
                                All Present
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setAllStatus("Absent")}>
                                All Absent
                            </button>
                        </div>
                    </div>
                    <p style={{ marginTop: "0.75rem", opacity: 0.8 }}>
                        {selectedCount} of {employees.length} employees selected
                    </p>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={employees.length > 0 && selectedCount === employees.length}
                                        onChange={(e) => selectAll(e.target.checked)}
                                        title="Select all"
                                    />
                                </th>
                                <th>Employee</th>
                                <th>Status</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-row">
                                        No active employees found
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => {
                                    const row = rows[emp.employee_id] || {
                                        selected: false,
                                        status: DEFAULT_STATUS,
                                        check_in: "",
                                        check_out: ""
                                    };
                                    return (
                                        <tr key={emp.employee_id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={!!row.selected}
                                                    onChange={(e) =>
                                                        updateRow(emp.employee_id, "selected", e.target.checked)
                                                    }
                                                />
                                            </td>
                                            <td>
                                                {emp.first_name} {emp.last_name}
                                            </td>
                                            <td>
                                                <select
                                                    value={row.status}
                                                    onChange={(e) => {
                                                        const status = e.target.value;
                                                        setRows((prev) => ({
                                                            ...prev,
                                                            [emp.employee_id]: {
                                                                ...prev[emp.employee_id],
                                                                status,
                                                                check_in: status === "Absent" ? "" : prev[emp.employee_id].check_in || defaultCheckIn,
                                                                check_out: status === "Absent" ? "" : prev[emp.employee_id].check_out || defaultCheckOut
                                                            }
                                                        }));
                                                    }}
                                                    disabled={!row.selected}
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    value={row.check_in || ""}
                                                    onChange={(e) =>
                                                        updateRow(emp.employee_id, "check_in", e.target.value)
                                                    }
                                                    disabled={!row.selected || row.status === "Absent"}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    value={row.check_out || ""}
                                                    onChange={(e) =>
                                                        updateRow(emp.employee_id, "check_out", e.target.value)
                                                    }
                                                    disabled={!row.selected || row.status === "Absent"}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="form-actions" style={{ marginTop: "1rem" }}>
                    <button type="submit" className="btn-primary" disabled={saving || selectedCount === 0}>
                        {saving ? "Saving..." : `Save attendance (${selectedCount})`}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BulkAttendance;
