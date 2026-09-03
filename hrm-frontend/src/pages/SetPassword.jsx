import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function SetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") || "";

    const [formData, setFormData] = useState({
        password: "",
        confirm_password: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("This password setup link is missing its token.");
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/complete-password-setup", {
                token,
                password: formData.password
            });
            setSuccess(true);
            toast.success("Password set successfully");
            setTimeout(() => navigate("/login"), 1500);
        } catch (requestError) {
            const message = requestError.response?.data?.message || "Failed to set password";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div className="page-header">
                <h1>Set Your Password</h1>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group full-width">
                        <p style={{ margin: 0, color: "#4b5563" }}>
                            Use this form to activate your HRM account. The link is single-use and expires automatically.
                        </p>
                    </div>

                    {!token && (
                        <div className="form-group full-width">
                            <p style={{ color: "#b91c1c", margin: 0 }}>
                                This link is missing a token. Request a new password setup email from an administrator.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="form-group full-width">
                            <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {success ? (
                        <div className="form-group full-width">
                            <p style={{ color: "#15803d", margin: 0 }}>
                                Password saved. You will be redirected to the login page.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>New Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-actions full-width">
                                <button type="submit" className="btn-primary" disabled={loading || !token}>
                                    {loading ? "Saving..." : "Set Password"}
                                </button>
                                <Link to="/login" className="btn-secondary" style={{ textDecoration: "none" }}>
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

export default SetPassword;
