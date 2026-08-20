import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function PerformanceList() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const canManage = ["Admin", "HR", "Manager"].includes(user?.role);

    useEffect(() => {
        loadReviews();
    }, [user]);

    async function loadReviews() {
        try {
            if (user?.role === "Employee" && !user.employee_id) {
                setReviews([]);
                return;
            }
            const endpoint = user?.role === "Employee" ? `/performance/employee/${user.employee_id}` : "/performance";
            const response = await api.get(endpoint);
            setReviews(response.data);
        } catch (error) {
            console.error("Error loading reviews:", error);
            toast.error("Failed to load performance reviews");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading performance reviews...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Performance Reviews</h1>
                {canManage && <Link to="/performance/create" className="btn-primary">
                    Add Review
                </Link>}
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Employee</th>
                            <th>Reviewer</th>
                            <th>Date</th>
                            <th>Teamwork</th>
                            <th>Productivity</th>
                            <th>Overall</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-row">
                                    No performance reviews found. {canManage && <Link to="/performance/create">Create the first review</Link>}
                                </td>
                            </tr>
                        ) : (
                            reviews.map((review) => (
                                <tr key={review.review_id}>
                                    <td>{review.review_id}</td>
                                    <td>{review.employee_name || '-'}</td>
                                    <td>{review.reviewer_name || '-'}</td>
                                    <td>{new Date(review.review_date).toLocaleDateString()}</td>
                                    <td>{review.teamwork_score || '-'}/5</td>
                                    <td>{review.productivity_score || '-'}/5</td>
                                    <td>
                                        <strong className="overall-score">{review.overall_score || '-'}</strong>
                                    </td>
                                    <td>
                                        {user?.role !== "Employee" && <Link to={`/performance/${review.review_id}`} className="btn-sm">View</Link>}
                                        {canManage && <Link to={`/performance/edit/${review.review_id}`} className="btn-sm btn-edit">Edit</Link>}
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
