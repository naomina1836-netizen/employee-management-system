const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { getManagerDepartmentId, managerCanAccessEmployee } = require("../utils/departmentAccess");

async function roleForPosition(connection, positionId) {
    if (!positionId) {
        return "Employee";
    }

    const [positions] = await connection.query(
        "SELECT title FROM positions WHERE position_id = ?",
        [positionId]
    );

    return positions[0] && /manager/i.test(positions[0].title)
        ? "Manager"
        : "Employee";
}

exports.getAll = async (req, res) => {
    try {
        let query = `SELECT e.*,
                    d.department_name,
                    p.title as position_title,
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name,
                    u.role as user_role
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.department_id
             LEFT JOIN positions p ON e.position_id = p.position_id
             LEFT JOIN employees m ON e.manager_id = m.employee_id
             LEFT JOIN users u ON u.employee_id = e.employee_id`;
        const params = [];
        const departmentId = await getManagerDepartmentId(req.user);
        if (departmentId !== null) {
            query += " WHERE e.department_id = ?";
            params.push(departmentId);
        }
        query += " ORDER BY e.employee_id DESC";
        const [employees] = await db.query(query, params);

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
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name,
                    u.role as user_role
             FROM employees e
             LEFT JOIN departments d ON e.department_id = d.department_id
             LEFT JOIN positions p ON e.position_id = p.position_id
             LEFT JOIN employees m ON e.manager_id = m.employee_id
             LEFT JOIN users u ON u.employee_id = e.employee_id
             WHERE e.employee_id = ?`,
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (req.user.role === "Manager" && !(await managerCanAccessEmployee(req.user, id))) {
            return res.status(403).json({ message: "You can only view employees in your department" });
        }

        res.json(employees[0]);

    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ message: "Failed to fetch employee" });
    }
};

exports.create = async (req, res) => {
    let connection;

    try {
        const {
            first_name, last_name, gender, phone, email, address,
            date_of_birth, hire_date, department_id, position_id,
            manager_id, employment_status
        } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: "First name, last name, and email are required" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.query(
            "SELECT * FROM employees WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Email already exists" });
        }

        const [existingUsers] = await connection.query(
            "SELECT user_id, employee_id FROM users WHERE email = ?",
            [email]
        );
        const accountRole = await roleForPosition(connection, position_id);

        if (existingUsers.length > 0 && existingUsers[0].employee_id) {
            await connection.rollback();
            return res.status(400).json({ message: "This email is already linked to another user account" });
        }

        const [result] = await connection.query(
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

        await connection.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id) 
             VALUES (?, 'INSERT', 'employees', ?)`,
            [req.user.user_id, result.insertId]
        );

        let accountCreated = false;
        let accountLinked = false;

        if (existingUsers.length > 0) {
            await connection.query(
                `UPDATE users
                 SET employee_id = ?,
                     role = CASE WHEN role IN ('Employee', 'Manager') THEN ? ELSE role END
                 WHERE user_id = ?`,
                [result.insertId, accountRole, existingUsers[0].user_id]
            );
            accountLinked = true;
        } else {
            const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || "password123";
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            const username = `employee${result.insertId}`;

            await connection.query(
                `INSERT INTO users (username, email, password, role, employee_id, status)
                 VALUES (?, ?, ?, ?, ?, 'Active')`,
                [username, email, passwordHash, accountRole, result.insertId]
            );
            accountCreated = true;
        }

        await connection.commit();

        res.status(201).json({
            message: accountCreated
                ? "Employee and login account created successfully"
                : "Employee created and linked to the existing login account",
            employee_id: result.insertId,
            account_created: accountCreated,
            account_linked: accountLinked
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Error creating employee:", error);
        res.status(500).json({ message: "Failed to create employee" });
    } finally {
        if (connection) {
            connection.release();
        }
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

        const accountRole = await roleForPosition(db, position_id);

        // Keep a linked login account aligned with the employee's email and position.
        await db.query(
            `UPDATE users
             SET email = ?,
                 role = CASE WHEN role IN ('Employee', 'Manager') THEN ? ELSE role END
             WHERE employee_id = ?`,
            [email, accountRole, id]
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
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name,
                    u.role as user_role
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN positions p ON e.position_id = p.position_id
            LEFT JOIN employees m ON e.manager_id = m.employee_id
            LEFT JOIN users u ON u.employee_id = e.employee_id
            WHERE 1=1
        `;
        
        const params = [];

        const departmentId = await getManagerDepartmentId(req.user);
        if (departmentId !== null) {
            query += " AND e.department_id = ?";
            params.push(departmentId);
        }
        
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
