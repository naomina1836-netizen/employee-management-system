const db = require("../config/db");

exports.getAll = async (req, res) => {
    try {
        const [employees] = await db.query(
            `SELECT e.*, 
                    d.department_name,
                    p.title as position_title,
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.department_id
             LEFT JOIN positions p ON e.position_id = p.position_id
             LEFT JOIN employees m ON e.manager_id = m.employee_id
             ORDER BY e.employee_id DESC`
        );

        res.json(employees);

    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ message: "Failed to fetch employees" });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;

        const [employees] = await db.query(
            `SELECT e.*, 
                    d.department_name,
                    p.title as position_title,
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.department_id
             LEFT JOIN positions p ON e.position_id = p.position_id
             LEFT JOIN employees m ON e.manager_id = m.employee_id
             WHERE e.employee_id = ?`,
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json(employees[0]);

    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ message: "Failed to fetch employee" });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            first_name, last_name, gender, phone, email, address,
            date_of_birth, hire_date, department_id, position_id,
            manager_id, employment_status
        } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: "First name, last name, and email are required" });
        }

        const [existing] = await db.query(
            "SELECT * FROM employees WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const [result] = await db.query(
            `INSERT INTO employees 
             (first_name, last_name, gender, phone, email, address, 
              date_of_birth, hire_date, department_id, position_id, 
              manager_id, employment_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, gender || "Male",
                phone || null, email, address || null,
                date_of_birth || null, hire_date || null,
                department_id || null, position_id || null,
                manager_id || null, employment_status || "Active"
            ]
        );

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'INSERT', 'employees', ?)`,
            [req.user.user_id, result.insertId]
        );

        res.status(201).json({
            message: "Employee created successfully",
            employee_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ message: "Failed to create employee" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name, last_name, gender, phone, email, address,
            date_of_birth, hire_date, department_id, position_id,
            manager_id, employment_status
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM employees WHERE employee_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (email) {
            const [emailCheck] = await db.query(
                "SELECT * FROM employees WHERE email = ? AND employee_id != ?",
                [email, id]
            );

            if (emailCheck.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }

        await db.query(
            `UPDATE employees SET 
                first_name = ?, last_name = ?, gender = ?, phone = ?, 
                email = ?, address = ?, date_of_birth = ?, hire_date = ?, 
                department_id = ?, position_id = ?, manager_id = ?, 
                employment_status = ?
             WHERE employee_id = ?`,
            [
                first_name, last_name, gender || "Male",
                phone || null, email, address || null,
                date_of_birth || null, hire_date || null,
                department_id || null, position_id || null,
                manager_id || null, employment_status || "Active",
                id
            ]
        );

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'UPDATE', 'employees', ?)`,
            [req.user.user_id, id]
        );

        res.json({ message: "Employee updated successfully" });

    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ message: "Failed to update employee" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            "SELECT * FROM employees WHERE employee_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        await db.query(
            "DELETE FROM employees WHERE employee_id = ?",
            [id]
        );

        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'DELETE', 'employees', ?)`,
            [req.user.user_id, id]
        );

        res.json({ message: "Employee deleted successfully" });

    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ message: "Failed to delete employee" });
    }
};

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
// SEARCH EMPLOYEES
exports.search = async (req, res) => {
    try {
        const { keyword, department, position, status } = req.query;
        
        let query = `
            SELECT e.*, 
                    d.department_name,
                    p.title as position_title,
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            LEFT JOIN employees m ON e.manager_id = m.employee_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (keyword) {
            query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.phone LIKE ?)`;
            const searchTerm = `%${keyword}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (department) {
            query += ` AND e.department_id = ?`;
            params.push(department);
        }

        if (position) {
            query += ` AND e.position_id = ?`;
            params.push(position);
        }
        
        if (status) {
            query += ` AND e.employment_status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY e.employee_id DESC`;
        
        const [employees] = await db.query(query, params);
        res.json(employees);

    } catch (error) {
        console.error("Error searching employees:", error);
        res.status(500).json({ message: "Failed to search employees" });
    }
};

// GET EMPLOYEE STATISTICS (Report)
exports.getStats = async (req, res) => {
    try {
        // Total by department
        const [deptStats] = await db.query(
            `SELECT d.department_name, COUNT(e.employee_id) as count
             FROM departments d
             LEFT JOIN employees e ON d.department_id = e.department_id AND e.employment_status = 'Active'
             GROUP BY d.department_id`
        );
        
        // Total by status
        const [statusStats] = await db.query(
            `SELECT employment_status, COUNT(*) as count
             FROM employees
             GROUP BY employment_status`
        );
        
        // Total by gender
        const [genderStats] = await db.query(
            `SELECT gender, COUNT(*) as count
             FROM employees
             GROUP BY gender`
        );
        
        // Total employees
        const [total] = await db.query(
            `SELECT COUNT(*) as total FROM employees`
        );
        
        // Recent hires (last 30 days)
        const [recentHires] = await db.query(
            `SELECT e.*, d.department_name, p.title as position_title
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.department_id
             LEFT JOIN positions p ON e.position_id = p.position_id
             WHERE e.hire_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             ORDER BY e.hire_date DESC`
        );
        
        res.json({
            total: total[0].total,
            byDepartment: deptStats,
            byStatus: statusStats,
            byGender: genderStats,
            recentHires: recentHires
        });

    } catch (error) {
        console.error("Error fetching employee stats:", error);
        res.status(500).json({ message: "Failed to fetch employee statistics" });
    }
};
