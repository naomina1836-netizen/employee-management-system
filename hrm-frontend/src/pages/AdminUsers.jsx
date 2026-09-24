import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function AdminUsers() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === "Admin";
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTestEmailModal, setShowTestEmailModal] = useState(false);
    const [resetTarget, setResetTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [testEmailData, setTestEmailData] = useState({
        to: currentUser?.email || "",
        subject: "HRM SMTP test",
        message: "This is a test email from the HRM employee management system."
    });
    const [resultInfo, setResultInfo] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "Employee",
        employee_id: ""
    });
    const [editFormData, setEditFormData] = useState({
        username: "",
        email: "",
        role: "Employee",
        employee_id: "",
        status: "Active"
    });

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (!resultInfo) {
            return;
        }

        if (resultInfo.email) {
            if (resultInfo.sent) {
                toast.success(`${resultInfo.label} email sent to ${resultInfo.email}`);
            } else {
                toast.error(`${resultInfo.label} email not sent to ${resultInfo.email}. Check SMTP settings.`);
            }
        } else {
            toast.success(resultInfo.title);
        }
    }, [resultInfo]);

    async function loadUsers() {
        try {
            const response = await api.get("/admin/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Failed to load users");
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

    const openEditModal = (user) => {
        setEditTarget(user);
        setEditFormData({
            username: user.username || "",
            email: user.email || "",
            role: user.role || "Employee",
            employee_id: user.employee_id || "",
            status: user.status || "Active"
        });
    };

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                employee_id: formData.employee_id ? Number(formData.employee_id) : null
            };
            const response = await api.post("/auth/register", payload);
            setShowCreateModal(false);
            setFormData({
                username: "",
                email: "",
                password: "",
                role: "Employee",
                employee_id: ""
            });
            loadUsers();
            setResultInfo({
                title: "User created",
                label: "Password setup link",
                email: response.data.email_to,
                sent: response.data.email_sent
            });
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error(error.response?.data?.message || "Failed to create user");
        }
    };

    const openTestEmailModal = () => {
        setTestEmailData({
            to: currentUser?.email || "",
            subject: "HRM SMTP test",
            message: "This is a test email from the HRM employee management system."
        });
        setShowTestEmailModal(true);
    };

    const handleTestEmailChange = (e) => {
        setTestEmailData({
            ...testEmailData,
            [e.target.name]: e.target.value
        });
    };

    const handleSendTestEmail = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/admin/test-email", testEmailData);
            setShowTestEmailModal(false);
            setResultInfo({
                title: "Test email",
                label: "Test",
                email: response.data.email_to,
                sent: response.data.email_sent
            });
        } catch (error) {
            console.error("Error sending test email:", error);
            toast.error(error.response?.data?.message || "Failed to send test email");
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
            loadUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        }
    };

    const closeResetModal = () => {
        setResetTarget(null);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/auth/reset-password", {
                user_id: resetTarget.user_id
            });
            const target = resetTarget;
            closeResetModal();
            setResultInfo({
                title: "Password reset link",
                label: "Password reset link",
                email: response.data.email_to ?? target.email,
                sent: response.data.email_sent
            });
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error(error.response?.data?.message || "Failed to send password setup link");
        }
    };

    const closeEditModal = () => {
        setEditTarget(null);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/admin/users/${editTarget.user_id}`, {
                ...editFormData,
                employee_id: editFormData.employee_id ? Number(editFormData.employee_id) : null
            });
            const updatedUser = response.data.user;
            closeEditModal();
            setUsers((currentUsers) =>
                currentUsers.map((user) =>
                    user.user_id === updatedUser.user_id ? updatedUser : user
                )
            );
            setResultInfo({
                title: "User updated"
            });
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(error.response?.data?.message || "Failed to update user");
        }
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p style={{ margin: "0.25rem 0 0", color: "#6b7280" }}>Admin only access</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button onClick={openTestEmailModal} className="btn-secondary">
                        Send Test Email
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        + Create User
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Employee ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-row">No users found</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.user_id}>
                                    <td>{user.user_id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`user-role ${user.role?.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.status?.toLowerCase()}`}>
                                            {user.status || 'Active'}
                                        </span>
                                    </td>
                                    <td>{user.employee_id || '-'}</td>
                                    <td>
                                        {isAdmin && (
                                            <button
                                                onClick={() => toggleUserStatus(user.user_id, user.status)}
                                                className={`btn-sm ${user.status === 'Active' ? 'btn-danger' : 'btn-approve'}`}
                                            >
                                                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="btn-sm btn-edit"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => setResetTarget(user)}
                                                className="btn-sm btn-edit"
                                            >
                                                Reset Password
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <Link
                                                to={`/admin/audit-logs?table_name=users&record_id=${user.user_id}`}
                                                className="btn-sm btn-secondary"
                                                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                                            >
                                                Audit
                                            </Link>
                                        )}
                                        {isAdmin && (
                                            <span className="permission-hint" style={{ marginLeft: "8px" }}>
                                                Admin only
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New User</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Login Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength="6"
                                    placeholder="Leave blank to auto-generate"
                                    autoComplete="new-password"
                                />
                                <small className="form-hint">
                                    Optional initial password for the user account. If left blank, the system generates one automatically.
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Employee ID (Optional)</label>
                                <input
                                    type="number"
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <p style={{ marginTop: "0.25rem", color: "#6b7280", fontSize: "0.95rem" }}>
                                A password setup link will be emailed after the user is created.
                            </p>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Create</button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Email Modal */}
            {showTestEmailModal && (
                <div className="modal-overlay" onClick={() => setShowTestEmailModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Send Test Email</h2>
                        <form onSubmit={handleSendTestEmail}>
                            <div className="form-group">
                                <label>Recipient Email *</label>
                                <input
                                    type="email"
                                    name="to"
                                    value={testEmailData.to}
                                    onChange={handleTestEmailChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={testEmailData.subject}
                                    onChange={handleTestEmailChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    name="message"
                                    value={testEmailData.message}
                                    onChange={handleTestEmailChange}
                                    rows="4"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">
                                    Send
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTestEmailModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editTarget && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit User</h2>
                        <form onSubmit={handleUpdateUser}>
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={editFormData.username}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editFormData.email}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    name="role"
                                    value={editFormData.role}
                                    onChange={handleEditChange}
                                    required
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status *</label>
                                <select
                                    name="status"
                                    value={editFormData.status}
                                    onChange={handleEditChange}
                                    required
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Employee ID (Optional)</label>
                                <input
                                    type="number"
                                    name="employee_id"
                                    value={editFormData.employee_id}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Save Changes</button>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Setup Modal */}
            {resetTarget && (
                <div className="modal-overlay" onClick={closeResetModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Send Password Reset Link</h2>
                        <p>
                            Send a one-time password reset link to <strong>{resetTarget.username}</strong>.
                        </p>
                        <form onSubmit={handleResetPassword}>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Send Link</button>
                                <button
                                    type="button"
                                    onClick={closeResetModal}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Email Result Modal */}
            {resultInfo && (
                <div className="modal-overlay" onClick={() => setResultInfo(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{resultInfo.title}</h2>
                        {resultInfo.email ? (
                            resultInfo.sent ? (
                                <p style={{ color: "#15803d" }}>
                                    {resultInfo.label} email sent to <strong>{resultInfo.email}</strong> &#10003;
                                </p>
                            ) : (
                                <p style={{ color: "#b91c1c" }}>
                                    {resultInfo.label} email not sent to <strong>{resultInfo.email}</strong>.
                                    Check the server mail settings.
                                </p>
                            )
                        ) : (
                            <p>Done.</p>
                        )}
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setResultInfo(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;
