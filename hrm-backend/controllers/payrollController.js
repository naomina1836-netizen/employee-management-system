const db = require("../config/db");

exports.getAll = async (req, res) => {
    try {
        const [payroll] = await db.query(
            `SELECT p.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    pos.title as position_title
             FROM payroll p
             JOIN employees e ON p.employee_id = e.employee_id
             JOIN positions pos ON e.position_id = pos.position_id
             ORDER BY p.year DESC, FIELD(p.month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December') DESC`
        );

        res.json(payroll);

    } catch (error) {
        console.error("Error fetching payroll:", error);
        res.status(500).json({ message: "Failed to fetch payroll records" });
    }
};

exports.getByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (["Employee", "Manager"].includes(req.user.role) &&
            (!req.user.employee_id || Number(employeeId) !== Number(req.user.employee_id))) {
            return res.status(403).json({ message: "You can only view your own payroll records" });
        }

        const [payroll] = await db.query(
            `SELECT p.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    pos.title as position_title
             FROM payroll p
             JOIN employees e ON p.employee_id = e.employee_id
             JOIN positions pos ON e.position_id = pos.position_id
             WHERE p.employee_id = ?
             ORDER BY p.year DESC, FIELD(p.month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December') DESC`,
            [employeeId]
        );

        res.json(payroll);

    } catch (error) {
        console.error("Error fetching employee payroll:", error);
        res.status(500).json({ message: "Failed to fetch payroll records" });
    }
};

exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;

        const [payroll] = await db.query(
            `SELECT p.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    pos.title as position_title
             FROM payroll p
             JOIN employees e ON p.employee_id = e.employee_id
             JOIN positions pos ON e.position_id = pos.position_id
             WHERE p.payroll_id = ?`,
            [id]
        );

        if (payroll.length === 0) {
            return res.status(404).json({ message: "Payroll record not found" });
        }

        res.json(payroll[0]);
    } catch (error) {
        console.error("Error fetching payroll record:", error);
        res.status(500).json({ message: "Failed to fetch payroll record" });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            employee_id, month, year, basic_salary, allowance,
            overtime, deduction, tax, net_salary, payment_date
        } = req.body;

        if (!employee_id || !month || !year) {
            return res.status(400).json({ message: "Employee, month, and year are required" });
        }

        const [existing] = await db.query(
            "SELECT * FROM payroll WHERE employee_id = ? AND month = ? AND year = ?",
            [employee_id, month, year]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Payroll already exists for this month" });
        }

        const [result] = await db.query(
            `INSERT INTO payroll 
             (employee_id, month, year, basic_salary, allowance, 
              overtime, deduction, tax, net_salary, payment_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id, month, year, 
                basic_salary || 0, allowance || 0,
                overtime || 0, deduction || 0, tax || 0,
                net_salary || 0, payment_date || null
            ]
        );

        res.status(201).json({
            message: "Payroll record created successfully",
            payroll_id: result.insertId
        });

    } catch (error) {
        console.error("Error creating payroll:", error);
        res.status(500).json({ message: "Failed to create payroll record" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            basic_salary, allowance, overtime, deduction, tax, net_salary, payment_date
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM payroll WHERE payroll_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Payroll record not found" });
        }

        await db.query(
            `UPDATE payroll SET 
                basic_salary = ?, allowance = ?, overtime = ?, 
                deduction = ?, tax = ?, net_salary = ?, payment_date = ?
             WHERE payroll_id = ?`,
            [
                basic_salary || 0, allowance || 0, overtime || 0,
                deduction || 0, tax || 0, net_salary || 0,
                payment_date || null, id
            ]
        );

        res.json({ message: "Payroll record updated successfully" });

    } catch (error) {
        console.error("Error updating payroll:", error);
        res.status(500).json({ message: "Failed to update payroll record" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            "SELECT * FROM payroll WHERE payroll_id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Payroll record not found" });
        }

        await db.query(
            "DELETE FROM payroll WHERE payroll_id = ?",
            [id]
        );

        res.json({ message: "Payroll record deleted successfully" });

    } catch (error) {
        console.error("Error deleting payroll:", error);
        res.status(500).json({ message: "Failed to delete payroll record" });
    }
};

exports.generate = async (req, res) => {
    try {
        const { month, year } = req.body;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const [employees] = await db.query(
            `SELECT e.employee_id, p.basic_salary 
             FROM employees e
             JOIN positions p ON e.position_id = p.position_id
             WHERE e.employment_status = 'Active'`
        );

        let createdCount = 0;

        for (const employee of employees) {
            const [existing] = await db.query(
                "SELECT * FROM payroll WHERE employee_id = ? AND month = ? AND year = ?",
                [employee.employee_id, month, year]
            );

            if (existing.length === 0) {
                const basic_salary = employee.basic_salary || 0;
                const allowance = basic_salary * 0.1;
                const tax = basic_salary * 0.2;
                const net_salary = basic_salary + allowance - tax;

                await db.query(
                    `INSERT INTO payroll 
                     (employee_id, month, year, basic_salary, allowance, tax, net_salary) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [employee.employee_id, month, year, basic_salary, allowance, tax, net_salary]
                );

                createdCount++;
            }
        }

        res.json({
            message: "Payroll generated for " + createdCount + " employees",
            employees_processed: createdCount
        });

    } catch (error) {
        console.error("Error generating payroll:", error);
        res.status(500).json({ message: "Failed to generate payroll" });
    }
};
// SEARCH PAYROLL
exports.search = async (req, res) => {
    try {
        const { keyword, month, year } = req.query;
        
        let query = `
            SELECT p.*, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    pos.title as position_title
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            JOIN positions pos ON e.position_id = pos.position_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (keyword) {
            query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ?)`;
            const searchTerm = `%${keyword}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (month) {
            query += ` AND p.month = ?`;
            params.push(month);
        }
        
        if (year) {
            query += ` AND p.year = ?`;
            params.push(year);
        }
        
        query += ` ORDER BY p.year DESC, FIELD(p.month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December') DESC`;
        
        const [payroll] = await db.query(query, params);
        res.json(payroll);

    } catch (error) {
        console.error("Error searching payroll:", error);
        res.status(500).json({ message: "Failed to search payroll" });
    }
};

// GET PAYROLL STATISTICS (Report)
exports.getStats = async (req, res) => {
    try {
        // Total payroll by month
        const [monthlyTotal] = await db.query(
            `SELECT month, year, SUM(net_salary) as total
             FROM payroll
             GROUP BY year, month
             ORDER BY year DESC, FIELD(month, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December') DESC
             LIMIT 6`
        );
        
        // Average salary by department
        const [deptAvg] = await db.query(
            `SELECT d.department_name, AVG(p.net_salary) as average
             FROM payroll p
             JOIN employees e ON p.employee_id = e.employee_id
             JOIN departments d ON e.department_id = d.department_id
             GROUP BY d.department_id`
        );
        
        // Highest paid employees (this month)
        const [topEarners] = await db.query(
            `SELECT CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                    p.net_salary,
                    p.month,
                    p.year
             FROM payroll p
             JOIN employees e ON p.employee_id = e.employee_id
             WHERE p.month = MONTHNAME(CURDATE()) AND p.year = YEAR(CURDATE())
             ORDER BY p.net_salary DESC
             LIMIT 5`
        );
        
        // Total payroll this month
        const [thisMonth] = await db.query(
            `SELECT SUM(net_salary) as total
             FROM payroll
             WHERE month = MONTHNAME(CURDATE()) AND year = YEAR(CURDATE())`
        );
        
        res.json({
            thisMonthTotal: thisMonth[0].total || 0,
            monthlyTotal: monthlyTotal,
            departmentAverage: deptAvg,
            topEarners: topEarners
        });

    } catch (error) {
        console.error("Error fetching payroll stats:", error);
        res.status(500).json({ message: "Failed to fetch payroll statistics" });
    }
};
