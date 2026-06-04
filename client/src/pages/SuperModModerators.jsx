import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import CreateModeratorModal from '../components/CreateModeratorModal';
import { Users, Plus, ArrowLeft, Mail, Phone, ToggleLeft, ToggleRight, CheckCircle, XCircle, ClipboardList, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import './DashboardExtras.css';

/* ─── Modal de detalle del moderador ─── */
const ModDetailModal = ({ mod, onClose, onToggle, toggling }) => {
    if (!mod) return null;
    const isActive = mod.isActive !== false;

    return (
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ background: 'var(--surface-solid)', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}
            >
                {/* Avatar + nombre */}
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    {mod.avatar
                        ? <img src={mod.avatar} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '1.2rem', flexShrink: 0 }}>
                            {mod.firstName?.[0]}{mod.lastName?.[0]}
                          </div>
                    }
                    <div>
                        <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>{mod.firstName} {mod.lastName}</p>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.83rem' }}>@{mod.username}</p>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem',
                            padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                            background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: isActive ? '#10b981' : '#ef4444',
                            border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                            {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>

                {/* Info de contacto */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Mail size={15} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{mod.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Phone size={15} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{mod.phone || '—'}</span>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem', textAlign: 'center' }}>
                    {[
                        { icon: <CheckCircle size={16} color="#10b981" />, value: mod.stats?.aprobados ?? 0, label: 'Aprobados', color: '#10b981' },
                        { icon: <XCircle size={16} color="#ef4444" />, value: mod.stats?.rechazados ?? 0, label: 'Rechazados', color: '#ef4444' },
                        { icon: <AlertCircle size={16} color="#b91c1c" />, value: mod.stats?.sancionados ?? 0, label: 'Sancionados', color: '#b91c1c' },
                        { icon: <ClipboardList size={16} color="var(--primary)" />, value: mod.stats?.total ?? 0, label: 'Total', color: 'var(--primary)' },
                    ].map(({ icon, value, label, color }) => (
                        <div key={label} style={{ background: 'var(--bg-page)', borderRadius: '12px', padding: '0.75rem 0.25rem' }}>
                            <div style={{ marginBottom: '0.3rem' }}>{icon}</div>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color }}>{value}</p>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Acciones */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'row', gap: '0.65rem' }}>
                    <button
                        onClick={() => onToggle(mod)}
                        disabled={toggling}
                        style={{
                            background: isActive ? '#ef4444' : '#10b981',
                            border: 'none', color: '#fff',
                            borderRadius: '10px', padding: '0.6rem 1.4rem',
                            fontWeight: '700', fontSize: '0.875rem',
                            cursor: toggling ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            opacity: toggling ? 0.6 : 1,
                            boxShadow: isActive ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(16,185,129,0.3)',
                            fontFamily: 'inherit', width: '100%',
                        }}
                    >
                        {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {toggling ? 'Procesando...' : (isActive ? 'Desactivar moderador' : 'Activar moderador')}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: '1.5px solid var(--border-color)',
                            color: 'var(--text-muted)', borderRadius: '10px', padding: '0.6rem 1.4rem',
                            fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                            width: '100%', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Página principal ─── */
const SuperModModerators = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [selectedMod, setSelectedMod] = useState(null);

    const fetchMods = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/supermod/moderators');
            setModerators(res.data);
        } catch {
            toast.error('Error al cargar los moderadores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMods(); }, []);

    if (!user || !['admin', 'supermoderador'].includes(user.role)) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tienes permisos.</div>;
    }

    const handleToggle = async (mod) => {
        const action = mod.isActive === false ? 'activar' : 'desactivar';
        const isActivating = mod.isActive === false;
        const { isConfirmed } = await Swal.fire({
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} moderador?`,
            text: `${mod.firstName} ${mod.lastName} será ${isActivating ? 'activado' : 'desactivado'}.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: `Sí, ${action}`, cancelButtonText: 'Cancelar',
            buttonsStyling: false,
            reverseButtons: true,
            customClass: {
                confirmButton: isActivating ? 'swal2-lumina-confirm-green' : 'swal2-lumina-confirm',
                cancelButton: 'swal2-lumina-cancel',
                popup: 'swal2-lumina-popup',
                title: 'swal2-lumina-title',
                htmlContainer: 'swal2-lumina-html',
            },
        });
        if (!isConfirmed) return;
        setTogglingId(mod._id);
        try {
            const res = await axios.patch(`/api/supermod/moderators/${mod._id}/toggle`);
            const updated = { ...mod, isActive: res.data.isActive };
            setModerators(prev => prev.map(m => m._id === mod._id ? updated : m));
            setSelectedMod(updated);
            toast.success(res.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al cambiar estado');
        } finally {
            setTogglingId(null);
        }
    };

    const thStyle = { padding: '0.85rem 1rem', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '1rem', verticalAlign: 'middle' };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1500px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="dash-pad">

                {/* Back link */}
                <span
                    onClick={() => navigate('/supermoderador')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '1rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    <ArrowLeft size={14} strokeWidth={2.5} /> Volver al dashboard
                </span>

                {/* Header */}
                <div className="mod-header" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.71rem', fontWeight: '700', border: '1px solid rgba(99,102,241,0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'fit-content' }}>
                            <Users size={11} /> Gestión de moderadores
                        </span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            Moderadores registrados
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {loading ? 'Cargando...' : `${moderators.length} moderadores en el sistema · Vialidades de Tránsito`}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="mod-cta" style={{ border: 'none', cursor: 'pointer', background: 'var(--primary)' }}>
                        <Plus size={16} /> Nuevo Moderador
                    </button>
                </div>

                {/* Tabla */}
                <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando moderadores...</div>
                    ) : moderators.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p>No hay moderadores registrados aún.</p>
                            <button onClick={() => setShowModal(true)} className="mod-cta" style={{ border: 'none', cursor: 'pointer', background: 'var(--primary)', marginTop: '1rem' }}>
                                <Plus size={16} /> Crear el primero
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-input)' }}>
                                        <th style={{ ...thStyle }}>Moderador</th>
                                        <th style={{ ...thStyle }}>Contacto</th>
                                        <th style={{ ...thStyle }}>Aprobados</th>
                                        <th style={{ ...thStyle }}>Rechazados</th>
                                        <th style={{ ...thStyle }}>Sancionados</th>
                                        <th style={{ ...thStyle }}>Total</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moderators.map((mod, i) => {
                                        const isActive = mod.isActive !== false;
                                        return (
                                            <tr key={mod._id}
                                                onClick={() => setSelectedMod(mod)}
                                                style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ ...tdStyle }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        {mod.avatar
                                                            ? <img src={mod.avatar} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>{mod.firstName?.[0]}{mod.lastName?.[0]}</div>
                                                        }
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)' }}>{mod.firstName} {mod.lastName}</p>
                                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>@{mod.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ ...tdStyle }}>
                                                    <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.82rem' }}>{mod.email}</p>
                                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{mod.phone}</p>
                                                </td>
                                                <td style={{ ...tdStyle }}><span style={{ color: '#10b981', fontWeight: '700' }}>{mod.stats?.aprobados ?? 0}</span></td>
                                                <td style={{ ...tdStyle }}><span style={{ color: '#ef4444', fontWeight: '700' }}>{mod.stats?.rechazados ?? 0}</span></td>
                                                <td style={{ ...tdStyle }}><span style={{ color: '#b91c1c', fontWeight: '700' }}>{mod.stats?.sancionados ?? 0}</span></td>
                                                <td style={{ ...tdStyle }}><span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{mod.stats?.total ?? 0}</span></td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                        padding: '0.28rem 0.85rem', borderRadius: '999px',
                                                        fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
                                                        background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                        color: isActive ? '#10b981' : '#ef4444',
                                                        border: `1px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                                    }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                                                        {isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
            </div>

            {/* Modal detalle moderador */}
            <ModDetailModal
                mod={selectedMod}
                onClose={() => setSelectedMod(null)}
                onToggle={handleToggle}
                toggling={togglingId === selectedMod?._id}
            />

            <CreateModeratorModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); fetchMods(); }}
            />
        </div>
    );
};

export default SuperModModerators;
