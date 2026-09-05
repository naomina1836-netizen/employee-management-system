const db = require("../config/db");
function normalizeScore(value) {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > 5) return null;
    return Math.round(n); 
}

function computeOverallScore(scores) {
    const valid = scores
        .map(normalizeScore)
        .filter((s) => s !== null);

    if (valid.length === 0) return 0;

    const sum = valid.reduce((a, b) => a + b, 0);
    return Number((sum / valid.length).toFixed(2));
}

exports.getAll = async (req, res) => {
    try {
        const [reviews] = await db.query(
            `SELECT r.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
             FROM performance_reviews r
             JOIN employees e ON r.employee_id = e.employee_id
             JOIN employees rv ON r.reviewer_id = rv.employee_id
             ORDER BY r.review_date DESC`
        );

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
};

exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (
            req.user.role === "Employee" &&
            (!req.user.employee_id || Number(employeeId) !== Number(req.user.employee_id))
        ) {
            return res.status(403).json({ message: "You can only view your own performance reviews" });
        }

        const [reviews] = await db.query(
            `SELECT r.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
             FROM performance_reviews r
             JOIN employees e ON r.employee_id = e.employee_id
             JOIN employees rv ON r.reviewer_id = rv.employee_id
             WHERE r.employee_id = ?
             ORDER BY r.review_date DESC`,
            [employeeId]
        );

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching employee reviews:", error);
        res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;

        const [reviews] = await db.query(
            `SELECT r.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
             FROM performance_reviews r
             JOIN employees e ON r.employee_id = e.employee_id
             JOIN employees rv ON r.reviewer_id = rv.employee_id
             WHERE r.review_id = ?`,
            [id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.json(reviews[0]);
    } catch (error) {
        console.error("Error fetching review:", error);
        res.status(500).json({ message: "Failed to fetch performance review" });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            employee_id,
            reviewer_id,
            review_date,
            teamwork_score,
            communication_score,
            productivity_score,
            punctuality_score,
            leadership_score,
            comments,
        } = req.body;

        if (!employee_id || !reviewer_id || !review_date) {
            return res.status(400).json({
                message: "Employee, reviewer, and review date are required",
            });
        }

        const t = normalizeScore(teamwork_score);
        const c = normalizeScore(communication_score);
        const p = normalizeScore(productivity_score);
        const pu = normalizeScore(punctuality_score);
        const l = normalizeScore(leadership_score);

        const overall_score = computeOverallScore([t, c, p, pu, l]);

        const [result] = await db.query(
            `INSERT INTO performance_reviews 
             (employee_id, reviewer_id, review_date, 
              teamwork_score, communication_score, productivity_score,
              punctuality_score, leadership_score, comments, overall_score) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id,
                reviewer_id,
                review_date,
                t,
                c,
                p,
                pu,
                l,
                comments || null,
                overall_score,
            ]
        );

        res.status(201).json({
            message: "Performance review created successfully",
            review_id: result.insertId,
        });
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Failed to create performance review" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            teamwork_score,
            communication_score,
            productivity_score,
            punctuality_score,
            leadership_score,
            comments,
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM performance_reviews WHERE review_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }

        const t = normalizeScore(teamwork_score);
        const c = normalizeScore(communication_score);
        const p = normalizeScore(productivity_score);
        const pu = normalizeScore(punctuality_score);
        const l = normalizeScore(leadership_score);

        const overall_score = computeOverallScore([t, c, p, pu, l]);

        await db.query(
            `UPDATE performance_reviews SET 
                teamwork_score = ?, communication_score = ?, 
                productivity_score = ?, punctuality_score = ?,
                leadership_score = ?, comments = ?, overall_score = ?
             WHERE review_id = ?`,
            [t, c, p, pu, l, comments || null, overall_score, id]
        );

        res.json({ message: "Performance review updated successfully" });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Failed to update performance review" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            "SELECT * FROM performance_reviews WHERE review_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }

        await db.query("DELETE FROM performance_reviews WHERE review_id = ?", [id]);

        res.json({ message: "Performance review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Failed to delete performance review" });
    }
};

// SEARCH PERFORMANCE REVIEWS
exports.search = async (req, res) => {
    try {
        const { keyword, min_score, max_score } = req.query;

        let query = `
            SELECT r.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
            FROM performance_reviews r
            JOIN employees e ON r.employee_id = e.employee_id
            JOIN employees rv ON r.reviewer_id = rv.employee_id
            WHERE 1=1
        `;

        const params = [];

        if (keyword) {
            query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ?)`;
            const searchTerm = `%${keyword}%`;
            params.push(searchTerm, searchTerm);
        }

        if (min_score) {
            query += ` AND r.overall_score >= ?`;
            params.push(min_score);
        }

        if (max_score) {
            query += ` AND r.overall_score <= ?`;
            params.push(max_score);
        }

        query += ` ORDER BY r.review_date DESC`;

        const [reviews] = await db.query(query, params);
        res.json(reviews);
    } catch (error) {
        console.error("Error searching performance reviews:", error);
        res.status(500).json({ message: "Failed to search performance reviews" });
    }
};

// GET PERFORMANCE STATISTICS (Report)
exports.getStats = async (req, res) => {
    try {
        const [avgScores] = await db.query(
            `SELECT 
                AVG(teamwork_score) as avg_teamwork,
                AVG(communication_score) as avg_communication,
                AVG(productivity_score) as avg_productivity,
                AVG(punctuality_score) as avg_punctuality,
                AVG(leadership_score) as avg_leadership,
                AVG(overall_score) as avg_overall
             FROM performance_reviews`
        );

        const [topPerformers] = await db.query(
            `SELECT e.employee_id,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    AVG(r.overall_score) as avg_score,
                    COUNT(r.review_id) as review_count
             FROM performance_reviews r
             JOIN employees e ON r.employee_id = e.employee_id
             GROUP BY e.employee_id
             ORDER BY avg_score DESC
             LIMIT 5`
        );

        const [monthlyReviews] = await db.query(
            `SELECT DATE_FORMAT(review_date, '%Y-%m') as month, COUNT(*) as count
             FROM performance_reviews
             WHERE review_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(review_date, '%Y-%m')
             ORDER BY month`
        );

        const [total] = await db.query(
            `SELECT COUNT(*) as total FROM performance_reviews`
        );

        res.json({
            totalReviews: total[0].total,
            averageScores: avgScores[0],
            topPerformers: topPerformers,
            monthlyTrend: monthlyReviews,
        });
    } catch (error) {
        console.error("Error fetching performance stats:", error);
        res.status(500).json({ message: "Failed to fetch performance statistics" });
    }
};
