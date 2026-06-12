import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, MapPin, User, Calendar, FileText, Car, Shield, ArrowLeft } from 'lucide-react';

const INCIDENT_LABELS = {
    Traffic:   'Tráfico Pesado',
    Accident:  'Accidente de Tránsito',
    Violation: 'Infracción Vial',
    Hazard:    'Peligro en la Vía',
    RoadWork:  'Obra en la Vía',
    Pothole:   'Bache Peligroso',
    Flood:     'Inundación',
};

const fmt = (d) => new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
});

const Row = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ color: '#6366f1', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600', wordBreak: 'break-word' }}>{value}</div>
        </div>
    </div>
);

export default function ReportVerifyPage() {
    const { code } = useParams();
    const [report, setReport] = useState(null);
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/reports/verify/${code}`)
            .then(r => setReport(r.data))
            .catch(e => setError(e.response?.data?.msg || 'Error al verificar el reporte.'))
            .finally(() => setLoading(false));
    }, [code]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '2rem 1rem 4rem' }}>

            {/* Header band */}
            <div style={{ width: '100%', maxWidth: '600px', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '20px', padding: '1.75rem 2rem', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                    <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                        <Shield size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Vialidades de Tránsito</span>
                    </div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Verificación de Reporte</h1>
                    <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.85 }}>República Dominicana · Plataforma oficial</p>
                </div>
            </div>

            {/* Content */}
            <div style={{ width: '100%', maxWidth: '600px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Verificando reporte...
                    </div>
                )}

                {error && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(239,68,68,0.08)', padding: '2rem', textAlign: 'center', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                            <XCircle size={48} color="#ef4444" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
                            <h2 style={{ margin: '0 0 0.5rem', color: '#ef4444', fontWeight: '800' }}>Reporte no verificado</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>{error}</p>
                        </div>
                        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                            <Link to="/" style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                                <ArrowLeft size={15} /> Volver al inicio
                            </Link>
                        </div>
                    </div>
                )}

                {report && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(99,102,241,0.1)' }}>

                        {/* Verified banner */}
                        <div style={{ background: 'rgba(16,185,129,0.08)', borderBottom: '1px solid rgba(16,185,129,0.2)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
                                <CheckCircle size={22} color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#10b981' }}>Reporte verificado y publicado</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                    Este documento es auténtico y fue aprobado por la plataforma Vialidades de Tránsito.
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontWeight: '900', fontSize: '1.1rem', color: '#6366f1', letterSpacing: '2px', flexShrink: 0 }}>
                                VTI{String(report.reportNumber).padStart(4, '0')}
                            </div>
                        </div>

                        {/* Details */}
                        <div>
                            <Row icon={<FileText size={16} />} label="Tipo de incidente" value={INCIDENT_LABELS[report.type] || report.type} />
                            <Row icon={<Calendar size={16} />} label="Fecha y hora" value={fmt(report.timestamp)} />
                            <Row icon={<User size={16} />} label="Reportado por" value={report.userId?.username || 'Usuario desconocido'} />
                            {report.location?.address && (
                                <Row icon={<MapPin size={16} />} label="Ubicación" value={report.location.address} />
                            )}
                            {!report.location?.address && report.location?.lat && (
                                <Row icon={<MapPin size={16} />} label="Coordenadas" value={`${report.location.lat.toFixed(5)}, ${report.location.lng.toFixed(5)}`} />
                            )}
                            {report.carInfo?.brand && (
                                <Row icon={<Car size={16} />} label="Vehículo" value={[report.carInfo.brand, report.carInfo.model, report.carInfo.year, report.carInfo.color].filter(Boolean).join(' · ')} />
                            )}
                        </div>

                        {/* Description */}
                        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Descripción</div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.7, borderLeft: '3px solid #6366f150', paddingLeft: '0.85rem', fontStyle: 'italic' }}>
                                "{report.description}"
                            </p>
                        </div>

                        {/* Moderator comment */}
                        {report.moderatorComment && (
                            <div style={{ padding: '1rem 1.25rem', background: 'rgba(16,185,129,0.05)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Nota del moderador</div>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.6 }}>{report.moderatorComment}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-input)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Verificado en: {new Date().toLocaleString('es-DO')}
                            </span>
                            <Link to="/" style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                                <ArrowLeft size={13} /> Ir a Vialidades
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
