import { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';



const Dashboard = () => {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, sanctioned: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view') || 'community';
    const { user } = useContext(AuthContext);
    const isModerator = ['moderator', 'admin'].includes(user?.role);

    useEffect(() => {
        const fetchReports = async () => {
            try {
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
            }
        };
        if (user) fetchReports();
    }, [user, isModerator, viewMode]);

    const getImageUrl = (report) => {
        if (!report.photos || report.photos.length === 0) return null;
        const url = report.photos[0].url;
        if (url.startsWith('blob:') || url.startsWith('http')) return url;
        return `http://localhost:5000/${url}`;
    };

    return (
        <div>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <div className="dashboard-header">
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
                            <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pendientes</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pending}</div>
                            </div>
                            <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Aprobados</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.approved}</div>
                            </div>
                            <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Rechazados</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error)' }}>{stats.rejected}</div>
                            </div>
                            <div className="stat-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
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
                        {reports.map((report) => (
                            <div key={report._id} className="report-card">
                                <div className="report-image-container">
                                    <MediaGallery media={report.media && report.media.length > 0 ? report.media : (report.photos || [])} />
                                </div>
                                <div className="report-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem' }}>{report.type === 'Traffic' ? 'Tráfico' : report.type === 'Accident' ? 'Accidente' : report.type === 'Violation' ? 'Infracción' : report.type === 'Hazard' ? 'Peligro' : report.type}</h3>
                                        <span className={`status-badge status-${report.wasSanctioned ? 'sanctioned' : report.status}`}>
                                            {report.status === 'pending' ? 'Pendiente' : report.status === 'approved' ? 'Aprobado' : report.wasSanctioned ? 'Sancionado' : 'Rechazado'}
                                        </span>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem', height: '3rem', overflow: 'hidden' }}>{report.description}</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            📍 {report.location && report.location.address ? report.location.address : report.location ? `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}` : 'Desconocido'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    <Plus size={32} />
                </Link>
            )}
        </div>
    );
};

export default Dashboard;
