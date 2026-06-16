import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, MapPin, User, Calendar, FileText, Car, Shield, ArrowLeft, Clock, Hash, MessageSquare, AlertTriangle } from 'lucide-react';

const INCIDENT_LABELS = {
    Traffic:   'Tráfico Pesado',
    Accident:  'Accidente de Tránsito',
    Violation: 'Infracción Vial',
    Hazard:    'Peligro en la Vía',
    RoadWork:  'Obra en la Vía',
    Pothole:   'Bache Peligroso',
    Flood:     'Inundación',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: '600', wordBreak: 'break-word' }}>{value}</div>
        </div>
    </div>
);

export default function ReportVerifyPage() {
    const { code, id } = useParams();
    const [report, setReport] = useState(null);
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = id
            ? `/api/reports/verify-id/${id}`
            : `/api/reports/verify/${code}`;
        axios.get(url)
            .then(r => setReport(r.data))
            .catch(e => setError(e.response?.data?.msg || 'Error al verificar el reporte.'))
            .finally(() => setLoading(false));
    }, [code, id]);

    const reportCode = report ? `VTI${String(report.reportNumber).padStart(4, '0')}` : '';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>

            {/* ── Loading ── */}
            {loading && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verificando reporte...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden', maxWidth: 460, width: '100%', textAlign: 'center' }}>
                        <div style={{ padding: '2.5rem 2rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
                            <XCircle size={52} color="#ef4444" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
                            <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: '900', fontSize: '1.25rem' }}>Reporte no encontrado</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{error}</p>
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            <Link to="/" onClick={() => window.scrollTo(0, 0)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', textDecoration: 'none' }}>
                                <ArrowLeft size={14} /> Volver al inicio
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Report ── */}
            {!loading && report && (
                <>
                    {/* Hero */}
                    <div className="verify-hero" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #312e81 100%)', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '999px', padding: '0.3rem 0.9rem' }}>
                                    <CheckCircle size={13} color="#10b981" />
                                    <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em' }}>REPORTE VERIFICADO Y PUBLICADO</span>
                                </div>
                            </div>

                            <div className="verify-hero-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                        <Shield size={16} color="rgba(255,255,255,0.5)" />
                                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: '600' }}>Vialidades de Tránsito · República Dominicana</span>
                                    </div>
                                    <h1 style={{ margin: '0 0 0.4rem', color: '#fff', fontWeight: '900', fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                                        Certificado Oficial de Reporte Vial
                                    </h1>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                                        Documento auténtico emitido y verificado por la Plataforma Vialidades
                                    </p>
                                </div>

                                <div className="verify-hero-code" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '1rem 1.5rem', textAlign: 'center', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>N° DE REPORTE</div>
                                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '1.6rem', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{reportCode}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '2rem 1rem', boxSizing: 'border-box' }}>
                        <div className="verify-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

                            {/* Left */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

                                {/* Info */}
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={15} color="var(--primary)" />
                                        <span style={{ fontWeight: '800', fontSize: '0.78rem', color: 'var(--text-main)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Información del incidente</span>
                                    </div>
                                    <InfoRow icon={<Hash size={15} />}      label="Código"        value={reportCode} />
                                    <InfoRow icon={<FileText size={15} />}  label="Tipo"          value={INCIDENT_LABELS[report.type] || report.type} />
                                    <InfoRow icon={<Calendar size={15} />}  label="Fecha"         value={fmtDate(report.timestamp)} />
                                    <InfoRow icon={<Clock size={15} />}     label="Hora"          value={fmtTime(report.timestamp)} />
                                    <InfoRow icon={<User size={15} />}      label="Reportado por" value={report.userId?.username || 'Usuario desconocido'} />
                                    {report.location?.address && (
                                        <InfoRow icon={<MapPin size={15} />} label="Ubicación" value={report.location.address} />
                                    )}
                                    {!report.location?.address && report.location?.lat && (
                                        <InfoRow icon={<MapPin size={15} />} label="Coordenadas" value={`${report.location.lat.toFixed(5)}, ${report.location.lng.toFixed(5)}`} />
                                    )}
                                    {report.carInfo?.brand && (
                                        <InfoRow icon={<Car size={15} />} label="Vehículo" value={[report.carInfo.brand, report.carInfo.model, report.carInfo.year, report.carInfo.color].filter(Boolean).join(' · ')} />
                                    )}
                                    {/* Remove border-bottom on last row */}
                                    <div style={{ height: 1 }} />
                                </div>

                                {/* Description */}
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MessageSquare size={15} color="var(--primary)" />
                                        <span style={{ fontWeight: '800', fontSize: '0.78rem', color: 'var(--text-main)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Descripción</span>
                                    </div>
                                    <div style={{ padding: '1.25rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-light)', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '0.85rem' }}>
                                            "{report.description}"
                                        </p>
                                    </div>
                                </div>

                                {/* Moderator comment */}
                                {report.moderatorComment && (
                                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={15} color="#10b981" />
                                            <span style={{ fontWeight: '800', fontSize: '0.78rem', color: 'var(--text-main)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Nota del moderador</span>
                                        </div>
                                        <div style={{ padding: '1.25rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.7 }}>{report.moderatorComment}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                {/* Authenticity seal */}
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', overflow: 'hidden' }}>
                                    <div style={{ padding: '1.75rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ width: 60, height: 60, background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                            <CheckCircle size={28} color="#10b981" strokeWidth={1.5} />
                                        </div>
                                        <div style={{ fontWeight: '800', fontSize: '1rem', color: '#10b981', marginBottom: '0.35rem' }}>Reporte Auténtico</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.55 }}>
                                            Verificado y aprobado por la plataforma oficial Vialidades de Tránsito
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.25rem 0' }}>
                                        {[
                                            { label: 'Estado', value: 'Publicado y activo', color: '#10b981' },
                                            { label: 'Plataforma', value: 'Vialidades de Tránsito' },
                                            { label: 'País', value: 'República Dominicana' },
                                            { label: 'Verificado el', value: fmtDate(new Date()) },
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>{item.label}</span>
                                                <span style={{ fontSize: '0.82rem', color: item.color || 'var(--text-main)', fontWeight: '700' }}>{item.value}</span>
                                            </div>
                                        ))}
                                        <div style={{ padding: '1rem 1.25rem' }}>
                                            <Link to="/" onClick={() => window.scrollTo(0, 0)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.84rem', textDecoration: 'none' }}>
                                                <ArrowLeft size={14} /> Ir a Vialidades
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Notice */}
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                                    <AlertTriangle size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                                        Este certificado fue generado mediante un código QR único vinculado exclusivamente a este reporte. No es posible acceder a otros reportes modificando el enlace.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @media (max-width: 700px) {
                            .verify-grid {
                                grid-template-columns: 1fr !important;
                            }
                            .verify-hero-row {
                                flex-direction: column !important;
                                align-items: flex-start !important;
                            }
                            .verify-hero-code {
                                width: 100% !important;
                                box-sizing: border-box !important;
                            }
                            .verify-hero {
                                padding: 1.75rem 1rem !important;
                            }
                        }
                    `}</style>
                </>
            )}
        </div>
    );
}
