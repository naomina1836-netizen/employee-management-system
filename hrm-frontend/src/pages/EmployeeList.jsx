import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { useAuth } from "../context/AuthContext";

function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [searchVersion, setSearchVersion] = useState(0);
    const [filterVersion, setFilterVersion] = useState(0);
    const [page, setPage] = useState(1);
    const [pageInfo, setPageInfo] = useState(null);
    const { user } = useAuth();
    const canManageEmployees = ["Admin", "HR"].includes(user?.role);

    useEffect(() => {
        loadLookupData();
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [filters, page]);

    async function loadLookupData() {
        try {
            const [deptRes, posRes] = await Promise.all([
                api.get("/employees/departments"),
                api.get("/employees/positions")
            ]);

            setDepartments(deptRes.data);
            setPositions(posRes.data);
        } catch (error) {
            console.error("Error loading employee filters:", error);
            toast.error("Failed to load employee filters");
        }
    }

    async function loadEmployees() {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (filters.keyword) params.append("keyword", filters.keyword);
            if (filters.department) params.append("department", filters.department);
            if (filters.position) params.append("position", filters.position);
            if (filters.status) params.append("status", filters.status);

            const isSearching = [...params.keys()].length > 0;

            if (isSearching) {
                // Search returns a plain array; pagination controls are hidden.
                const response = await api.get(`/employees/search?${params.toString()}`);
                setEmployees(response.data);
                setPageInfo(null);
            } else {
                const response = await api.get(`/employees?page=${page}&limit=20`);
                setEmployees(response.data.data);
                setPageInfo(response.data.pagination);
            }
        } catch (error) {
            console.error("Error loading employees:", error);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (keyword) => {
        setPage(1);
        setFilters({ ...filters, keyword });
        setSearchVersion((value) => value + 1);
    };

    const handleFilterChange = (name, value) => {
        setPage(1);
        if (value) {
            setFilters({ ...filters, [name]: value });
        } else {
            const newFilters = { ...filters };
            delete newFilters[name];
            setFilters(newFilters);
        }
    };

    const clearFilters = () => {
        setPage(1);
        setFilters({});
        setSearchVersion((value) => value + 1);
        setFilterVersion((value) => value + 1);
    };

    const filterOptions = [
        {
            name: "department",
            label: "Department",
            type: "select",
            options: departments.map((dept) => ({
                value: String(dept.department_id),
                label: dept.department_name
            }))
        },
        {
            name: "position",
            label: "Position",
            type: "select",
            options: positions.map((position) => ({
                value: String(position.position_id),
                label: position.title
            }))
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "Active", label: "Active" },
                { value: "Resigned", label: "Resigned" },
                { value: "Terminated", label: "Terminated" }
            ]
        }
    ];

    if (loading) {
        return <div className="loading-container">Loading employees...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Employees ({pageInfo ? pageInfo.total : employees.length})</h1>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" className="btn-secondary" onClick={clearFilters}>
                        Clear Filters
                    </button>
                    {canManageEmployees && <Link to="/employees/create" className="btn-primary">
                        Add Employee
                    </Link>}
                </div>
            </div>

            <SearchBar
                key={searchVersion}
                onSearch={handleSearch}
                placeholder="Search by name, email, or phone..."
            />
            <FilterBar
                key={filterVersion}
                filters={filterOptions}
                onFilterChange={handleFilterChange}
            />

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-row">
                                    No employees found. {canManageEmployees && <Link to="/employees/create">Add the first employee</Link>}
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.employee_id}>
                                    <td>{emp.employee_id}</td>
                                    <td>{emp.first_name} {emp.last_name}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.department_name || '-'}</td>
                                    <td>{emp.position_title || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${emp.employment_status?.toLowerCase()}`}>
                                            {emp.employment_status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/employees/${emp.employee_id}`} className="btn-sm">View</Link>
                                        {canManageEmployees && <Link to={`/employees/edit/${emp.employee_id}`} className="btn-sm btn-edit">Edit</Link>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pageInfo && pageInfo.totalPages > 1 && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", marginTop: "16px" }}>
                    <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        Previous
                    </button>
                    <span>Page {pageInfo.page} of {pageInfo.totalPages}</span>
                    <button type="button" className="btn-secondary" disabled={page >= pageInfo.totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default EmployeeList;
