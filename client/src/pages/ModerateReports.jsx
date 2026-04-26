import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Check, X, AlertTriangle, Info, Users, CheckCircle, Inbox } from 'lucide-react';
import { AiOutlineHistory } from "react-icons/ai";
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReportDetailModal from '../components/ReportDetailModal';
import UserDetailModal from '../components/UserDetailModal';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

const getIncidentLabel = (type) => {
    switch (type) {
        case 'Traffic': return 'Tráfico Pesado';
        case 'Accident': return 'Accidente';
        case 'Violation': return 'Infracción';
        case 'Hazard': return 'Peligro en la vía';
        default: return type;
    }
};

const getRoleLabel = (role) => {
    switch (role) {
        case 'admin': return 'ADMINISTRADOR';
        case 'moderator': return 'MODERADOR';
        case 'user': return 'USUARIO';
        default: return role?.toUpperCase();
    }
};

const DR_PROVINCES = [
    'Azua','Bahoruco','Barahona','Dajabón','Distrito Nacional','Duarte',
    'El Seibo','Elías Piña','Espaillat','Hato Mayor','Hermanas Mirabal',
    'Independencia','La Altagracia','La Romana','La Vega',
    'María Trinidad Sánchez','Monseñor Nouel','Monte Cristi','Monte Plata',
    'Pedernales','Peravia','Puerto Plata','Samaná','San Cristóbal',
    'San José de Ocoa','San Juan','San Pedro de Macorís','Sánchez Ramírez',
    'Santiago','Santiago Rodríguez','Santo Domingo','Valverde',
];

const SELECT_STYLE = {
    padding: '0.5rem 0.9rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--surface-solid)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '160px',
};

const ModerateReports = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialFilter = searchParams.get('filter') || 'pending';

    const [reports, setReports] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [filter, setFilter] = useState(initialFilter); // pending, approved, rejected, sanctioned, all, users
    const [typeFilter, setTypeFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        socket.emit('join_moderation');

        socket.on('report_status_updated', ({ reportId, status, moderatorName }) => {
            setReports(prev => prev.map(r =>
                r._id === reportId ? { ...r, status, moderatorInChargeName: moderatorName } : r
            ));
        });

        return () => {
            socket.off('report_status_updated');
        };
    }, []);

    const handleOpenDetails = async (report) => {
        if (report.status === 'pending' || report.status === 'In Process') {
            try {
                const res = await axios.put(`/api/reports/${report._id}/lock`);
                setSelectedReport(res.data);
                setIsModalOpen(true);
                // Notificar al socket para autolimpieza en desconexión
                socket.emit('lock_report', report._id);
            } catch (err) {
                if (err.response?.status === 409) {
                    toast.error(err.response.data.msg || "Este reporte ya está siendo revisado.");
                } else {
                    console.error("Error locking report:", err);
                }
            }
        } else {
            setSelectedReport(report);
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                if (filter === 'users') {
                    const res = await axios.get('/api/users');
                    setUsersList(res.data);
                } else {
                    const res = await axios.get(`/api/reports?status=${filter}`);
                    setReports(res.data);
                }
            } catch (err) {
                console.error("Error fetching reports/users:", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchReports();
    }, [user, filter]);

    const handleCloseDetails = async () => {
        if (selectedReport && selectedReport.status === 'In Process' && selectedReport.moderatorInCharge === user?.id) {
            try {
                await axios.put(`/api/reports/${selectedReport._id}/unlock`);
                // Limpiar el registro del socket
                socket.emit('unlock_report');
            } catch (err) {
                console.error("Error unlocking report:", err);
            }
        }
        setIsModalOpen(false);
        setSelectedReport(null);
    };

    // Page-level cleanup: unlock if navigating away
    useEffect(() => {
        return () => {
            // This is tricky because we don't have the latest selectedReport here easily without refs
            // But the socket disconnect on server handles actual navigation away/tab close.
        };
    }, []);

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) return avatarPath;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
    };



    const handleModerate = async (id, status, sanctionUser = false, rejectionReason = '') => {
        try {
            await axios.patch(`/api/reports/${id}/moderate`, {
                status,
                sanctionUser,
                rejectionReason
            });

            // If we are in 'pending' view, remove the item. 
            // If in history/all, update the item's status locally.
            if (filter === 'pending') {
                setReports(prev => prev.filter(r => r._id !== id));
            } else {
                setReports(prev => prev.map(r => r._id === id ? { ...r, status, wasSanctioned: sanctionUser, rejectionReason } : r));
            }

            // Liberar el bloqueo en el socket (moderación completada)
            socket.emit('unlock_report');

            setSelectedReport(null);
            setIsModalOpen(false);

            if (sanctionUser) toast.success("Usuario sancionado correctamente.");
            else toast.success("Reporte moderado correctamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar la solicitud.");
        }
    };

    useEffect(() => { setTypeFilter('all'); setProvinceFilter('all'); }, [filter]);

    const filteredReports = filter === 'users'
        ? reports
        : reports.filter(r => {
            if (typeFilter !== 'all' && r.type !== typeFilter) return false;
            if (provinceFilter !== 'all') {
                const addr = (r.location?.address || '').toLowerCase();
                if (!addr.includes(provinceFilter.toLowerCase())) return false;
            }
            return true;
        });

    if (user && !['admin', 'moderator'].includes(user.role)) {
        return <div className="container" style={{ padding: '2rem' }}>No tienes permisos.</div>;
    }

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1500px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>


                <div className="dashboard-header modern-dashboard-header" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem', borderRadius: '10px' }}>
                                <ArrowLeft size={18} />
                            </Link>
                            <h1 style={{ fontWeight: '800', color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>
                                Panel de Moderación
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
                            Gestiona y revisa los reportes de incidentes o usuarios.
                        </p>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%', paddingBottom: '4px' }}>
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={(e, newFilter) => {
                                if (newFilter) {
                                    setFilter(newFilter);
                                    setSearchParams({ filter: newFilter });
                                }
                            }}
                            aria-label="filter toggle"
                            className="toggle-group"
                            style={{
                                display: 'inline-flex',
                                background: 'var(--bg-page)',
                                padding: '0.4rem',
                                borderRadius: '20px',
                                gap: '0.3rem',
                                border: '1px solid var(--border-color)',
                                minWidth: 'min-content'
                            }}
                        >
                            {[
                                { id: 'pending', label: 'Pendientes', icon: AlertTriangle, color: 'var(--warning)' },
                                { id: 'approved', label: 'Aprobados', icon: Check, color: 'var(--success)' },
                                { id: 'rejected', label: 'Rechazados', icon: X, color: 'var(--error)' },
                                { id: 'sanctioned', label: 'Sancionados', icon: AlertTriangle, color: '#b91c1c' },
                                { id: 'all', label: 'Historial', icon: AiOutlineHistory, color: '#64748b' },
                                { id: 'users', label: 'Usuarios', icon: Users, color: '#3b82f6' }
                            ].map(tab => (
                                <ToggleButton
                                    key={tab.id}
                                    value={tab.id}
                                    style={{
                                        border: 'none',
                                        borderRadius: '16px',
                                        padding: '0.8rem 1.6rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        fontWeight: filter === tab.id ? '800' : '600',
                                        color: filter === tab.id ? 'var(--primary)' : 'var(--text-light)',
                                        background: filter === tab.id ? 'var(--surface-solid)' : 'transparent',
                                        textTransform: 'none',
                                        fontSize: '0.95rem',
                                        whiteSpace: 'nowrap',
                                        boxShadow: filter === tab.id ? '0 8px 16px -4px rgba(99, 102, 241, 0.2)' : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {tab.icon && <tab.icon size={18} color={filter === tab.id ? 'var(--primary)' : tab.color} />}
                                    {tab.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </div>
                </div>

                {/* Type + Province filter bar — hidden on users tab */}
                {filter !== 'users' && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={SELECT_STYLE}>
                            <option value="all">Todos los tipos</option>
                            <option value="Traffic">Tráfico</option>
                            <option value="Accident">Accidente</option>
                            <option value="Violation">Infracción</option>
                            <option value="Hazard">Peligro</option>
                        </select>
                        <select value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)} style={SELECT_STYLE}>
                            <option value="all">Todas las provincias</option>
                            {DR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
                ) : filter === 'users' ? (
                    usersList.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--surface-solid)', borderRadius: '20px', marginTop: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                            <h3 style={{ color: 'var(--text-main)' }}>No hay usuarios registrados</h3>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                            {usersList.map((usr) => (
                                <div key={usr._id} style={{
                                    display: 'flex', flexDirection: 'column',
                                    background: 'var(--surface-solid)', borderRadius: '20px',
                                    border: '1px solid var(--border-light)',
                                    padding: '1.25rem',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                    onClick={() => {
                                        setSelectedUser(usr);
                                        setIsUserModalOpen(true);
                                    }}
                                    className="moderation-card premium-user-card"
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                        {usr.avatar ? (
                                            <img
                                                src={getAvatarUrl(usr.avatar)}
                                                alt="Avatar"
                                                style={{
                                                    width: '48px', height: '48px', borderRadius: '14px',
                                                    objectFit: 'cover',
                                                    boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
                                                    flexShrink: 0,
                                                    transform: 'rotate(-3deg)',
                                                    border: '2px solid var(--surface-solid)'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '14px',
                                                background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif',
                                                boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
                                                flexShrink: 0,
                                                transform: 'rotate(-3deg)'
                                            }}>
                                                {usr.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0, marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                            <div title={`${usr.firstName} ${usr.lastName}`} style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: '1.2' }}>
                                                <span style={{ wordWrap: 'break-word' }}>{usr.firstName} {usr.lastName}</span>
                                                {usr.isVerified && <CheckCircle size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '3px' }} />}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: '600' }}>
                                                @{usr.username}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'anywhere', lineHeight: '1.3' }}>
                                                {usr.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '8px',
                                            background: usr.role === 'admin' ? 'linear-gradient(135deg, #a855f7, #9333ea)' : usr.role === 'moderator' ? 'linear-gradient(135deg, var(--primary), #4f46e5)' : 'var(--bg-input)',
                                            color: usr.role === 'user' ? 'var(--text-light)' : 'white',
                                            fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
                                            border: usr.role === 'user' ? '1px solid var(--border-color)' : 'none',
                                            boxShadow: usr.role !== 'user' ? `0 4px 10px rgba(${usr.role === 'admin' ? '168, 85, 247' : '99, 102, 241'}, 0.2)` : 'none'
                                        }}>
                                            {getRoleLabel(usr.role)}
                                        </span>
                                        {usr.sanctions > 0 && (
                                            <span style={{
                                                fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #f87171, #ef4444)', color: 'white',
                                                fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase',
                                                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                                            }}>
                                                {usr.sanctions} Falta{usr.sanctions !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 'auto', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary)',
                                            border: '1px solid rgba(99, 102, 241, 0.1)',
                                            padding: '0.75rem 1rem', borderRadius: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '700', gap: '0.5rem', width: '100%',
                                            transition: 'background 0.2s', fontSize: '0.9rem'
                                        }}
                                        className="user-card-action"
                                    >
                                        <Info size={16} /> Ver Expediente
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : filteredReports.length === 0 ? (
                    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--surface-solid)', borderRadius: '24px', marginTop: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--primary)',
                            width: '60px', height: '60px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
                            animation: 'gentle-float 3s ease-in-out infinite'
                        }}>
                            <Inbox size={32} />
                        </div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                            {reports.length === 0 ? 'No hay reportes en esta sección' : 'No hay reportes para este tipo'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                            {reports.length === 0
                                ? 'Selecciona otro filtro o vuelve más tarde cuando haya nueva actividad.'
                                : 'Prueba seleccionando otro tipo de incidente.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                        {filteredReports.map((report) => (
                            <div key={report._id} className="moderation-card moderation-card-responsive">
                                {/* Media Side */}
                                <div className="moderation-card-media">
                                    <MediaGallery media={report.media && report.media.length > 0 ? report.media : (report.photos || [])} />

                                    <div style={{
                                        position: 'absolute', top: '1rem', left: '1rem',
                                        background: report.status === 'pending' ? 'var(--warning)' : report.status === 'approved' ? 'var(--success)' : report.status === 'In Process' ? 'var(--primary)' : report.wasSanctioned ? '#991b1b' : 'var(--error)',
                                        color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px',
                                        fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        zIndex: 20
                                    }}>
                                        {report.wasSanctioned ? 'Sancionado' :
                                            report.status === 'pending' ? 'Pendiente' :
                                                report.status === 'approved' ? 'Aprobado' :
                                                    report.status === 'In Process' ? 'En Proceso' :
                                                        'Rechazado'}
                                    </div>
                                </div>

                                {/* Info Side */}
                                <div className="moderation-card-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{getIncidentLabel(report.type)}</h3>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                                Por <strong>{report.userId?.username || 'Usuario Desconocido'}</strong> • {new Date(report.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{
                                        color: 'var(--text-main)',
                                        lineHeight: '1.6',
                                        marginBottom: '1rem',
                                        flex: 1,
                                        overflowY: 'auto',
                                        paddingRight: '0.5rem'
                                    }}>
                                        {report.description}
                                    </p>

                                    {report.moderatorComment && (
                                        <div style={{
                                            background: report.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            borderLeft: `4px solid ${report.status === 'approved' ? 'var(--success)' : 'var(--error)'}`,
                                            padding: '1rem', marginBottom: '2rem', borderRadius: '8px'
                                        }}>
                                            <strong style={{ color: report.status === 'approved' ? 'var(--success)' : 'var(--error)', display: 'block', marginBottom: '0.25rem' }}>
                                                {report.status === 'approved' ? 'Comentario de moderación:' : report.wasSanctioned ? 'Motivo de sanción:' : 'Motivo de rechazo:'}
                                            </strong>
                                            <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>{report.moderatorComment}</span>
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex', gap: '1rem', flexWrap: 'wrap',
                                        paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)',
                                        marginTop: 'auto'
                                    }}>
                                        <button
                                            onClick={() => handleOpenDetails(report)}
                                            disabled={report.status === 'In Process' && report.moderatorInCharge !== user?.id}
                                            style={{
                                                background: report.status === 'In Process' && report.moderatorInCharge !== user?.id ? 'var(--bg-input)' : 'var(--primary)',
                                                color: report.status === 'In Process' && report.moderatorInCharge !== user?.id ? 'var(--text-muted)' : 'white',
                                                border: report.status === 'In Process' && report.moderatorInCharge !== user?.id ? '1px solid var(--border-color)' : 'none',
                                                padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '800', gap: '0.6rem', width: '100%',
                                                opacity: report.status === 'In Process' && report.moderatorInCharge !== user?.id ? 0.6 : 1,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {report.status === 'In Process' && report.moderatorInCharge !== user?.id ? (
                                                <>En Revisión por otro Moderador</>
                                            ) : (
                                                <><Info size={18} /> {(['approved', 'rejected'].includes(report.status) || report.wasSanctioned) ? 'Ver Detalles' : 'Ver Detalles y Moderar'}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            {isModalOpen && selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={handleCloseDetails}
                    onModerate={handleModerate}
                    user={user}
                />
            )}

            {/* User Detail Modal */}
            <UserDetailModal
                user={selectedUser}
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
            />
        </div>
    );
};

export default ModerateReports;
