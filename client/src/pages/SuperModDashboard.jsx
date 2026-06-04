import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import { Users, UserCheck, UserX, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import './DashboardExtras.css';

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

const SuperModDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/supermod/stats')
            .then(res => setStats(res.data))
            .catch(() => toast.error('Error al cargar estadísticas'))
            .finally(() => setLoading(false));
    }, []);

    if (!user || !['admin', 'supermoderador'].includes(user.role)) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tienes permisos.</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1500px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="dash-pad">

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
                    <Link to="/supermoderador/moderadores" className="mod-cta">
                        <Users size={17} /> Ver Moderadores
                    </Link>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <StatCard
                        icon={<Users size={20} />}
                        label="Total Moderadores"
                        sublabel="Registrados en el sistema"
                        value={loading ? '...' : stats?.total}
                        color="#6366f1"
                        bg="rgba(99,102,241,0.12)"
                        onClick={() => navigate('/supermoderador/moderadores')}
                        linkText="Ver moderadores"
                    />
                    <StatCard
                        icon={<UserCheck size={20} />}
                        label="Activos"
                        sublabel="Con acceso habilitado"
                        value={loading ? '...' : stats?.activos}
                        color="#10b981"
                        bg="rgba(16,185,129,0.12)"
                        onClick={() => navigate('/supermoderador/moderadores')}
                        linkText="Ver moderadores"
                    />
                    <StatCard
                        icon={<UserX size={20} />}
                        label="Inactivos"
                        sublabel="Con acceso deshabilitado"
                        value={loading ? '...' : stats?.inactivos}
                        color="#ef4444"
                        bg="rgba(239,68,68,0.12)"
                        onClick={() => navigate('/supermoderador/moderadores')}
                        linkText="Ver moderadores"
                    />
                    <StatCard
                        icon={<ClipboardList size={20} />}
                        label="Reportes Moderados"
                        sublabel="Total procesados"
                        value={loading ? '...' : stats?.reportesTotal}
                        color="#f59e0b"
                        bg="rgba(245,158,11,0.12)"
                    />
                </div>

            </div>
            </div>
        </div>
    );
};

export default SuperModDashboard;
