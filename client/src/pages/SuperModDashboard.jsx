import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import { Users, UserCheck, UserX, ClipboardList, CheckCircle, Clock, UserCircle, TrendingUp, Calendar, LifeBuoy, AlertTriangle, X, ArrowRight, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './DashboardExtras.css';

const socket = io(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : ''));

/* ─────────────────── StatCard ─────────────────── */
const StatCard = ({ icon, label, sublabel, value, color, bg, onClick, linkText }) => (
    <div
        onClick={onClick}
        style={{
            background: 'var(--surface-solid)',
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${color}`,
            borderRadius: '16px',
            padding: '1.25rem 1.4rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: '180px',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'box-shadow 0.2s, transform 0.2s',
            boxSizing: 'border-box',
        }}
        onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
            <div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>{label}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>{sublabel}</p>
            </div>
            <div style={{ background: bg, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color }}>{icon}</span>
            </div>
        </div>
        <p style={{ color, fontSize: '2.2rem', fontWeight: '900', margin: '0.2rem 0 0.8rem', lineHeight: 1 }}>
            {value ?? '—'}
        </p>
        {linkText && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', marginTop: 'auto' }}>
                <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {linkText} <span style={{ fontSize: '0.9rem' }}>→</span>
                </span>
            </div>
        )}
    </div>
);

/* ─────────────────── UrgentSupportBanner ─────────────────── */
const UrgentSupportBanner = ({ notifs, onNavigate, onNavigateToRequest, onDismiss, onDismissAll }) => {
    const typeLabel = t => t === 'familiar' ? 'Familiar · Ley 192-19' : 'No Autorizado · Ley 172-13';
    const timeAgo = d => {
        const s = Math.floor((Date.now() - new Date(d)) / 1000);
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s / 60)}min`;
        return `${Math.floor(s / 3600)}h`;
    };

    return (
        <AnimatePresence>
            {notifs.length > 0 && (
                <motion.div
                    key="urgent-banner"
                    initial={{ opacity: 0, y: -20, scaleY: 0.96 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -14, scaleY: 0.97 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                    style={{ marginBottom: '1.75rem', transformOrigin: 'top center' }}
                >
                    <style>{`
                        @keyframes urgGlow {
                            0%,100% { box-shadow: 0 2px 20px rgba(153,27,27,0.5); }
                            55%     { box-shadow: 0 2px 36px rgba(153,27,27,0.85), 0 0 0 4px rgba(153,27,27,0.25); }
                        }
                        @keyframes urgDot {
                            0%,100% { transform:scale(1); opacity:1; }
                            50%     { transform:scale(1.8); opacity:0.25; }
                        }
                    `}</style>

                    {/* ── Outer card ── */}
                    <div style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.14)',
                        animation: 'urgGlow 2.4s ease-in-out infinite',
                    }}>
                        {/* Top gradient stripe */}
                        <div style={{ height: '3px', background: 'linear-gradient(90deg,#fca5a5,#ef4444 30%,#dc2626 70%,#fca5a5)' }} />

                        {/* Body */}
                        <div style={{
                            background: 'linear-gradient(145deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)',
                            padding: '1.1rem 1.35rem 1.25rem',
                        }}>

                            {/* ── Top row: URGENTE badge + dismiss ── */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                    {/* Pulsing dot */}
                                    <span style={{ position: 'relative', display: 'inline-flex', width: '10px', height: '10px', flexShrink: 0 }}>
                                        <span style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'urgDot 1.3s ease-in-out infinite' }} />
                                        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ffffff' }} />
                                    </span>
                                    <span style={{
                                        background: 'rgba(0,0,0,0.35)',
                                        color: '#ffffff',
                                        fontSize: '0.6rem',
                                        fontWeight: '800',
                                        letterSpacing: '0.14em',
                                        textTransform: 'uppercase',
                                        padding: '0.18rem 0.55rem',
                                        borderRadius: '5px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        lineHeight: '1.4',
                                    }}>URGENTE</span>
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                        Soporte Legal
                                    </span>
                                </div>
                                <button
                                    onClick={onDismissAll}
                                    style={{
                                        background: 'rgba(0,0,0,0.22)',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        borderRadius: '7px',
                                        color: 'rgba(255,255,255,0.75)',
                                        fontSize: '0.73rem',
                                        fontWeight: '600',
                                        padding: '0.3rem 0.7rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.32rem',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        width: 'fit-content',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.22)'}
                                >
                                    <X size={12} /> Descartar todo
                                </button>
                            </div>

                            {/* ── Big title (standalone block, never flex child) ── */}
                            <p style={{
                                color: '#ffffff',
                                fontWeight: '800',
                                fontSize: '1.25rem',
                                lineHeight: 1.2,
                                margin: '0 0 1rem 0',
                                letterSpacing: '-0.01em',
                            }}>
                                {notifs.length} solicitud{notifs.length !== 1 ? 'es' : ''} de soporte sin atender
                            </p>

                            {/* ── Notification rows ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                                <AnimatePresence>
                                    {notifs.slice(0, 4).map((n, i) => (
                                        <motion.div
                                            key={n._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                            transition={{ delay: i * 0.05, duration: 0.2 }}
                                            onClick={() => onNavigateToRequest(n)}
                                            whileHover={{ background: 'rgba(0,0,0,0.35)' }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '0.5rem',
                                                background: 'rgba(0,0,0,0.22)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                padding: '0.55rem 0.85rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {/* LEFT: case + type + optional requester */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
                                                <code style={{
                                                    flexShrink: 0,
                                                    background: 'rgba(0,0,0,0.35)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    borderRadius: '6px',
                                                    padding: '0.12rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    color: '#fecaca',
                                                    fontFamily: 'monospace',
                                                    letterSpacing: '0.03em',
                                                }}>
                                                    {n.metadata?.caseNumber || '—'}
                                                </code>
                                                <span style={{ flexShrink: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                    {typeLabel(n.metadata?.type)}
                                                </span>
                                                {n.metadata?.requesterName && <>
                                                    <span style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)' }}>·</span>
                                                    <span style={{ minWidth: 0, color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {n.metadata.requesterName}
                                                    </span>
                                                </>}
                                            </div>

                                            {/* RIGHT: time + dismiss */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                                    {timeAgo(n.createdAt)}
                                                </span>
                                                <button
                                                    onClick={e => { e.stopPropagation(); onDismiss(n._id); }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        margin: 0,
                                                        padding: 0,
                                                        width: '20px',
                                                        height: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'rgba(255,255,255,0.35)',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        flexShrink: 0,
                                                        transition: 'color 0.12s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {notifs.length > 4 && (
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', paddingLeft: '0.35rem' }}>
                                        +{notifs.length - 4} más...
                                    </span>
                                )}
                            </div>

                            {/* ── CTA button ── */}
                            <button
                                onClick={onNavigate}
                                style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    color: '#7f1d1d',
                                    fontWeight: '800',
                                    fontSize: '0.88rem',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '0.68rem 1.25rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    letterSpacing: '-0.01em',
                                    transition: 'opacity 0.15s, transform 0.12s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <LifeBuoy size={17} />
                                Revisar solicitudes ahora
                                <ArrowRight size={16} />
                            </button>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ─────────────────── SuperModDashboard ─────────────────── */
const SuperModDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [urgentNotifs, setUrgentNotifs] = useState([]);

    const fetchStats = useCallback(() => {
        axios.get('/api/supermod/stats')
            .then(res => setStats(res.data))
            .catch(() => toast.error('Error al cargar estadísticas'))
            .finally(() => setLoading(false));
    }, []);

    const fetchUrgentNotifs = useCallback(() => {
        axios.get('/api/notifications')
            .then(res => {
                const urgent = res.data.filter(
                    n => n.category === 'support_request' && !n.read && !n.deleted
                );
                setUrgentNotifs(urgent);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchStats();
        fetchUrgentNotifs();

        socket.emit('join_supermod');

        const handleNewRequest = () => {
            fetchUrgentNotifs();
            fetchStats();
            toast('🚨 Nueva solicitud de soporte recibida', {
                duration: 6000,
                style: {
                    background: '#7f1d1d',
                    color: 'white',
                    fontWeight: '700',
                    border: '1px solid #ef4444',
                },
            });
        };

        socket.on('new_support_request', handleNewRequest);
        return () => socket.off('new_support_request', handleNewRequest);
    }, [fetchStats, fetchUrgentNotifs]);

    const handleDismiss = useCallback(async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setUrgentNotifs(prev => prev.filter(n => n._id !== id));
        } catch (_) {}
    }, []);

    const handleDismissAll = useCallback(async () => {
        try {
            const ids = urgentNotifs.map(n => n._id);
            await Promise.all(ids.map(id => axios.patch(`/api/notifications/${id}/read`)));
            setUrgentNotifs([]);
        } catch (_) {}
    }, [urgentNotifs]);

    const handleNavigateToSupport = useCallback(() => {
        navigate('/supermoderador/soporte');
    }, [navigate]);

    const handleNavigateToRequest = useCallback(async (notif) => {
        try {
            await axios.patch(`/api/notifications/${notif._id}/read`);
            setUrgentNotifs(prev => prev.filter(n => n._id !== notif._id));
        } catch (_) {}
        navigate('/supermoderador/soporte', { state: { openCase: notif.metadata?.caseNumber } });
    }, [navigate]);

    if (!user || !['admin', 'supermoderador'].includes(user.role)) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tienes permisos.</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1500px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="dash-pad">

                {/* Banner urgente */}
                <UrgentSupportBanner
                    notifs={urgentNotifs}
                    onNavigate={handleNavigateToSupport}
                    onNavigateToRequest={handleNavigateToRequest}
                    onDismiss={handleDismiss}
                    onDismissAll={handleDismissAll}
                />

                {/* Banner de bienvenida */}
                <div className="mod-header" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.71rem', fontWeight: '700', border: '1px solid rgba(99,102,241,0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', boxShadow: '0 0 6px var(--primary)' }} />
                                Super Moderador
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            Bienvenido, <span style={{ color: 'var(--primary)' }}>{user?.firstName}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                            Panel de Supermoderadores · Vialidades de Tránsito
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link to="/supermoderador/moderadores" className="mod-cta">
                            <Users size={17} /> Ver Moderadores
                        </Link>
                        <Link to="/supermoderador/soporte" className="mod-cta" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', position: 'relative' }}>
                            <LifeBuoy size={17} /> Solicitudes de Soporte
                            {urgentNotifs.length > 0 && (
                                <span style={{ background: '#dc2626', color: 'white', borderRadius: '99px', padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: '800', marginLeft: '0.25rem' }}>
                                    {urgentNotifs.length}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Stats — Moderadores */}
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Moderadores</p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <StatCard icon={<Users size={20} />} label="Total Moderadores" sublabel="Registrados en el sistema" value={loading ? '...' : stats?.total} color="#6366f1" bg="rgba(99,102,241,0.10)" onClick={() => navigate('/supermoderador/moderadores')} linkText="Ver moderadores" />
                    <StatCard icon={<UserCheck size={20} />} label="Activos" sublabel="Con acceso habilitado" value={loading ? '...' : stats?.activos} color="#6366f1" bg="rgba(99,102,241,0.10)" onClick={() => navigate('/supermoderador/moderadores?status=activo')} linkText="Ver moderadores" />
                    <StatCard icon={<UserX size={20} />} label="Inactivos" sublabel="Con acceso deshabilitado" value={loading ? '...' : stats?.inactivos} color="#ef4444" bg="rgba(239,68,68,0.10)" onClick={() => navigate('/supermoderador/moderadores?status=inactivo')} linkText="Ver moderadores" />
                    <StatCard icon={<ClipboardList size={20} />} label="Reportes Moderados" sublabel="Total procesados" value={loading ? '...' : stats?.reportesTotal} color="#6366f1" bg="rgba(99,102,241,0.10)" />
                </div>

                {/* Stats — Sistema */}
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Sistema</p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <StatCard icon={<CheckCircle size={20} />} label="Reportes Publicados" sublabel="Aprobados en total" value={loading ? '...' : stats?.reportesPublicados} color="#6366f1" bg="rgba(99,102,241,0.10)" onClick={() => navigate('/supermoderador/reportes')} linkText="Ver todos los reportes" />
                    <StatCard icon={<Clock size={20} />} label="Pendientes" sublabel="Esperando revisión" value={loading ? '...' : stats?.reportesPendientes} color="#f59e0b" bg="rgba(245,158,11,0.10)" />
                    <StatCard icon={<UserCircle size={20} />} label="Usuarios Registrados" sublabel="Cuentas activas" value={loading ? '...' : stats?.totalUsuarios} color="#6366f1" bg="rgba(99,102,241,0.10)" />
                    <StatCard icon={<Calendar size={20} />} label="Reportes Hoy" sublabel="Creados hoy" value={loading ? '...' : stats?.reportesHoy} color="#6366f1" bg="rgba(99,102,241,0.10)" />
                    <StatCard icon={<TrendingUp size={20} />} label="Última semana" sublabel="Reportes 7 días" value={loading ? '...' : stats?.reportesSemana} color="#6366f1" bg="rgba(99,102,241,0.10)" />
                </div>

                {/* Stats — Soporte */}
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Soporte Legal</p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <StatCard icon={<LifeBuoy size={20} />} label="Solicitudes Pendientes" sublabel="Requieren revisión" value={loading ? '...' : stats?.supportPending} color="#dc2626" bg="rgba(220,38,38,0.10)" onClick={() => navigate('/supermoderador/soporte')} linkText="Ver solicitudes" />
                </div>

                {/* Actividad por moderador */}
                {!loading && stats?.moderadoresStats?.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Actividad por Moderador</p>
                        <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                                        {['Moderador', 'Aprobados', 'Rechazados', 'Sancionados', 'Total'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 1.1rem', textAlign: h === 'Moderador' ? 'left' : 'center', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.moderadoresStats.map((m, i) => (
                                        <tr key={m._id} style={{ borderBottom: i < stats.moderadoresStats.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '0.85rem 1.1rem' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{m.nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{m.username}</div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: '600' }}>{m.aprobados}</td>
                                            <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: '600' }}>{m.rechazados}</td>
                                            <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: '600' }}>{m.sancionados}</td>
                                            <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center' }}>
                                                <span style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: '700', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.82rem' }}>{m.total}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
            </div>
        </div>
    );
};

export default SuperModDashboard;
