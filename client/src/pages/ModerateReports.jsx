import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ModerateReports = () => {
    const [reports, setReports] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPendingReports = async () => {
            try {
                // Ensure only pending reports are fetched
                const res = await axios.get('/api/reports?status=pending');
                setReports(res.data);
            } catch (err) {
                console.error("Error fetching reports:", err);
            }
        };
        if (user) fetchPendingReports();
    }, [user]);

    const handleModerate = async (id, status, sanctionUser = false) => {
        try {
            await axios.patch(`/api/reports/${id}/moderate`, { status, moderatorId: user.id, sanctionUser });
            // Remove from list immediately
            setReports(reports.filter(r => r._id !== id));
            if (sanctionUser) alert("Usuario sancionado correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al procesar la solicitud.");
        }
    };

    const getImageUrl = (report) => {
        if (!report.photos || report.photos.length === 0) return null;
        const url = report.photos[0].url;
        if (url.startsWith('blob:') || url.startsWith('http')) return url;
        return `http://localhost:5000/${url}`;
    };

    // Protect route logic (simple)
    if (user && !['admin', 'moderator'].includes(user.role)) {
        return <div className="container" style={{ padding: '2rem' }}>No tienes permisos para ver esta página.</div>;
    }

    return (
        <div>
            <Navbar />
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px' }}>
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-main)' }}>
                        <ArrowLeft size={20} /> Volver al Panel
                    </Link>
                    <h2>Cola de Moderación</h2>
                </div>

                {reports.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <h3>¡Todo al día! 🎉</h3>
                        <p>No hay reportes pendientes de revisión.</p>
                    </div>
                ) : (
                    <div className="moderation-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
                        {reports.map((report) => (
                            <div key={report._id} style={{
                                display: 'flex', flexDirection: 'row',
                                background: '#fff', borderRadius: '12px',
                                boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                                border: '1px solid var(--border)'
                            }}>
                                {/* Image/Video Section - Fixed width */}
                                <div style={{ width: '200px', height: '200px', flexShrink: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(() => {
                                        // Prioritize new 'media' field, fallback to 'photos'
                                        const mediaItem = (report.media && report.media.length > 0) ? report.media[0] : (report.photos && report.photos.length > 0) ? { ...report.photos[0], type: 'image' } : null;

                                        if (!mediaItem) return <div style={{ color: '#94a3b8' }}>Sin Multimedia</div>;

                                        const url = mediaItem.url.startsWith('http') ? mediaItem.url : `http://localhost:5000/${mediaItem.url}`;

                                        if (mediaItem.type === 'video') {
                                            return (
                                                <video
                                                    src={url}
                                                    controls
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            );
                                        } else {
                                            return (
                                                <img
                                                    src={url}
                                                    alt={report.type}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            );
                                        }
                                    })()}
                                </div>

                                {/* Content Section */}
                                <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>{report.type}</h3>
                                        <span className="status-badge status-pending">Pendiente</span>
                                    </div>

                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>
                                        {report.description}
                                    </p>

                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                        <strong>Reportado por:</strong> {report.userId?.username} <br />
                                        <strong>Ubicación:</strong> {report.location ? `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}` : 'N/A'}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => handleModerate(report._id, 'approved')}
                                            style={{
                                                background: 'var(--success)', color: 'white', border: 'none',
                                                padding: '0.75rem', borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                fontWeight: 'bold', fontSize: '0.9rem'
                                            }}
                                        >
                                            <Check size={18} /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleModerate(report._id, 'rejected')}
                                            style={{
                                                background: 'var(--error)', color: 'white', border: 'none',
                                                padding: '0.75rem', borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                fontWeight: 'bold', fontSize: '0.9rem'
                                            }}
                                        >
                                            <X size={18} /> Rechazar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('¿SANCIONAR USUARIO? Esto restará puntos de reputación graves.')) {
                                                    handleModerate(report._id, 'rejected', true);
                                                }
                                            }}
                                            style={{
                                                background: '#334155', color: 'white', border: 'none',
                                                padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Sancionar Usuario"
                                        >
                                            <AlertTriangle size={20} />
                                        </button>
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
