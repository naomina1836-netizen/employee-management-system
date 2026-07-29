const db = require("../config/db");
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

exports.create = async (req, res) => {
    try {
        const {
            employee_id, reviewer_id, review_date,
            teamwork_score, communication_score, productivity_score,
            punctuality_score, leadership_score, comments
        } = req.body;

        if (!employee_id || !reviewer_id || !review_date) {
            return res.status(400).json({ 
                message: "Employee, reviewer, and review date are required" 
            });
        }

        // Calculate overall score
        const scores = [teamwork_score, communication_score, productivity_score, punctuality_score, leadership_score];
        const validScores = scores.filter(s => s !== undefined && s !== null);
        let overall_score = 0;
        if (validScores.length > 0) {
            const sum = validScores.reduce((a, b) => a + b, 0);
            overall_score = parseFloat((sum / validScores.length).toFixed(2));
        }

        const [result] = await db.query(
            `INSERT INTO performance_reviews 
             (employee_id, reviewer_id, review_date, 
              teamwork_score, communication_score, productivity_score,
              punctuality_score, leadership_score, comments, overall_score) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id, reviewer_id, review_date,
                teamwork_score || null, communication_score || null,
                productivity_score || null, punctuality_score || null,
                leadership_score || null, comments || null, overall_score
            ]
        );

        res.status(201).json({
            message: "Performance review created successfully",
            review_id: result.insertId
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
            teamwork_score, communication_score, productivity_score,
            punctuality_score, leadership_score, comments
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM performance_reviews WHERE review_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Calculate overall score
        const scores = [teamwork_score, communication_score, productivity_score, punctuality_score, leadership_score];
        const validScores = scores.filter(s => s !== undefined && s !== null);
        let overall_score = existing[0].overall_score;
        if (validScores.length > 0) {
            const sum = validScores.reduce((a, b) => a + b, 0);
            overall_score = parseFloat((sum / validScores.length).toFixed(2));
        }

        await db.query(
            `UPDATE performance_reviews SET 
                teamwork_score = ?, communication_score = ?, 
                productivity_score = ?, punctuality_score = ?,
                leadership_score = ?, comments = ?, overall_score = ?
             WHERE review_id = ?`,
            [
                teamwork_score || null, communication_score || null,
                productivity_score || null, punctuality_score || null,
                leadership_score || null, comments || null, overall_score, id
            ]
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

        await db.query(
            "DELETE FROM performance_reviews WHERE review_id = ?",
            [id]
        );

        res.json({ message: "Performance review deleted successfully" });

    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Failed to delete performance review" });
    }
};