import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        try {
            const response = await api.get("/notifications");
            setNotifications(response.data);
        } catch (error) {
            console.error("Error loading notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(id) {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => 
                n.notification_id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }

    async function markAllAsRead() {
        try {
            await api.patch("/notifications/read-all");
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    }

    if (loading) {
        return <div className="loading-container">Loading notifications...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Notifications</h1>
                {notifications.some(n => !n.is_read) && (
                    <button onClick={markAllAsRead} className="btn-secondary">
                        Mark All as Read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="empty-state">
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notif) => (
                        <div 
                            key={notif.notification_id} 
                            className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                            onClick={() => markAsRead(notif.notification_id)}
                        >
                            <div className="notification-icon">
                                {notif.type === 'application' && '📋'}
                                {notif.type === 'interview' && '🎯'}
                                {notif.type === 'offer' && '💼'}
                                {notif.type === 'message' && '💬'}
                                {!notif.type && '🔔'}
                            </div>
                            <div className="notification-content">
                                <h4>{notif.title}</h4>
                                <p>{notif.message}</p>
                                <small>{new Date(notif.created_at).toLocaleString()}</small>
                            </div>
                            {!notif.is_read && <span className="unread-dot">●</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Notifications;