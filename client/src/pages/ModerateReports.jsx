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

const ModerateReports = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialFilter = searchParams.get('filter') || 'pending';

    const [reports, setReports] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [filter, setFilter] = useState(initialFilter); // pending, approved, rejected, sanctioned, all, users
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
        const fetchReports = async () => {
            setLoading(true);
            try {
                // Fetch based on filter
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
                setReports(reports.filter(r => r._id !== id));
            } else {
                setReports(reports.map(r => r._id === id ? { ...r, status, wasSanctioned: sanctionUser, rejectionReason } : r));
            }

            if (sanctionUser) toast.success("Usuario sancionado correctamente.");
            else toast.success("Reporte moderado correctamente.");
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar la solicitud.");
        }
    };

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
                                            {usr.role}
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
                ) : reports.length === 0 ? (
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
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>No hay reportes en esta sección</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>Selecciona otro filtro o vuelve más tarde cuando haya nueva actividad.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                        {reports.map((report) => (
                            <div key={report._id} className="moderation-card moderation-card-responsive">
                                {/* Media Side */}
                                <div className="moderation-card-media">
                                    <MediaGallery media={report.media && report.media.length > 0 ? report.media : (report.photos || [])} />

                                    <div style={{
                                        position: 'absolute', top: '1rem', left: '1rem',
                                        background: report.status === 'pending' ? 'var(--warning)' : report.status === 'approved' ? 'var(--success)' : report.wasSanctioned ? '#991b1b' : 'var(--error)',
                                        color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px',
                                        fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        zIndex: 20
                                    }}>
                                        {report.status === 'pending' ? 'Pendiente' : report.status === 'approved' ? 'Aprobado' : report.wasSanctioned ? 'Sancionado' : 'Rechazado'}
                                    </div>
                                </div>

                                {/* Info Side */}
                                <div className="moderation-card-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{report.type}</h3>
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

                                    {/* Actions Toolbar */}
                                    <div style={{
                                        display: 'flex', gap: '1rem', flexWrap: 'wrap',
                                        paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)',
                                        marginTop: 'auto'
                                    }}>
                                        {report.status === 'pending' || filter === 'all' ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: '<h2 style="color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;"><div style="background: rgba(16, 185, 129, 0.15); color: var(--success); padding: 8px; border-radius: 50%; display: flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div> Aprobar Reporte</h2>',
                                                            html: '<div style="color: var(--text-light); font-size: 0.95rem; margin-bottom: 5px;">Por favor, ingresa un comentario o justificación para aprobar este reporte:</div>',
                                                            input: 'textarea',
                                                            inputPlaceholder: 'Ej. Reporte muy útil y ubicación precisa.',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Confirmar Aprobación',
                                                            cancelButtonText: 'Cancelar',
                                                            customClass: {
                                                                confirmButton: 'swal2-lumina-confirm swal2-confirm-success',
                                                                cancelButton: 'swal2-lumina-cancel'
                                                            },
                                                            buttonsStyling: false,
                                                            background: 'var(--surface-solid)',
                                                            color: 'var(--text-main)',
                                                            inputValidator: (value) => {
                                                                if (!value || value.trim() === '') {
                                                                    return 'El comentario es obligatorio para aprobar.';
                                                                }
                                                            }
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                handleModerate(report._id, 'approved', false, result.value);
                                                            }
                                                        });
                                                    }}
                                                    disabled={report.status !== 'pending'}
                                                    style={{
                                                        flex: 1, background: report.status === 'approved' ? 'var(--bg-input)' : 'rgba(16, 185, 129, 0.15)',
                                                        color: report.status === 'approved' ? 'var(--text-muted)' : 'var(--success)',
                                                        opacity: report.status === 'approved' ? 0.7 : 1,
                                                        border: `1px solid ${report.status === 'approved' ? 'transparent' : 'var(--success)'}`,
                                                        padding: '0.75rem 1.5rem', borderRadius: '12px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                        fontWeight: '700', cursor: report.status === 'approved' ? 'default' : 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Check size={18} /> Aprobar
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: '<h2 style="color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;"><div style="background: rgba(239, 68, 68, 0.15); color: var(--error); padding: 8px; border-radius: 50%; display: flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div> Rechazar Reporte</h2>',
                                                            html: '<div style="color: var(--text-light); font-size: 0.95rem; margin-bottom: 5px;">Por favor, ingresa el motivo del rechazo para notificar al usuario:</div>',
                                                            input: 'textarea',
                                                            inputPlaceholder: 'Ej. La foto no es clara o la ubicación no coincide.',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Confirmar Rechazo',
                                                            cancelButtonText: 'Cancelar',
                                                            customClass: {
                                                                confirmButton: 'swal2-lumina-confirm swal2-confirm-error',
                                                                cancelButton: 'swal2-lumina-cancel'
                                                            },
                                                            buttonsStyling: false,
                                                            background: 'var(--surface-solid)',
                                                            color: 'var(--text-main)',
                                                            inputValidator: (value) => {
                                                                if (!value || value.trim() === '') {
                                                                    return 'El motivo es obligatorio para rechazar.';
                                                                }
                                                            }
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                handleModerate(report._id, 'rejected', false, result.value);
                                                            }
                                                        });
                                                    }}
                                                    disabled={report.status !== 'pending'}
                                                    style={{
                                                        flex: 1, background: report.status === 'rejected' ? 'var(--bg-input)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: report.status === 'rejected' ? 'var(--text-muted)' : 'var(--error)',
                                                        opacity: report.status === 'rejected' ? 0.7 : 1,
                                                        border: `1px solid ${report.status === 'rejected' ? 'transparent' : 'var(--error)'}`,
                                                        padding: '0.75rem 1.5rem', borderRadius: '12px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                        fontWeight: '700', cursor: report.status === 'rejected' ? 'default' : 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <X size={18} /> Rechazar
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: '<h2 style="color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;"><div style="background: rgba(245, 158, 11, 0.15); color: var(--warning); padding: 8px; border-radius: 50%; display: flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div> Sancionar Usuario</h2>',
                                                            html: '<div style="color: var(--text-light); font-size: 0.95rem; margin-bottom: 5px;">Este reporte es falso o malintencionado. Se le añadirá una falta al usuario. Justifícalo:</div>',
                                                            input: 'textarea',
                                                            inputPlaceholder: 'Ej. Tercera vez subiendo imágenes de internet. Se le suspenderá.',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Aplicar Sanción',
                                                            cancelButtonText: 'Cancelar',
                                                            customClass: {
                                                                confirmButton: 'swal2-lumina-confirm swal2-confirm-warning',
                                                                cancelButton: 'swal2-lumina-cancel'
                                                            },
                                                            buttonsStyling: false,
                                                            background: 'var(--surface-solid)',
                                                            color: 'var(--text-main)',
                                                            inputValidator: (value) => {
                                                                if (!value || value.trim() === '') {
                                                                    return 'La justificación es obligatoria para sancionar.';
                                                                }
                                                            }
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                handleModerate(report._id, 'rejected', true, result.value);
                                                            }
                                                        });
                                                    }}
                                                    disabled={report.status !== 'pending'}
                                                    style={{
                                                        background: 'var(--bg-input)', color: 'var(--text-light)', border: '1px solid var(--border-color)',
                                                        padding: '0.75rem', borderRadius: '12px', cursor: report.status === 'pending' ? 'pointer' : 'default',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 'auto', opacity: report.status === 'pending' ? 1 : 0.5,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Sancionar Usuario"
                                                >
                                                    <AlertTriangle size={20} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setIsModalOpen(true);
                                                    }}
                                                    style={{
                                                        background: 'var(--primary)', color: 'white', border: 'none',
                                                        padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: '700', gap: '0.5rem'
                                                    }}
                                                >
                                                    <Info size={18} /> Ver Detalles
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                    Este reporte ya fue moderado.
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setIsModalOpen(true);
                                                    }}
                                                    style={{
                                                        background: 'var(--bg-input)', color: 'var(--primary)', border: '1px solid var(--primary)',
                                                        padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: '700', gap: '0.5rem', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    <Info size={16} /> Ver Detalles
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            <ReportDetailModal
                report={selectedReport}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isModerator={true}
            />

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
