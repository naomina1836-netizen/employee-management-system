import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";

function formatMoney(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return "0.00";
    return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PayrollDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const confirm = useConfirm();
    const canEdit = ["Admin", "HR"].includes(user?.role);
    const canDelete = user?.role === "Admin";
    const [payroll, setPayroll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadPayroll();
    }, [id]);

    async function loadPayroll() {
        setLoading(true);
        try {
            const response = await api.get(`/payroll/${id}`);
            setPayroll(response.data);
        } catch (error) {
            console.error("Error loading payroll:", error);
            toast.error(error.response?.data?.message || "Failed to load payroll record");
            navigate("/payroll");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        const confirmed = await confirm({
            title: "Delete payroll record",
            message: "Delete this payroll record?",
            confirmText: "Delete"
        });
        if (!confirmed) return;

        setDeleting(true);
        try {
            await api.delete(`/payroll/${id}`);
            navigate("/payroll");
        } catch (error) {
            console.error("Error deleting payroll:", error);
            toast.error(error.response?.data?.message || "Failed to delete payroll record");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading payroll details...</div>;
    }

    if (!payroll) {
        return <div className="empty-state">Payroll record not found</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Payroll #{payroll.payroll_id}</h1>
                    <p>{payroll.employee_name}</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {canEdit && <Link to={`/payroll/edit/${payroll.payroll_id}`} className="btn-primary">
                        Edit Payroll
                    </Link>}
                    <button className="btn-secondary" onClick={() => navigate("/payroll")}>
                        Back to List
                    </button>
                    {canDelete && <button className="btn-secondary" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                    </button>}
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-field">
                        <label>Employee</label>
                        <p>{payroll.employee_name}</p>
                    </div>
                    <div className="profile-field">
                        <label>Position</label>
                        <p>{payroll.position_title || "-"}</p>
                    </div>
                    <div className="profile-field">
                        <label>Month</label>
                        <p>{payroll.month}</p>
                    </div>
                    <div className="profile-field">
                        <label>Year</label>
                        <p>{payroll.year}</p>
                    </div>
                    <div className="profile-field">
                        <label>Basic Salary</label>
                        <p>ETB {formatMoney(payroll.basic_salary)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Allowance</label>
                        <p>ETB {formatMoney(payroll.allowance)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Overtime</label>
                        <p>ETB {formatMoney(payroll.overtime)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Deduction</label>
                        <p>ETB {formatMoney(payroll.deduction)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Tax</label>
                        <p>ETB {formatMoney(payroll.tax)}</p>
                    </div>
                    <div className="profile-field">
                        <label>Net Salary</label>
                        <p><strong>ETB {formatMoney(payroll.net_salary)}</strong></p>
                    </div>
                    <div className="profile-field">
                        <label>Payment Date</label>
                        <p>{payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString() : "-"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PayrollDetails;
