import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const response = await api.get("/users/me");
            setProfile(response.data);
            setFormData(response.data);
        } catch (error) {
            console.error("Error loading profile:", error);
            toast.error("Failed to load profile");
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

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put("/users/me", formData);
            toast.success("Profile updated successfully!");
            setProfile(formData);
            setEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("New passwords do not match");
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            await api.post("/auth/change-password", {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            toast.success("Password changed successfully!");
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error(error.response?.data?.message || "Failed to change password");
        }
    };

    if (loading) {
        return <div className="loading-container">Loading profile...</div>;
    }

    if (!profile) {
        return <div className="empty-state">No profile data found</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>My Profile</h1>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="btn-primary">
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="profile-container">
                {editing ? (
                    <form onSubmit={handleUpdateProfile} className="form-grid">
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                disabled
                                style={{ background: "#f5f5f5" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <input
                                type="text"
                                value={formData.role}
                                disabled
                                style={{ background: "#f5f5f5" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Employee ID</label>
                            <input
                                type="text"
                                value={formData.employee_id || "Not assigned"}
                                disabled
                                style={{ background: "#f5f5f5" }}
                            />
                        </div>

                        <div className="form-actions full-width">
                            <button type="submit" className="btn-primary">Save</button>
                            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-card">
                        <div className="profile-field">
                            <label>Username</label>
                            <p>{profile.username}</p>
                        </div>
                        <div className="profile-field">
                            <label>Email</label>
                            <p>{profile.email}</p>
                        </div>
                        <div className="profile-field">
                            <label>Role</label>
                            <p>{profile.role}</p>
                        </div>
                        <div className="profile-field">
                            <label>Employee ID</label>
                            <p>{profile.employee_id || "Not assigned"}</p>
                        </div>
                        <div className="profile-field">
                            <label>Status</label>
                            <p>{profile.status || "Active"}</p>
                        </div>
                    </div>
                )}

                {/* Change Password Section */}
                <div className="profile-section password-section">
                    <h2>Change Password</h2>
                    <form onSubmit={handleChangePassword} className="password-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={passwordData.current_password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={passwordData.new_password}
                                onChange={handlePasswordChange}
                                required
                                minLength="6"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={passwordData.confirm_password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary">Change Password</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profile;