import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";

function PerformanceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const confirm = useConfirm();
    const canEdit = ["Admin", "HR", "Manager"].includes(user?.role);
    const canDelete = ["Admin", "HR"].includes(user?.role);
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadReview();
    }, [id]);

    async function loadReview() {
        setLoading(true);
        try {
            const response = await api.get(`/performance/${id}`);
            setReview(response.data);
        } catch (error) {
            console.error("Error loading review:", error);
            toast.error(error.response?.data?.message || "Failed to load performance review");
            navigate("/performance");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        const confirmed = await confirm({
            title: "Delete performance review",
            message: "Delete this performance review?",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        setDeleting(true);
        try {
            await api.delete(`/performance/${id}`);
            navigate("/performance");
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error(error.response?.data?.message || "Failed to delete performance review");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading performance details...</div>;
    }

    if (!review) {
        return <div className="empty-state">Performance review not found</div>;
    }

    const scoreFields = [
        { label: "Teamwork", value: review.teamwork_score },
        { label: "Communication", value: review.communication_score },
        { label: "Productivity", value: review.productivity_score },
        { label: "Punctuality", value: review.punctuality_score },
        { label: "Leadership", value: review.leadership_score }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Performance Review #{review.review_id}</h1>
                    <p>{review.employee_name}</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {canEdit && <Link to={`/performance/edit/${review.review_id}`} className="btn-primary">
                        Edit Review
                    </Link>}
                    <button className="btn-secondary" onClick={() => navigate("/performance")}>
                        Back to List
                    </button>
                    {canDelete && <button className="btn-secondary" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                    </button>}
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-field">
                        <label>Employee</label>
                        <p>{review.employee_name}</p>
                    </div>
                    <div className="profile-field">
                        <label>Reviewer</label>
                        <p>{review.reviewer_name}</p>
                    </div>
                    <div className="profile-field">
                        <label>Review Date</label>
                        <p>{review.review_date ? new Date(review.review_date).toLocaleDateString() : "-"}</p>
                    </div>
                    {scoreFields.map((field) => (
                        <div className="profile-field" key={field.label}>
                            <label>{field.label}</label>
                            <p>{field.value || "-"}/5</p>
                        </div>
                    ))}
                    <div className="profile-field">
                        <label>Overall Score</label>
                        <p><strong>{review.overall_score || "-"}</strong></p>
                    </div>
                    <div className="profile-field">
                        <label>Comments</label>
                        <p>{review.comments || "-"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PerformanceDetails;
