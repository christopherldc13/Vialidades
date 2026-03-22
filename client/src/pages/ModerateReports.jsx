import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Check, X, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReportDetailModal from '../components/ReportDetailModal';

const ModerateReports = () => {
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, sanctioned, all
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                // Fetch based on filter
                const res = await axios.get(`/api/reports?status=${filter}`);
                setReports(res.data);
            } catch (err) {
                console.error("Error fetching reports:", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchReports();
    }, [user, filter]);

    const handleModerate = async (id, status, sanctionUser = false, rejectionReason = '') => {
        try {
            await axios.patch(`/api/reports/${id}/moderate`, {
                status,
                moderatorId: user.id,
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
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 2rem 5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-light)', fontWeight: '600' }}>
                            <ArrowLeft size={20} /> Volver
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        Panel de Moderación
                    </h1>
                    <p style={{ color: 'var(--text-light)' }}>Gestiona los reportes de la comunidad y mantén la calidad de la plataforma.</p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                    {[
                        { id: 'pending', label: 'Pendientes', icon: AlertTriangle, color: 'var(--warning)' },
                        { id: 'approved', label: 'Aprobados', icon: Check, color: 'var(--success)' },
                        { id: 'rejected', label: 'Rechazados', icon: X, color: 'var(--error)' },
                        { id: 'sanctioned', label: 'Sancionados', icon: AlertTriangle, color: '#b91c1c' },
                        { id: 'all', label: 'Historial Completo', icon: null, color: '#64748b' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '1rem 1.5rem',
                                background: filter === tab.id ? 'var(--surface-solid)' : 'var(--bg-input)',
                                border: filter === tab.id ? '2px solid var(--primary)' : '1px solid transparent',
                                borderRadius: '16px',
                                fontSize: '1rem',
                                fontWeight: filter === tab.id ? '700' : '600',
                                color: filter === tab.id ? 'var(--primary)' : 'var(--text-light)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: filter === tab.id ? '0 10px 15px -3px rgba(99, 102, 241, 0.1)' : 'none',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.icon && <tab.icon size={20} color={filter === tab.id ? 'var(--primary)' : tab.color} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando reportes...</div>
                ) : reports.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--surface-solid)', borderRadius: '20px', marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                        <h3 style={{ color: 'var(--text-main)' }}>No hay reportes en esta sección</h3>
                        <p style={{ color: 'var(--text-light)' }}>Selecciona otro filtro o vuelve más tarde.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                        {reports.map((report) => (
                            <div key={report._id} style={{
                                display: 'flex', flexDirection: 'column',
                                background: 'var(--surface-solid)', borderRadius: '20px',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                transition: 'transform 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                height: '350px'
                            }}
                                className="moderation-card"
                            >
                                <div style={{ display: 'flex', flexWrap: 'wrap', height: '350px' }}>
                                    {/* Media Side */}
                                    <div style={{ flex: '1 1 400px', maxWidth: '500px', background: 'var(--bg-input)', position: 'relative', height: '350px' }}>
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
                                    <div style={{ flex: '1 1 300px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '350px' }}>
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
                                                                title: '✅ APROBAR REPORTE',
                                                                text: 'Por favor, ingresa un comentario o justificación para aprobar este reporte (Requerido):',
                                                                input: 'textarea',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Aprobar',
                                                                cancelButtonText: 'Cancelar',
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
                                                                title: '❌ RECHAZAR REPORTE',
                                                                text: 'Por favor, ingresa el motivo para rechazar este reporte (Requerido):',
                                                                input: 'textarea',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Rechazar',
                                                                cancelButtonText: 'Cancelar',
                                                                confirmButtonColor: 'var(--error)',
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
                                                                title: '⚠️ PROCESO DE SANCIÓN',
                                                                text: 'Por favor, ingresa la justificación para sancionar a este usuario. Esto reducirá drásticamente su reputación y añadirá una falta acumulativa (Requerido):',
                                                                input: 'textarea',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Sancionar',
                                                                cancelButtonText: 'Cancelar',
                                                                confirmButtonColor: 'var(--warning)',
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
        </div>
    );
};

export default ModerateReports;
