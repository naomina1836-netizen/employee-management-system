import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function CreatePerformance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: "",
        reviewer_id: "",
        review_date: new Date().toISOString().split('T')[0],
        teamwork_score: "",
        communication_score: "",
        productivity_score: "",
        punctuality_score: "",
        leadership_score: "",
        comments: ""
    });
    const [overallScore, setOverallScore] = useState(0);

    useEffect(() => {
        loadEmployees();
    }, []);

    useEffect(() => {
        calculateOverall();
    }, [formData.teamwork_score, formData.communication_score, formData.productivity_score, 
        formData.punctuality_score, formData.leadership_score]);

    async function loadEmployees() {
        try {
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (error) {
            console.error("Error loading employees:", error);
            toast.error("Failed to load employees");
        }
    }

    function calculateOverall() {
        const scores = [
            parseFloat(formData.teamwork_score),
            parseFloat(formData.communication_score),
            parseFloat(formData.productivity_score),
            parseFloat(formData.punctuality_score),
            parseFloat(formData.leadership_score)
        ];
        
        const validScores = scores.filter(s => !isNaN(s) && s > 0);
        if (validScores.length > 0) {
            const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
            setOverallScore(avg);
        } else {
            setOverallScore(0);
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
        setLoading(true);

        try {
            const data = {
                ...formData,
                overall_score: overallScore
            };
            await api.post("/performance", data);
            navigate("/performance");
        } catch (error) {
            console.error("Error creating review:", error);
            toast.error(error.response?.data?.message || "Failed to create performance review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Add Performance Review</h1>
                <button className="btn-secondary" onClick={() => navigate("/performance")}>
                    Cancel
                </button>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Employee *</label>
                        <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Reviewer *</label>
                        <select name="reviewer_id" value={formData.reviewer_id} onChange={handleChange} required>
                            <option value="">Select Reviewer</option>
                            {employees.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Review Date *</label>
                        <input
                            type="date"
                            name="review_date"
                            value={formData.review_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Teamwork Score (1-5)</label>
                        <input
                            type="number"
                            name="teamwork_score"
                            value={formData.teamwork_score}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            step="1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Communication Score (1-5)</label>
                        <input
                            type="number"
                            name="communication_score"
                            value={formData.communication_score}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            step="1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Productivity Score (1-5)</label>
                        <input
                            type="number"
                            name="productivity_score"
                            value={formData.productivity_score}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            step="1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Punctuality Score (1-5)</label>
                        <input
                            type="number"
                            name="punctuality_score"
                            value={formData.punctuality_score}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            step="1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Leadership Score (1-5)</label>
                        <input
                            type="number"
                            name="leadership_score"
                            value={formData.leadership_score}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            step="1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Overall Score</label>
                        <input
                            type="text"
                            value={overallScore ? overallScore.toFixed(2) : "0.00"}
                            disabled
                            style={{ background: "#f5f5f5", fontWeight: "bold" }}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Comments</label>
                        <textarea
                            name="comments"
                            value={formData.comments}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Add review comments..."
                        />
                    </div>

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Creating..." : "Create Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePerformance;