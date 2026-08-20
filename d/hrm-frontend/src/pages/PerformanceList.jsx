import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function PerformanceList() {
  const { user } = useAuth();
  const isEmployee = user?.role === "Employee";
  const canManage = ["Admin", "HR", "Manager"].includes(user?.role);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [user?.employee_id]);

  async function load() {
    setLoading(true);
    try {
      if (isEmployee) {
        if (!user?.employee_id) {
          setReviews([]);
          return;
        }
        const res = await api.get(`/performance/employee/${user.employee_id}`);
        setReviews(res.data);
      } else {
        const res = await api.get("/performance");
        setReviews(res.data);
      }
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading performance…</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">{isEmployee ? "My reviews" : "Talent"}</p>
          <h1>Performance ({reviews.length})</h1>
        </div>
        {canManage && (
          <Link to="/performance/create" className="btn-primary">Add review</Link>
        )}
      </div>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {!isEmployee && <th>Employee</th>}
              <th>Reviewer</th>
              <th>Date</th>
              <th>Overall</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">No reviews found</td></tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.review_id}>
                  <td>{r.review_id}</td>
                  {!isEmployee && <td>{r.employee_name || r.employee_id}</td>}
                  <td>{r.reviewer_name || r.reviewer_id}</td>
                  <td>{r.review_date ? new Date(r.review_date).toLocaleDateString() : "—"}</td>
                  <td>{r.overall_score ?? "—"}</td>
                  <td>
                    <Link to={`/performance/${r.review_id}`} className="btn-secondary">View</Link>
                    {canManage && (
                      <Link to={`/performance/edit/${r.review_id}`} className="btn-edit">Edit</Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PerformanceList;
