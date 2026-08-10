import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function AttendanceSelf() {
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadTodayAttendance();
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    async function loadTodayAttendance() {
        try {
            const response = await api.get("/attendance/today");
            setTodayAttendance(response.data);
        } catch (error) {
            console.error("Error loading today's attendance:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckIn() {
        try {
            await api.post("/attendance/self/check-in");
            toast.success("Checked in successfully!");
            loadTodayAttendance();
        } catch (error) {
            console.error("Error checking in:", error);
            toast.error(error.response?.data?.message || "Failed to check in");
        }
    }

    async function handleCheckOut() {
        try {
            await api.post("/attendance/self/check-out");
            toast.success("Checked out successfully!");
            loadTodayAttendance();
        } catch (error) {
            console.error("Error checking out:", error);
            toast.error(error.response?.data?.message || "Failed to check out");
        }
    }

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    const formattedTime = currentTime.toLocaleTimeString();

    return (
        <div className="page-container">
            <h1>Attendance</h1>
            
            <div className="attendance-self-container">
                <div className="attendance-clock">
                    <h2>{formattedTime}</h2>
                    <p>{currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>

                <div className="attendance-status">
                    {todayAttendance ? (
                        <div className="attendance-info">
                            <p>Check In: {todayAttendance.check_in || 'Not yet'}</p>
                            <p>Check Out: {todayAttendance.check_out || 'Not yet'}</p>
                            <p>Status: <span className={`status-badge ${todayAttendance.status?.toLowerCase()}`}>
                                {todayAttendance.status || 'Present'}
                            </span></p>
                        </div>
                    ) : (
                        <p>No attendance record for today</p>
                    )}
                </div>

                <div className="attendance-actions">
                    {!todayAttendance?.check_in && (
                        <button onClick={handleCheckIn} className="btn-primary">
                            Check In
                        </button>
                    )}
                    {todayAttendance?.check_in && !todayAttendance?.check_out && (
                        <button onClick={handleCheckOut} className="btn-secondary">
                            Check Out
                        </button>
                    )}
                    {todayAttendance?.check_in && todayAttendance?.check_out && (
                        <p className="completed-message">Attendance completed for today</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AttendanceSelf;