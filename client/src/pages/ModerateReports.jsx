import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModerateReports = () => {
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, sanctioned, all
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

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

            if (sanctionUser) alert("Usuario sancionado correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al procesar la solicitud.");
        }
    };

    if (user && !['admin', 'moderator'].includes(user.role)) {
        return <div className="container" style={{ padding: '2rem' }}>No tienes permisos.</div>;
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-light)', fontWeight: '600' }}>
                            <ArrowLeft size={20} /> Volver
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
                        Panel de Moderación
                    </h1>
                    <p style={{ color: '#64748b' }}>Gestiona los reportes de la comunidad y mantén la calidad de la plataforma.</p>
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
                                background: filter === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                                border: filter === tab.id ? '2px solid var(--primary)' : '1px solid transparent',
                                borderRadius: '16px',
                                fontSize: '1rem',
                                fontWeight: filter === tab.id ? '700' : '600',
                                color: filter === tab.id ? 'var(--primary)' : '#64748b',
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
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando reportes...</div>
                ) : reports.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '20px', marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                        <h3 style={{ color: '#1e293b' }}>No hay reportes en esta sección</h3>
                        <p style={{ color: '#64748b' }}>Selecciona otro filtro o vuelve más tarde.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                        {reports.map((report) => (
                            <div key={report._id} style={{
                                display: 'flex', flexDirection: 'column',
                                background: 'white', borderRadius: '20px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                overflow: 'hidden',
                                transition: 'transform 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}
                                className="moderation-card"
                            >
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {/* Media Side */}
                                    <div style={{ flex: '1 1 300px', maxWidth: '400px', background: '#f1f5f9', position: 'relative', minHeight: '250px' }}>
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
                                    <div style={{ flex: '1 1 300px', padding: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>{report.type}</h3>
                                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                    Por <strong>{report.userId?.username || 'Usuario Desconocido'}</strong> • {new Date(report.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                                            {report.description}
                                        </p>

                                        {report.status === 'rejected' && report.rejectionReason && (
                                            <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '1rem', marginBottom: '2rem', borderRadius: '4px' }}>
                                                <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.25rem' }}>
                                                    {report.wasSanctioned ? 'Motivo de sanción:' : 'Motivo de rechazo:'}
                                                </strong>
                                                <span style={{ color: '#7f1d1d' }}>{report.rejectionReason}</span>
                                            </div>
                                        )}

                                        {/* Actions Toolbar */}
                                        <div style={{
                                            display: 'flex', gap: '1rem', flexWrap: 'wrap',
                                            paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9'
                                        }}>
                                            {report.status === 'pending' || filter === 'all' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleModerate(report._id, 'approved')}
                                                        disabled={report.status !== 'pending'}
                                                        style={{
                                                            flex: 1, background: report.status === 'approved' ? '#f1f5f9' : '#dcfce7',
                                                            color: report.status === 'approved' ? '#94a3b8' : '#166534',
                                                            opacity: report.status === 'approved' ? 0.7 : 1,
                                                            border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                            fontWeight: '700', cursor: report.status === 'approved' ? 'default' : 'pointer'
                                                        }}
                                                    >
                                                        <Check size={18} /> Aprobar
                                                    </button>

                                                    <button
                                                        onClick={() => handleModerate(report._id, 'rejected')}
                                                        disabled={report.status !== 'pending'}
                                                        style={{
                                                            flex: 1, background: report.status === 'rejected' ? '#f1f5f9' : '#fee2e2',
                                                            color: report.status === 'rejected' ? '#94a3b8' : '#991b1b',
                                                            opacity: report.status === 'rejected' ? 0.7 : 1,
                                                            border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                            fontWeight: '700', cursor: report.status === 'rejected' ? 'default' : 'pointer'
                                                        }}
                                                    >
                                                        <X size={18} /> Rechazar
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt("⚠️ PROCESO DE SANCIÓN\n\nPor favor, ingresa la justificación para sancionar a este usuario. Esto reducirá drásticamente su reputación y añadirá una falta acumulativa.");
                                                            if (reason) {
                                                                handleModerate(report._id, 'rejected', true, reason);
                                                            }
                                                        }}
                                                        disabled={report.status !== 'pending'}
                                                        style={{
                                                            background: '#f1f5f9', color: '#64748b', border: 'none',
                                                            padding: '0.75rem', borderRadius: '12px', cursor: report.status === 'pending' ? 'pointer' : 'default',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            width: 'auto', opacity: report.status === 'pending' ? 1 : 0.5
                                                        }}
                                                        title="Sancionar Usuario"
                                                    >
                                                        <AlertTriangle size={20} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                    Este reporte ya fue moderado.
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
        </div>
    );
};

export default ModerateReports;
