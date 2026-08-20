import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function PayrollList() {
  const { user } = useAuth();
  const isEmployee = user?.role === "Employee";
  const canManage = ["Admin", "HR"].includes(user?.role);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [user?.employee_id]);

  async function load() {
    setLoading(true);
    try {
      if (isEmployee) {
        if (!user?.employee_id) {
          setRows([]);
          return;
        }
        const res = await api.get(`/payroll/employee/${user.employee_id}`);
        setRows(res.data);
      } else {
        const res = await api.get("/payroll");
        setRows(res.data);
      }
    } catch {
      toast.error("Failed to load payroll");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading payroll…</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">{isEmployee ? "My payslips" : "Compensation"}</p>
          <h1>Payroll ({rows.length})</h1>
        </div>
        {canManage && (
          <Link to="/payroll/create" className="btn-primary">Create payroll</Link>
        )}
      </div>

      <div className="table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {!isEmployee && <th>Employee</th>}
              <th>Period</th>
              <th>Basic</th>
              <th>Net</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan="6" className="empty-row">No payroll records</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.payroll_id}>
                  <td>{p.payroll_id}</td>
                  {!isEmployee && <td>{p.employee_name || p.employee_id}</td>}
                  <td>{p.month} {p.year}</td>
                  <td>{Number(p.basic_salary || 0).toLocaleString()}</td>
                  <td>{Number(p.net_salary || 0).toLocaleString()}</td>
                  <td>
                    <Link to={`/payroll/${p.payroll_id}`} className="btn-secondary">View</Link>
                    {canManage && (
                      <Link to={`/payroll/edit/${p.payroll_id}`} className="btn-edit">Edit</Link>
                    )}
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
