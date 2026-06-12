import { useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import ReportDetailModal from '../components/ReportDetailModal';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Info, Inbox, Trash2, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { generateReportPDF } from '../utils/generateReportPDF';
import './DashboardExtras.css';

const getIncidentLabel = (type) => {
    switch (type) {
        case 'Traffic':   return 'Tráfico Pesado';
        case 'Accident':  return 'Accidente';
        case 'Violation': return 'Infracción';
        case 'Hazard':    return 'Peligro en la vía';
        case 'RoadWork':  return 'Obra en la vía';
        case 'Pothole':   return 'Bache peligroso';
        case 'Flood':     return 'Inundación';
        default: return type;
    }
};

const SuperModReports = () => {
    const { user } = useContext(AuthContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportSearch, setReportSearch] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const debounceRef = useRef(null);

    const fetchReports = async (q = '') => {
        setLoading(true);
        try {
            const params = {};
            if (q) {
                const clean = q.trim().replace(/^vti/i, '');
                const num = parseInt(clean, 10);
                if (!isNaN(num)) params.search = num;
            }
            const res = await axios.get('/api/supermod/reports', { params });
            setReports(res.data);
        } catch {
            toast.error('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const handleRemove = async (report) => {
        const result = await Swal.fire({
            title: 'Eliminar reporte',
            text: `¿Eliminar VTI${String(report.reportNumber).padStart(4, '0')} del público? El reporte dejará de ser visible pero no se borrará de la base de datos.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'swal2-lumina-popup', cancelButton: 'swal2-lumina-cancel' },
        });
        if (!result.isConfirmed) return;
        try {
            await axios.patch(`/api/supermod/reports/${report._id}/remove`);
            setReports(prev => prev.filter(r => r._id !== report._id));
            if (selectedReport?._id === report._id) setSelectedReport(null);
            toast.success('Reporte eliminado del público');
        } catch {
            toast.error('No se pudo eliminar el reporte');
        }
    };

    const handleSearch = (val) => {
        setReportSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchReports(val), 400);
    };

    if (!user || !['admin', 'supermoderador'].includes(user.role)) {
        return <div className="container" style={{ padding: '2rem' }}>No tienes permisos.</div>;
    }

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Navbar />
            <div className="container mod-page-container">

                {/* Header */}
                <div className="mod-panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <Link to="/supermoderador" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.4rem', borderRadius: '10px', flexShrink: 0 }}>
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 style={{ fontWeight: '800', color: 'var(--text-main)', margin: 0, fontSize: '1.35rem', lineHeight: 1.2 }}>
                                Reportes Publicados
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                                Todos los reportes aprobados — busca por número para gestionar casos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search bar */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por N° de reporte (ej: VTI0001 o solo 1)..."
                            value={reportSearch}
                            onChange={e => handleSearch(e.target.value)}
                            style={{
                                width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem',
                                height: '38px', borderRadius: '10px', fontSize: '0.875rem',
                                border: '1px solid var(--border-color)', background: 'var(--surface-solid)',
                                color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
                ) : reports.length === 0 ? (
                    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--surface-solid)', borderRadius: '24px', marginTop: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                            width: '60px', height: '60px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem', boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
                            animation: 'gentle-float 3s ease-in-out infinite',
                        }}>
                            <Inbox size={32} />
                        </div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                            {reportSearch ? 'No se encontró ese reporte' : 'No hay reportes publicados'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                            {reportSearch ? 'Verifica el número e intenta de nuevo.' : 'Cuando se aprueben reportes aparecerán aquí.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                        {reports.map((report) => (
                            <div key={report._id} className="moderation-card moderation-card-responsive">

                                {/* Media Side */}
                                <div className="moderation-card-media">
                                    <div style={{ height: '100%', width: '100%' }}>
                                        <MediaGallery media={report.media && report.media.length > 0 ? report.media : (report.photos || [])} />
                                    </div>

                                    <div style={{
                                        position: 'absolute', top: '1rem', left: '1rem',
                                        background: 'var(--success)',
                                        color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px',
                                        fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                                        letterSpacing: '0.05em', zIndex: 20,
                                    }}>
                                        Aprobado
                                    </div>
                                </div>

                                {/* Info Side */}
                                <div className="moderation-card-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                                                {getIncidentLabel(report.type)}
                                            </h3>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                                Por <strong>{report.userId?.username || 'Usuario Desconocido'}</strong> · {new Date(report.timestamp).toLocaleDateString()}
                                            </div>
                                            {report.reportNumber && (
                                                <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                    N° de reporte:{' '}
                                                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-main)' }}>
                                                        VTI{String(report.reportNumber).padStart(4, '0')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p style={{
                                        color: 'var(--text-main)', lineHeight: '1.6',
                                        marginBottom: '1rem', flex: 1,
                                        overflowY: 'auto', paddingRight: '0.5rem',
                                    }}>
                                        {report.description}
                                    </p>

                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem',
                                        paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)',
                                        marginTop: 'auto',
                                    }}>
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            style={{
                                                background: 'var(--primary)', color: 'white',
                                                border: 'none', padding: '0.85rem 1rem',
                                                borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '800', gap: '0.6rem',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <Info size={18} /> Ver Detalles
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await generateReportPDF(report);
                                                } catch (err) {
                                                    console.error('[PDF]', err);
                                                    toast.error('No se pudo generar el PDF');
                                                }
                                            }}
                                            title="Generar certificado PDF"
                                            style={{
                                                background: 'rgba(16,185,129,0.08)', color: '#10b981',
                                                border: '1.5px solid rgba(16,185,129,0.25)',
                                                padding: '0.85rem 1.1rem',
                                                borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '800', gap: '0.5rem',
                                                transition: 'all 0.2s', flexShrink: 0,
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.color = '#10b981'; }}
                                        >
                                            <FileDown size={17} /> PDF
                                        </button>
                                        <button
                                            onClick={() => handleRemove(report)}
                                            style={{
                                                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                border: '1.5px solid rgba(239,68,68,0.25)',
                                                padding: '0.85rem 1.1rem',
                                                borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '800', gap: '0.5rem',
                                                transition: 'all 0.2s', flexShrink: 0,
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                                        >
                                            <Trash2 size={17} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onModerate={() => {}}
                    user={user}
                />
            )}
        </div>
    );
};

export default SuperModReports;
