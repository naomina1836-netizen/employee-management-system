import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function PayrollList() {
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayroll();
    }, []);

    async function loadPayroll() {
        try {
            const response = await api.get("/payroll");
            setPayroll(response.data);
        } catch (error) {
            console.error("Error loading payroll:", error);
            toast.error("Failed to load payroll records");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading payroll records...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Payroll</h1>
                <Link to="/payroll/create" className="btn-primary">
                    Add Payroll
                </Link>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Employee</th>
                            <th>Month</th>
                            <th>Year</th>
                            <th>Basic Salary</th>
                            <th>Allowance</th>
                            <th>Net Salary</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payroll.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-row">No payroll records found</td>
                            </tr>
                        ) : (
                            payroll.map((p) => (
                                <tr key={p.payroll_id}>
                                    <td>{p.payroll_id}</td>
                                    <td>{p.employee_name || '-'}</td>
                                    <td>{p.month}</td>
                                    <td>{p.year}</td>
                                    <td>ETB {parseFloat(p.basic_salary).toLocaleString()}</td>
                                    <td>ETB {parseFloat(p.allowance).toLocaleString()}</td>
                                    <td><strong>ETB {parseFloat(p.net_salary).toLocaleString()}</strong></td>
                                    <td>
                                        <Link to={`/payroll/${p.payroll_id}`} className="btn-sm">View</Link>
                                        <Link to={`/payroll/edit/${p.payroll_id}`} className="btn-sm btn-edit">Edit</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PayrollList;