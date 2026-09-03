import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
} from "lucide-react";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Please enter both email and password");
            setLoading(false);
            return;
        }

        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            const message = err.response?.data?.message
                || (err.request
                    ? "Cannot reach the HRM server. Confirm it is running on port 5001."
                    : "Unable to sign in. Please try again.");
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
                        <h1>Human Resource<br />Management System</h1>
                        <p>Streamline your workforce management with our comprehensive HR solution.</p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Employee Management</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Leave Tracking</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Attendance Monitoring</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Payroll Processing</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><CheckCircle2 size={16} strokeWidth={2.4} /></span>
                                <span>Performance Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="login-form-container">
                    <div className="login-form-wrapper">
                        <div className="form-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to access your dashboard</p>
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
                                <label>Email Address</label>
                                <div className="input-wrapper input-wrapper--plain">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper input-wrapper--plain">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-submit" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <div className="form-footer" style={{ marginTop: "1rem" }}>
                            <Link to="/forgot-password" style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
                                Forgot your password?
                            </Link>
                        </div>

                        <div className="form-footer">
                            <p>Secure login with 256-bit encryption</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
