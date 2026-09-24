const db = require("../config/db");
const { logAuditEvent } = require("../utils/auditLogger");

// === DEPARTMENTS ===
exports.getDepartments = async (req, res) => {
    try {
        const [departments] = await db.query(
            "SELECT * FROM departments ORDER BY department_name"
        );
        res.json(departments);
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ message: "Failed to fetch departments" });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const { department_name, description } = req.body;

        if (!department_name) {
            return res.status(400).json({ message: "Department name is required" });
        }

        const [result] = await db.query(
            "INSERT INTO departments (department_name, description) VALUES (?, ?)",
            [department_name, description || null]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "CREATE",
            tableName: "departments",
            recordId: result.insertId,
            details: {
                department_name,
                description: description || null,
            },
        });

        res.status(201).json({
            message: "Department created successfully",
            department_id: result.insertId
        });
    } catch (error) {
        console.error("Error creating department:", error);
        res.status(500).json({ message: "Failed to create department" });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name, description } = req.body;

        await db.query(
            "UPDATE departments SET department_name = ?, description = ? WHERE department_id = ?",
            [department_name, description, id]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "UPDATE",
            tableName: "departments",
            recordId: Number(id),
            details: {
                department_name,
                description: description || null,
            },
        });

        res.json({ message: "Department updated successfully" });
    } catch (error) {
        console.error("Error updating department:", error);
        res.status(500).json({ message: "Failed to update department" });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "DELETE FROM departments WHERE department_id = ?",
            [id]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "DELETE",
            tableName: "departments",
            recordId: Number(id),
        });

        res.json({ message: "Department deleted successfully" });
    } catch (error) {
        console.error("Error deleting department:", error);
        res.status(500).json({ message: "Failed to delete department" });
    }
};

// === POSITIONS ===
exports.getPositions = async (req, res) => {
    try {
        const [positions] = await db.query(
            `SELECT p.*, d.department_name 
             FROM positions p
             LEFT JOIN departments d ON p.department_id = d.department_id
             ORDER BY p.title`
        );
        res.json(positions);
    } catch (error) {
        console.error("Error fetching positions:", error);
        res.status(500).json({ message: "Failed to fetch positions" });
    }
};

exports.createPosition = async (req, res) => {
    try {
        const { title, basic_salary, department_id } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Position title is required" });
        }

        const [result] = await db.query(
            "INSERT INTO positions (title, basic_salary, department_id) VALUES (?, ?, ?)",
            [title, basic_salary || 0, department_id || null]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "CREATE",
            tableName: "positions",
            recordId: result.insertId,
            details: {
                title,
                basic_salary: basic_salary || 0,
                department_id: department_id || null,
            },
        });

        res.status(201).json({
            message: "Position created successfully",
            position_id: result.insertId
        });
    } catch (error) {
        console.error("Error creating position:", error);
        res.status(500).json({ message: "Failed to create position" });
    }
};

exports.updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, basic_salary, department_id } = req.body;

        await db.query(
            "UPDATE positions SET title = ?, basic_salary = ?, department_id = ? WHERE position_id = ?",
            [title, basic_salary, department_id, id]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "UPDATE",
            tableName: "positions",
            recordId: Number(id),
            details: {
                title,
                basic_salary,
                department_id: department_id || null,
            },
        });

        res.json({ message: "Position updated successfully" });
    } catch (error) {
        console.error("Error updating position:", error);
        res.status(500).json({ message: "Failed to update position" });
    }
};

exports.deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "DELETE FROM positions WHERE position_id = ?",
            [id]
        );

        await logAuditEvent(db, {
            userId: req.user.user_id,
            action: "DELETE",
            tableName: "positions",
            recordId: Number(id),
        });

        res.json({ message: "Position deleted successfully" });
    } catch (error) {
        console.error("Error deleting position:", error);
        res.status(500).json({ message: "Failed to delete position" });
    }
};
