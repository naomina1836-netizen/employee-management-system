import { Routes, Route, Link } from "react-router-dom";

function App() {
    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        }}>
            <header style={{
                background: '#1a1a2e',
                color: '#d4af37',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px'
            }}>
                <h1 style={{ margin: 0 }}>HRM - Human Resource Management</h1>
                <p style={{ color: '#ccc', margin: '5px 0 0 0' }}>Employee Management System</p>
            </header>

            <nav style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '30px',
                background: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px'
            }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Home</Link>
                <Link to="/employees" style={{ textDecoration: 'none', color: '#333' }}>Employees</Link>
                <Link to="/leaves" style={{ textDecoration: 'none', color: '#333' }}>Leave Requests</Link>
                <Link to="/attendance" style={{ textDecoration: 'none', color: '#333' }}>Attendance</Link>
                <Link to="/payroll" style={{ textDecoration: 'none', color: '#333' }}>Payroll</Link>
                <Link to="/performance" style={{ textDecoration: 'none', color: '#333' }}>Performance</Link>
            </nav>

            <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h2>Welcome to HRM System</h2>
                <p style={{ color: '#666' }}>Frontend is running successfully!</p>
                <p style={{ color: '#999', fontSize: '14px' }}>
                    Backend API: <a href="http://localhost:5001" style={{ color: '#d4af37' }}>http://localhost:5001</a>
                </p>
            </div>
        </div>
    );
}

export default App;