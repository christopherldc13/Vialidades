import { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Bell, X, Trash2, CheckCheck, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
    success: { Icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.13)',  border: 'rgba(16,185,129,0.25)' },
    error:   { Icon: XCircle,       color: '#ef4444', bg: 'rgba(239,68,68,0.13)',   border: 'rgba(239,68,68,0.25)'  },
    warning: { Icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.25)' },
    info:    { Icon: Info,           color: '#6366f1', bg: 'rgba(99,102,241,0.13)',  border: 'rgba(99,102,241,0.25)' },
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60)    return 'Ahora mismo';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }) + ' · ' +
           d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
};

const NotificationList = ({ className }) => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [panelStyle, setPanelStyle] = useState({});
    const { user } = useContext(AuthContext);
    const buttonRef = useRef(null);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleToggle = () => {
        if (!showDropdown && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPanelStyle({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right - rect.width / 2 + 10,
            });
        }
        setShowDropdown(v => !v);
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n => axios.patch(`/api/notifications/${n._id}/read`)));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) { console.error(err); }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Eliminar notificación',
            text: '¿Seguro que deseas eliminarla?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`/api/notifications/${id}`);
                    setNotifications(prev => prev.filter(n => n._id !== id));
                    toast.success('Notificación eliminada');
                } catch (err) {
                    toast.error('Error al eliminar');
                }
            }
        });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const panel = (
        <div ref={panelRef} className="notif-panel" style={panelStyle}>
            {/* ── Header ── */}
            <div className="notif-header">
                <div className="notif-header-left">
                    <Bell size={15} strokeWidth={2.2} color="var(--primary)" />
                    <span className="notif-title">Notificaciones</span>
                    {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount}</span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {unreadCount > 0 && (
                        <button className="notif-icon-btn" onClick={markAllRead} title="Marcar todas como leídas">
                            <CheckCheck size={14} />
                        </button>
                    )}
                    <button className="notif-icon-btn" onClick={() => setShowDropdown(false)}>
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="notif-body">
                {notifications.length === 0 ? (
                    <div className="notif-empty">
                        <Bell size={32} strokeWidth={1.5} color="var(--text-muted)" />
                        <p>Sin notificaciones</p>
                    </div>
                ) : (
                    notifications.map(n => {
                        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                        const { Icon } = cfg;
                        return (
                            <div
                                key={n._id}
                                className={`notif-item${n.read ? ' notif-item--read' : ' notif-item--unread'}`}
                                onClick={() => {
                                    if (!n.read) markAsRead(n._id);
                                    if (n.relatedReportId) {
                                        setShowDropdown(false);
                                        navigate(`/dashboard?reportId=${n.relatedReportId}`);
                                    }
                                }}
                            >
                                <div
                                    className="notif-type-icon"
                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                                >
                                    <Icon size={15} color={cfg.color} strokeWidth={2.2} />
                                </div>

                                <div className="notif-content">
                                    <p className="notif-msg">{n.message}</p>
                                    <span className="notif-time">{formatDate(n.createdAt)}</span>
                                </div>

                                <button
                                    className="notif-delete-btn"
                                    onClick={(e) => deleteNotification(e, n._id)}
                                    title="Eliminar"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <>
            <div ref={buttonRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}>
                <button
                    className={className}
                    style={{ position: 'relative', outline: 'none' }}
                    onClick={handleToggle}
                >
                    <Bell size={20} className={unreadCount > 0 ? 'bell-ringing' : ''} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: -2, right: -2,
                            background: 'var(--error)', color: 'white',
                            fontSize: '0.7rem', fontWeight: 'bold',
                            width: 16, height: 16, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
            {showDropdown && createPortal(panel, document.body)}
        </>
    );
};

export default NotificationList;
