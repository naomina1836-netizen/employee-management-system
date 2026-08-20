import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function CreateLeave() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.role === "Employee";
  const canPickEmployee = ["Admin", "HR", "Manager"].includes(user?.role);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: user?.employee_id ? String(user.employee_id) : "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: ""
  });
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(days > 0 ? days : 0);
    } else setTotalDays(0);
  }, [formData.start_date, formData.end_date]);

  async function loadDropdownData() {
    try {
      const typeRes = await api.get("/leaves/types");
      setLeaveTypes(typeRes.data);
      if (canPickEmployee) {
        const empRes = await api.get("/employees");
        setEmployees(empRes.data);
      }
    } catch {
      toast.error("Failed to load form data");
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (isEmployee) {
        if (!user.employee_id) {
          toast.error("Your account is not linked to an employee profile");
          setLoading(false);
          return;
        }
        payload.employee_id = user.employee_id;
      }
      await api.post("/leaves", payload);
      toast.success("Leave request submitted");
      navigate("/leaves");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Time off</p>
          <h1>Request leave</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate("/leaves")}>Back</button>
      </div>

      <div className="form-container glass-panel">
        <form onSubmit={handleSubmit} className="form-grid">
          {canPickEmployee ? (
            <div className="form-group">
              <label>Employee *</label>
              <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Employee</label>
              <input type="text" value="You (self)" disabled />
            </div>
          )}

          <div className="form-group">
            <label>Leave type *</label>
            <select name="leave_type_id" value={formData.leave_type_id} onChange={handleChange} required>
              <option value="">Select type</option>
              {leaveTypes.map((type) => (
                <option key={type.leave_type_id} value={type.leave_type_id}>
                  {type.leave_name} (max {type.max_days} days)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start date *</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>End date *</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Total days</label>
            <input type="text" value={totalDays} disabled />
          </div>
          <div className="form-group full-width">
            <label>Reason</label>
            <textarea name="reason" value={formData.reason} onChange={handleChange} rows="4" placeholder="Optional reason…" />
          </div>
          <div className="form-actions full-width">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateLeave;
