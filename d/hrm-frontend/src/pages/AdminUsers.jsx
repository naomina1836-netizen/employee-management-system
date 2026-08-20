import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "Employee",
        employee_id: ""
    });

    useEffect(() => {
        loadUsers();
    }, []);

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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                employee_id: formData.employee_id ? Number(formData.employee_id) : null
            };
            await api.post("/auth/register", payload);
            toast.success("User created successfully!");
            setShowCreateModal(false);
            setFormData({
                username: "",
                email: "",
                password: "",
                role: "Employee",
                employee_id: ""
            });
            loadUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error(error.response?.data?.message || "Failed to create user");
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
            toast.success(`User ${newStatus.toLowerCase()}d successfully`);
            loadUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        }
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>User Management</h1>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                    + Create User
                </button>
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
                                        <button 
                                            onClick={() => toggleUserStatus(user.user_id, user.status)}
                                            className={`btn-sm ${user.status === 'Active' ? 'btn-danger' : 'btn-approve'}`}
                                        >
                                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {}
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
                                <label>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                />
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
        </div>
    );
}

export default AdminUsers;