import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function CreatePayroll() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: "",
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        basic_salary: "",
        allowance: "0",
        overtime: "0",
        deduction: "0",
        tax: "0",
        net_salary: "0",
        payment_date: ""
    });

    useEffect(() => {
        loadEmployees();
    }, []);

    async function loadEmployees() {
        try {
            const response = await api.get("/employees");
            setEmployees(response.data);
        } catch (error) {
            console.error("Error loading employees:", error);
            toast.error("Failed to load employees");
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // If employee selected, get their basic salary
        if (name === "employee_id") {
            const emp = employees.find(e => e.employee_id === parseInt(value));
            setSelectedEmployee(emp);
            if (emp) {
                setFormData(prev => ({
                    ...prev,
                    employee_id: value,
                    basic_salary: emp.basic_salary || ""
                }));
            }
        }

        // Auto-calculate net salary
        if (name === "basic_salary" || name === "allowance" || name === "overtime" || 
            name === "deduction" || name === "tax") {
            calculateNetSalary({
                ...formData,
                [name]: value
            });
        }
    };

    const calculateNetSalary = (data) => {
        const basic = parseFloat(data.basic_salary) || 0;
        const allowance = parseFloat(data.allowance) || 0;
        const overtime = parseFloat(data.overtime) || 0;
        const deduction = parseFloat(data.deduction) || 0;
        const tax = parseFloat(data.tax) || 0;
        
        const net = basic + allowance + overtime - deduction - tax;
        setFormData(prev => ({
            ...prev,
            net_salary: net.toFixed(2)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/payroll", formData);
            navigate("/payroll");
        } catch (error) {
            console.error("Error creating payroll:", error);
            toast.error(error.response?.data?.message || "Failed to create payroll record");
        } finally {
            setLoading(false);
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Add Payroll</h1>
                <button className="btn-secondary" onClick={() => navigate("/payroll")}>
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
                        <label>Month *</label>
                        <select name="month" value={formData.month} onChange={handleChange} required>
                            {months.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Year *</label>
                        <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            required
                            min="2000"
                            max="2100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Basic Salary *</label>
                        <input
                            type="number"
                            name="basic_salary"
                            value={formData.basic_salary}
                            onChange={handleChange}
                            required
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Allowance</label>
                        <input
                            type="number"
                            name="allowance"
                            value={formData.allowance}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Overtime</label>
                        <input
                            type="number"
                            name="overtime"
                            value={formData.overtime}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Deduction</label>
                        <input
                            type="number"
                            name="deduction"
                            value={formData.deduction}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tax</label>
                        <input
                            type="number"
                            name="tax"
                            value={formData.tax}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>Net Salary</label>
                        <input
                            type="text"
                            value={formData.net_salary}
                            disabled
                            style={{ background: "#f5f5f5", fontWeight: "bold" }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Payment Date</label>
                        <input
                            type="date"
                            name="payment_date"
                            value={formData.payment_date}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Creating..." : "Create Payroll"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePayroll;