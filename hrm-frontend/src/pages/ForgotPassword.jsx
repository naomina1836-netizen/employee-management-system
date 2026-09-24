import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/auth/request-password-reset", { email });
            setSent(true);
            setMessage(response.data.message);
            toast.success("Password reset email processed");
        } catch (error) {
            const nextMessage = error.response?.data?.message || "Failed to request password reset";
            setMessage(nextMessage);
            toast.error(nextMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page forgot-password-page">
            <div className="login-container forgot-password-container">
                <div className="login-form-container">
                    <div className="login-form-wrapper">
                        <div className="form-header">
                            <h2>Forgot Password</h2>
                            <p>Enter your email address and we will send a one-time password reset link if an account exists.</p>
                        </div>

                        {message && (
                            <div className={`login-error ${sent ? "login-error--success" : ""}`}>
                                {message}
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
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-submit" disabled={loading}>
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>

                        <div className="auth-actions">
                            <Link to="/login" className="auth-link-button">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
