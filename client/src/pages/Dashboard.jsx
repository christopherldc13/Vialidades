import { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Skeleton, Box } from '@mui/material';
import AuthContext from '../context/AuthContext';
import ReportDetailModal from '../components/ReportDetailModal';
import { Info } from 'lucide-react';



const Dashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, sanctioned: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view') || 'community';
    const { user } = useContext(AuthContext);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isModerator = ['moderator', 'admin'].includes(user?.role);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                let res;
                if (isModerator) {
                    // Moderator: Get stats (using pending and all logic)
                    const pendingRes = await axios.get('/api/reports?status=pending');
                    const allRes = await axios.get('/api/reports?status=all'); // Get all for counts

                    const all = allRes.data;
                    setStats({
                        pending: all.filter(r => r.status === 'pending').length,
                        approved: all.filter(r => r.status === 'approved').length,
                        rejected: all.filter(r => r.status === 'rejected' && !r.wasSanctioned).length,
                        sanctioned: all.filter(r => r.wasSanctioned).length
                    });
                    setReports(pendingRes.data);
                } else {
                    // Regular User
                    if (viewMode === 'my') {
                        res = await axios.get('/api/reports?my=true');
                    } else {
                        res = await axios.get('/api/reports'); // status=approved by default
                    }
                    setReports(res.data);
                }
            } catch (err) {
                console.error("Error fetching reports:", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchReports();
    }, [user, isModerator, viewMode]);

    useEffect(() => {
        const reportIdToOpen = searchParams.get('reportId');
        if (reportIdToOpen) {
            const existingReport = reports.find(r => r._id === reportIdToOpen);
            if (existingReport) {
                setSelectedReport(existingReport);
                setIsModalOpen(true);
                setSearchParams(params => {
                    params.delete('reportId');
                    return params;
                }, { replace: true });
            } else if (!loading) {
                // Fetch the single report if not found in current list
                const fetchSingle = async () => {
                    try {
                        const res = await axios.get(`/api/reports/${reportIdToOpen}`);
                        setSelectedReport(res.data);
                        setIsModalOpen(true);
                        setSearchParams(params => {
                            params.delete('reportId');
                            return params;
                        }, { replace: true });
                    } catch (err) {
                        console.error('Error fetching deep-linked report:', err);
                    }
                };
                fetchSingle();
            }
        }
    }, [searchParams, reports, loading, setSearchParams]);

    const getImageUrl = (report) => {
        if (!report.photos || report.photos.length === 0) return null;
        const url = report.photos[0].url;
        if (url.startsWith('blob:') || url.startsWith('http')) return url;
        return import.meta.env.PROD ? `/${url}` : `http://localhost:5000/${url}`;
    };

    return (
        <div>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <div className="dashboard-header modern-dashboard-header">
                        <div>
                            <h2>{isModerator ? 'Panel de Moderación' : 'Reportes de Incidentes'}</h2>
                            {isModerator && <p className="text-muted">Resumen de actividad.</p>}
                        </div>

                        {/* User Tabs */}
                        {!isModerator && (
                            <div className="toggle-group">
                                <button
                                    onClick={() => setSearchParams({ view: 'community' })}
                                    className={`toggle-btn ${viewMode === 'community' ? 'active' : ''}`}
                                >
                                    Comunidad
                                </button>
                                <button
                                    onClick={() => setSearchParams({ view: 'my' })}
                                    className={`toggle-btn ${viewMode === 'my' ? 'active' : ''}`}
                                >
                                    Mis Reportes
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Moderator Stats */}
                    {isModerator && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pendientes</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pending}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Aprobados</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.approved}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Rechazados</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error)' }}>{stats.rejected}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sancionados</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b91c1c' }}>{stats.sanctioned}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Moderator Navigation - Hides Grid */}
                {isModerator ? (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <Link to="/moderate" className="primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            🛡️ Ir al Panel de Moderación
                        </Link>
                    </div>
                ) : (
                    /* User Grid */
                    <div className="report-grid">
                        {loading ? (
                            // Skeleton realization
                            Array.from(new Array(6)).map((_, index) => (
                                <Box key={index} className="report-card modern-report-card">
                                    <Skeleton variant="rectangular" height={220} animation="wave" />
                                    <Box sx={{ p: 'var(--space-md)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Skeleton variant="text" width="60%" height={30} animation="wave" />
                                            <Skeleton variant="rounded" width={80} height={24} animation="wave" />
                                        </Box>
                                        <Skeleton variant="text" width="100%" height={20} animation="wave" />
                                        <Skeleton variant="text" width="80%" height={20} animation="wave" />
                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                                            <Skeleton variant="text" width="40%" height={15} animation="wave" />
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        ) : (
                            reports.map((report) => (
                                <div 
                                    key={report._id} 
                                    className="report-card modern-report-card"
                                    onClick={() => {
                                        setSelectedReport(report);
                                        setIsModalOpen(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="report-image-container">
                                        <MediaGallery media={report.media && report.media.length > 0 ? report.media : (report.photos || [])} />
                                    </div>
                                    <div className="report-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{report.type === 'Traffic' ? 'Tráfico' : report.type === 'Accident' ? 'Accidente' : report.type === 'Violation' ? 'Infracción' : report.type === 'Hazard' ? 'Peligro' : report.type}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className={`status-badge status-${report.wasSanctioned ? 'sanctioned' : report.status}`} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                                                    {report.status === 'pending' ? 'Pendiente' : report.status === 'approved' ? 'Aprobado' : report.wasSanctioned ? 'Sancionado' : 'Rechazado'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-muted" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: '1.6',
                                            textAlign: 'left'
                                        }}>
                                            {report.description}
                                        </p>

                                        {report.moderatorComment && (
                                            <div style={{ padding: '0.75rem', marginTop: '1rem', background: report.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderLeft: `3px solid ${report.status === 'approved' ? '#10b981' : '#ef4444'}`, borderRadius: '4px', fontSize: '0.85rem' }}>
                                                <strong style={{ color: report.status === 'approved' ? '#166534' : '#991b1b', display: 'block', marginBottom: '0.25rem' }}>{report.status === 'approved' ? 'Comentario del moderador:' : 'Motivo:'}</strong>
                                                <span style={{ color: '#475569' }}>{report.moderatorComment}</span>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                                                <span style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }}>📍</span>
                                                <span style={{ lineHeight: '1.4', textAlign: 'left', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {report.location && report.location.address ? report.location.address : report.location ? `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}` : 'Desconocido'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setIsModalOpen(true);
                                                }}
                                                style={{
                                                    background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)',
                                                    padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem',
                                                    fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                                                }}
                                            >
                                                <Info size={14} /> Detalles
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!isModerator && reports.length === 0 && (
                    <div className="text-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
                        <p>{viewMode === 'my' ? 'No has subido ningun reporte aún.' : 'No hay reportes aprobados recientes.'}</p>
                    </div>
                )}
            </div>

            {!isModerator && (
                <Link to="/create-report" className="fab">
                    <span className="fab-tooltip">Crea un Reporte</span>
                    <Plus size={32} />
                </Link>
            )}

            {/* Report Detail Modal */}
<<<<<<< HEAD
            <ReportDetailModal
                report={selectedReport}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isModerator={isModerator}
=======
            <ReportDetailModal 
                report={selectedReport} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                isModerator={isModerator} 
>>>>>>> 8b39ed977bffda454760baa0c48a6549dc476786
            />
        </div>
    );
};

export default Dashboard;
