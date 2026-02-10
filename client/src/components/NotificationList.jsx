import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Bell, X, Trash2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const NotificationList = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user } = useContext(AuthContext);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll every 30 seconds for new notifications
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta notificación?')) return;

        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <Bell size={24} color="var(--text-main)" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -2,
                        background: 'var(--error)', color: 'white',
                        fontSize: '0.7rem', fontWeight: 'bold',
                        width: 16, height: 16, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </div>

            {showDropdown && (
                <div style={{
                    position: 'absolute', top: '100%', right: -10,
                    width: '320px', maxHeight: '400px', overflowY: 'auto',
                    background: 'white', /* Force white background */
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px', border: '1px solid #e2e8f0',
                    zIndex: 1000, marginTop: '10px'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>Notificaciones</h4>
                        <X size={16} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowDropdown(false)} />
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                            No tienes notificaciones
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification._id}
                                onClick={() => !notification.read && markAsRead(notification._id)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid #f1f5f9',
                                    background: notification.read ? 'white' : '#f0f9ff', /* Light blue for unread */
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    display: 'flex', gap: '0.75rem', alignItems: 'start',
                                    opacity: 1 /* Ensure no transparency */
                                }}
                            >
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                                    background: notification.type === 'success' ? 'var(--success)' : notification.type === 'error' ? 'var(--error)' : notification.type === 'warning' ? 'var(--warning)' : 'var(--primary)',
                                    display: notification.read ? 'none' : 'block'
                                }} />
                                <div>
                                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.4', fontWeight: notification.read ? '400' : '600' }}>
                                        {notification.message}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <Trash2
                                    size={16}
                                    color="#ef4444"
                                    style={{ marginLeft: 'auto', cursor: 'pointer', flexShrink: 0 }}
                                    onClick={(e) => deleteNotification(e, notification._id)}
                                />
                            </div>
                        ))
                    )}
                </div>
            )
            }
        </div >
    );
};

export default NotificationList;
