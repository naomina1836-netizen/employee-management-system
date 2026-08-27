import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function EditPerformance() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        teamwork_score: "",
        communication_score: "",
        productivity_score: "",
        punctuality_score: "",
        leadership_score: "",
        comments: ""
    });
    const [meta, setMeta] = useState({
        employee_name: "",
        reviewer_name: "",
        review_date: ""
    });

    useEffect(() => {
        loadReview();
    }, [id]);

    async function loadReview() {
        setLoading(true);
        try {
            const response = await api.get(`/performance/${id}`);
            setFormData({
                teamwork_score: response.data.teamwork_score ?? "",
                communication_score: response.data.communication_score ?? "",
                productivity_score: response.data.productivity_score ?? "",
                punctuality_score: response.data.punctuality_score ?? "",
                leadership_score: response.data.leadership_score ?? "",
                comments: response.data.comments ?? ""
            });
            setMeta({
                employee_name: response.data.employee_name || "-",
                reviewer_name: response.data.reviewer_name || "-",
                review_date: response.data.review_date ? response.data.review_date.split("T")[0] : ""
            });
        } catch (error) {
            console.error("Error loading review:", error);
            toast.error(error.response?.data?.message || "Failed to load performance review");
            navigate("/performance");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(`/performance/${id}`, formData);
            navigate(`/performance/${id}`);
        } catch (error) {
            console.error("Error updating review:", error);
            toast.error(error.response?.data?.message || "Failed to update performance review");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading performance data...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Edit Performance Review</h1>
                    <p>{meta.employee_name} reviewed by {meta.reviewer_name}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate(`/performance/${id}`)}>
                    Cancel
                </button>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Employee</label>
                        <input type="text" value={meta.employee_name} disabled />
                    </div>
                    <div className="form-group">
                        <label>Reviewer</label>
                        <input type="text" value={meta.reviewer_name} disabled />
                    </div>
                    <div className="form-group">
                        <label>Review Date</label>
                        <input type="date" value={meta.review_date} disabled />
                    </div>
                    <div className="form-group">
                        <label>Teamwork Score</label>
                        <input type="number" name="teamwork_score" value={formData.teamwork_score} onChange={handleChange} min="1" max="5" step="1" />
                    </div>
                    <div className="form-group">
                        <label>Communication Score</label>
                        <input type="number" name="communication_score" value={formData.communication_score} onChange={handleChange} min="1" max="5" step="1" />
                    </div>
                    <div className="form-group">
                        <label>Productivity Score</label>
                        <input type="number" name="productivity_score" value={formData.productivity_score} onChange={handleChange} min="1" max="5" step="1" />
                    </div>
                    <div className="form-group">
                        <label>Punctuality Score</label>
                        <input type="number" name="punctuality_score" value={formData.punctuality_score} onChange={handleChange} min="1" max="5" step="1" />
                    </div>
                    <div className="form-group">
                        <label>Leadership Score</label>
                        <input type="number" name="leadership_score" value={formData.leadership_score} onChange={handleChange} min="1" max="5" step="1" />
                    </div>
                    <div className="form-group full-width">
                        <label>Comments</label>
                        <textarea name="comments" value={formData.comments} onChange={handleChange} rows="4" />
                    </div>
                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Update Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditPerformance;
