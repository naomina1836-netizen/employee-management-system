import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
    AlertCircle,
    CheckCircle2,
    Hash,
    Lock,
    Mail,
    ShieldCheck,
    UserRound,
    UsersRound,
} from "lucide-react";

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Employee",
        employee_id: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...registerData } = formData;

            if (!registerData.employee_id) {
                registerData.employee_id = null;
            }

            await api.post("/auth/register", registerData);
            navigate("/login");
        } catch (err) {
            console.error("Registration error:", err);
            const message = err.response?.data?.message || "Registration failed. Please try again.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-brand">
                    <div className="brand-content">
                        <div className="brand-logo">
                            <span className="logo-icon">
                                <ShieldCheck size={22} strokeWidth={2.2} />
                            </span>
                            <span className="logo-text">HRM</span>
                        </div>
                        <h1>Create your<br />account</h1>
                        <p>Set up your employee, manager, HR, or admin account in a clean, secure workspace.</p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Fast account setup</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Role-based access</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Secure password flow</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="login-form-container">
                    <div className="login-form-wrapper">
                        <div className="form-header">
                            <h2>Register</h2>
                            <p>Create a new account for the HRM system</p>
                        </div>

                        {error && (
                            <div className="login-error">
                                <span className="error-icon">
                                    <AlertCircle size={16} strokeWidth={2.4} />
                                </span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label>Username *</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <UserRound size={16} strokeWidth={2.2} />
                                    </span>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email Address *</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <Mail size={16} strokeWidth={2.2} />
                                    </span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@hrm.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Role *</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <UsersRound size={16} strokeWidth={2.2} />
                                    </span>
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
                            </div>

                            <div className="form-group">
                                <label>Employee ID (Optional)</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <Hash size={16} strokeWidth={2.2} />
                                    </span>
                                    <input
                                        type="number"
                                        name="employee_id"
                                        value={formData.employee_id}
                                        onChange={handleChange}
                                        placeholder="Enter employee ID"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <Lock size={16} strokeWidth={2.2} />
                                    </span>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 characters"
                                        required
                                        minLength="6"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <Lock size={16} strokeWidth={2.2} />
                                    </span>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-submit" disabled={loading}>
                                {loading ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>

                        <div className="form-footer">
                            <p>
                                Already have an account? <Link to="/login" className="register-link">Login here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
