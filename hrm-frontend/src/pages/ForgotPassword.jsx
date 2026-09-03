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
        <div className="page-container" style={{ maxWidth: "680px", margin: "0 auto" }}>
            <div className="page-header">
                <h1>Forgot Password</h1>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group full-width">
                        <p style={{ margin: 0, color: "#4b5563" }}>
                            Enter your email address and we will send a one-time password reset link if an account exists.
                        </p>
                    </div>

                    <div className="form-group full-width">
                        <label>Email Address *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    {message && (
                        <div className="form-group full-width">
                            <p style={{ margin: 0, color: sent ? "#15803d" : "#b91c1c" }}>{message}</p>
                        </div>
                    )}

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                        <Link to="/login" className="btn-secondary" style={{ textDecoration: "none" }}>
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPassword;
