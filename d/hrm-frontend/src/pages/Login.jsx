import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@hrm.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        (data?.detail && `${data.message}: ${data.detail}`) ||
        data?.message ||
        (err?.message === "Network Error"
          ? "Cannot reach the server. Is the backend running on port 5001?"
          : "Login failed. Check your credentials.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-ambient" />
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="brand-mark large">D</div>
          <p className="eyebrow">D.E.N.Y HRMS</p>
          <h1>Human resources, done properly.</h1>
          <p>
            D.E.N.Y HRMS helps teams manage attendance, leave, payroll, and performance.  </p>
          <ul className="login-perks">
            <li>Role-based access</li>
            <li>Live workforce insights</li>
            <li>AI assistant</li>
          </ul>
        </section>

        <section className="login-form-panel glass-panel">
          <h2>Sign in</h2>
          <p className="muted">Use your work email to continue</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>

          <p className="login-demo muted">
            Demo: <code>admin@hrm.com</code> / <code>password123</code>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
