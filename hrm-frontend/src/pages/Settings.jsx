import { useState, useEffect } from "react";
import api from "../services/api";

import { useConfirm } from "../context/ConfirmContext";

function Settings() {
    const [activeTab, setActiveTab] = useState("departments");
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const confirm = useConfirm();

    // Modals
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showPosModal, setShowPosModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [editingPos, setEditingPos] = useState(null);

    // Form states
    const [deptForm, setDeptForm] = useState({ department_name: "", description: "" });
    const [posForm, setPosForm] = useState({ title: "", department_id: "", basic_salary: "" });
    const [formErrors, setFormErrors] = useState({});

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, posRes] = await Promise.all([
                api.get("/settings/departments"),
                api.get("/settings/positions")
            ]);
            setDepartments(deptRes.data);
            setPositions(posRes.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching settings data:", err);
            setError(err.response?.data?.message || "Failed to load settings data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Department Handlers ---
    const openDeptModal = (dept = null) => {
        setEditingDept(dept);
        if (dept) {
            setDeptForm({
                department_name: dept.department_name || "",
                description: dept.description || ""
            });
        } else {
            setDeptForm({ department_name: "", description: "" });
        }
        setFormErrors({});
        setShowDeptModal(true);
    };

    const closeDeptModal = () => {
        setShowDeptModal(false);
        setEditingDept(null);
        setDeptForm({ department_name: "", description: "" });
        setFormErrors({});
    };

    const onDeptSubmit = async (e) => {
        e.preventDefault();
        
        if (!deptForm.department_name.trim()) {
            setFormErrors({ department_name: "Department name is required" });
            return;
        }

        try {
            if (editingDept) {
                await api.put(`/settings/departments/${editingDept.department_id}`, deptForm);
            } else {
                await api.post("/settings/departments", deptForm);
            }
            closeDeptModal();
            fetchData();
        } catch (err) {
            console.error("Error saving department:", err);
            alert(err.response?.data?.message || "Failed to save department");
        }
    };

    const handleDeleteDept = async (id) => {
        const confirmed = await confirm({
            title: "Delete Department",
            message: "Are you sure you want to delete this department? This might affect employees assigned to it.",
            confirmText: "Delete",
            type: "danger"
        });

        if (confirmed) {
            try {
                await api.delete(`/settings/departments/${id}`);
                fetchData();
            } catch (err) {
                console.error("Error deleting department:", err);
                alert(err.response?.data?.message || "Failed to delete department");
            }
        }
    };

    // --- Position Handlers ---
    const openPosModal = (pos = null) => {
        setEditingPos(pos);
        if (pos) {
            setPosForm({
                title: pos.title || "",
                basic_salary: pos.basic_salary || "",
                department_id: pos.department_id || ""
            });
        } else {
            setPosForm({ title: "", department_id: "", basic_salary: "" });
        }
        setFormErrors({});
        setShowPosModal(true);
    };

    const closePosModal = () => {
        setShowPosModal(false);
        setEditingPos(null);
        setPosForm({ title: "", department_id: "", basic_salary: "" });
        setFormErrors({});
    };

    const onPosSubmit = async (e) => {
        e.preventDefault();

        if (!posForm.title.trim()) {
            setFormErrors({ title: "Title is required" });
            return;
        }

        try {
            const data = {
                title: posForm.title,
                basic_salary: parseFloat(posForm.basic_salary) || 0,
                department_id: posForm.department_id ? parseInt(posForm.department_id) : null
            };
            
            if (editingPos) {
                await api.put(`/settings/positions/${editingPos.position_id}`, data);
            } else {
                await api.post("/settings/positions", data);
            }
            closePosModal();
            fetchData();
        } catch (err) {
            console.error("Error saving position:", err);
            alert(err.response?.data?.message || "Failed to save position");
        }
    };

    const handleDeletePos = async (id) => {
        const confirmed = await confirm({
            title: "Delete Position",
            message: "Are you sure you want to delete this position? This might affect employees assigned to it.",
            confirmText: "Delete",
            type: "danger"
        });

        if (confirmed) {
            try {
                await api.delete(`/settings/positions/${id}`);
                fetchData();
            } catch (err) {
                console.error("Error deleting position:", err);
                alert(err.response?.data?.message || "Failed to delete position");
            }
        }
    };

    if (loading && departments.length === 0) {
        return <div className="loading-state">Loading settings...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>Organization Settings</h1>
                    <p className="text-muted">Manage departments and job positions</p>
                </div>
                <div className="page-actions">
                    {activeTab === "departments" ? (
                        <button className="btn-primary" onClick={() => openDeptModal()}>
                            Add Department
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={() => openPosModal()}>
                            Add Position
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="tabs-container mb-6">
                <div className="tabs-header" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <button
                        className={activeTab === "departments" ? "btn-primary" : "btn-secondary"}
                        onClick={() => setActiveTab("departments")}
                    >
                        Departments
                    </button>
                    <button
                        className={activeTab === "positions" ? "btn-primary" : "btn-secondary"}
                        onClick={() => setActiveTab("positions")}
                    >
                        Positions
                    </button>
                </div>
            </div>

            {/* Departments Tab */}
            {activeTab === "departments" && (
                <div className="table-container">
                    <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Department Name</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.length > 0 ? (
                                    departments.map((dept) => (
                                        <tr key={dept.department_id}>
                                            <td>{dept.department_id}</td>
                                            <td className="font-medium">{dept.department_name}</td>
                                            <td className="text-muted">{dept.description || "N/A"}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-sm btn-edit"
                                                        onClick={() => openDeptModal(dept)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn-sm btn-danger"
                                                        onClick={() => handleDeleteDept(dept.department_id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-row">
                                            No departments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                </div>
            )}

            {/* Positions Tab */}
            {activeTab === "positions" && (
                <div className="table-container">
                    <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Department</th>
                                    <th>Basic Salary</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.length > 0 ? (
                                    positions.map((pos) => (
                                        <tr key={pos.position_id}>
                                            <td>{pos.position_id}</td>
                                            <td className="font-medium">{pos.title}</td>
                                            <td>
                                                <span className="badge badge-secondary">
                                                    {pos.department_name || "None"}
                                                </span>
                                            </td>
                                            <td>${parseFloat(pos.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-sm btn-edit"
                                                        onClick={() => openPosModal(pos)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn-sm btn-danger"
                                                        onClick={() => handleDeletePos(pos.position_id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="empty-row">
                                            No positions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                </div>
            )}

            {/* Department Modal */}
            {showDeptModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h2>{editingDept ? "Edit Department" : "Add Department"}</h2>
                            <button className="modal-close" onClick={closeDeptModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={onDeptSubmit} className="form">
                                <div className="form-group">
                                    <label className="form-label">Department Name *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${formErrors.department_name ? "is-invalid" : ""}`}
                                        value={deptForm.department_name}
                                        onChange={(e) => setDeptForm({ ...deptForm, department_name: e.target.value })}
                                        placeholder="e.g. Human Resources"
                                    />
                                    {formErrors.department_name && (
                                        <span className="form-error">{formErrors.department_name}</span>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={deptForm.description}
                                        onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                                        placeholder="Brief description of the department..."
                                    ></textarea>
                                </div>

                                <div className="modal-footer" style={{ marginTop: "1.5rem" }}>
                                    <button type="button" className="btn-secondary" onClick={closeDeptModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingDept ? "Save Changes" : "Create Department"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Position Modal */}
            {showPosModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h2>{editingPos ? "Edit Position" : "Add Position"}</h2>
                            <button className="modal-close" onClick={closePosModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={onPosSubmit} className="form">
                                <div className="form-group">
                                    <label className="form-label">Position Title *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${formErrors.title ? "is-invalid" : ""}`}
                                        value={posForm.title}
                                        onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                                        placeholder="e.g. Software Engineer"
                                    />
                                    {formErrors.title && (
                                        <span className="form-error">{formErrors.title}</span>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        className="form-select"
                                        value={posForm.department_id}
                                        onChange={(e) => setPosForm({ ...posForm, department_id: e.target.value })}
                                    >
                                        <option value="">-- No Department --</option>
                                        {departments.map((dept) => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.department_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Basic Salary</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        value={posForm.basic_salary}
                                        onChange={(e) => setPosForm({ ...posForm, basic_salary: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="modal-footer" style={{ marginTop: "1.5rem" }}>
                                    <button type="button" className="btn-secondary" onClick={closePosModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingPos ? "Save Changes" : "Create Position"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
