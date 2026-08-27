import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function formatMoneyInput(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function EditPayroll() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        basic_salary: "",
        allowance: "",
        overtime: "",
        deduction: "",
        tax: "",
        net_salary: "",
        payment_date: ""
    });
    const [meta, setMeta] = useState({
        employee_name: "",
        month: "",
        year: ""
    });

    useEffect(() => {
        loadPayroll();
    }, [id]);

    async function loadPayroll() {
        setLoading(true);
        try {
            const response = await api.get(`/payroll/${id}`);
            setFormData({
                basic_salary: formatMoneyInput(response.data.basic_salary),
                allowance: formatMoneyInput(response.data.allowance),
                overtime: formatMoneyInput(response.data.overtime),
                deduction: formatMoneyInput(response.data.deduction),
                tax: formatMoneyInput(response.data.tax),
                net_salary: formatMoneyInput(response.data.net_salary),
                payment_date: response.data.payment_date ? response.data.payment_date.split("T")[0] : ""
            });
            setMeta({
                employee_name: response.data.employee_name || "-",
                month: response.data.month || "",
                year: response.data.year || ""
            });
        } catch (error) {
            console.error("Error loading payroll:", error);
            toast.error(error.response?.data?.message || "Failed to load payroll record");
            navigate("/payroll");
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(`/payroll/${id}`, formData);
            navigate(`/payroll/${id}`);
        } catch (error) {
            console.error("Error updating payroll:", error);
            toast.error(error.response?.data?.message || "Failed to update payroll record");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading payroll data...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Edit Payroll</h1>
                    <p>{meta.employee_name} - {meta.month} {meta.year}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate(`/payroll/${id}`)}>
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
                        <label>Month</label>
                        <input type="text" value={meta.month} disabled />
                    </div>
                    <div className="form-group">
                        <label>Year</label>
                        <input type="text" value={meta.year} disabled />
                    </div>
                    <div className="form-group">
                        <label>Basic Salary *</label>
                        <input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleChange} step="0.01" required />
                    </div>
                    <div className="form-group">
                        <label>Allowance</label>
                        <input type="number" name="allowance" value={formData.allowance} onChange={handleChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Overtime</label>
                        <input type="number" name="overtime" value={formData.overtime} onChange={handleChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Deduction</label>
                        <input type="number" name="deduction" value={formData.deduction} onChange={handleChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Tax</label>
                        <input type="number" name="tax" value={formData.tax} onChange={handleChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Net Salary</label>
                        <input type="number" name="net_salary" value={formData.net_salary} onChange={handleChange} step="0.01" />
                    </div>
                    <div className="form-group">
                        <label>Payment Date</label>
                        <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} />
                    </div>
                    <div className="form-actions full-width">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Update Payroll"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditPayroll;
