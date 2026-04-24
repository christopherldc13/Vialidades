import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { X, Calendar, User, Info, Smartphone, Clock, MapPin, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaGallery from './MediaGallery';
import { FaCar, FaCarCrash } from "react-icons/fa";
import { BsSignStopFill } from "react-icons/bs";
import { LuTriangleAlert } from "react-icons/lu";
import { IoMdHelpCircle } from "react-icons/io";
import { AlertTriangle, Check } from 'lucide-react';
import Swal from 'sweetalert2';

const TYPE_CONFIG = {
    Traffic:   { label: 'Tráfico Pesado',   icon: <FaCar />,           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
    Accident:  { label: 'Accidente',         icon: <FaCarCrash />,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    Violation: { label: 'Infracción',        icon: <BsSignStopFill />,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    Hazard:    { label: 'Peligro en la vía', icon: <LuTriangleAlert />, color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
};

const STATUS_CONFIG = {
    pending:    { label: 'PENDIENTE',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
    approved:   { label: 'APROBADO',    color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
    rejected:   { label: 'RECHAZADO',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
    'In Process':{ label: 'EN PROCESO', color: '#6366f1', bg: 'rgba(99,102,241,0.15)'  },
    sanctioned: { label: 'SANCIONADO',  color: '#b91c1c', bg: 'rgba(185,28,28,0.15)'   },
};

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const formatDate = (d) => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

const ReportDetailModal = ({ report, onClose, onModerate, user }) => {
    const [showRawMetadata, setShowRawMetadata] = useState({});
    const isModerator = user?.role === 'moderator' || user?.role === 'admin';
    const isModerated = useRef(false);

    if (!report) return null;

    const reportLocation = report.location || { lat: 18.7357, lng: -70.1627 };
    const typeCfg = TYPE_CONFIG[report.type] || { label: report.type, icon: <IoMdHelpCircle />, color: 'var(--primary)', bg: 'rgba(99,102,241,0.12)' };
    const statusKey = report.wasSanctioned ? 'sanctioned' : report.status;
    const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;

    const renderMetadata = () => {
        if (!isModerator || !report?.media) return null;
        const allMetadata = report.media.map(m => m.metadata).filter(m => m && Object.keys(m).length > 0);
        if (allMetadata.length === 0) return (
            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: '12px', color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.88rem' }}>
                Sin metadatos técnicos disponibles.
            </div>
        );
        return (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {report.media.map((item, idx) => {
                    const meta = item.metadata || {};
                    if (Object.keys(meta).length === 0) return null;
                    const deviceModel = meta.image_metadata?.Model || meta.exif?.Model || meta.image_metadata?.Make || meta.exif?.Make || 'Desconocido';
                    const hasGPS = meta.gps || meta.exif?.GPSLatitude || meta.image_metadata?.GPSLatitude;
                    return (
                        <div key={idx} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>
                                    <Info size={15} /> Multimedia #{idx + 1} <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>({item.type})</span>
                                </div>
                                <button onClick={() => setShowRawMetadata(p => ({ ...p, [idx]: !p[idx] }))} style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                                    {showRawMetadata[idx] ? 'Ocultar' : 'Ver datos crudos'}
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                                {meta.info && (
                                    <div style={{ gridColumn: '1/-1', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(99,102,241,0.06)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.12)' }}>
                                        <span><strong>Formato:</strong> <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{meta.info.format?.toUpperCase()}</span></span>
                                        <span><strong>Resolución:</strong> {meta.info.width}×{meta.info.height}</span>
                                        <span><strong>Tamaño:</strong> {(meta.info.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Smartphone size={14} color="var(--primary)" /><span><strong>Dispositivo:</strong> {deviceModel}</span></div>
                                {hasGPS && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} color="#ef4444" /><span style={{ color: '#ef4444', fontWeight: '600' }}>GPS detectado</span></div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} color="var(--text-light)" /><span>{meta.image_metadata?.DateTimeOriginal || meta.exif?.DateTimeOriginal || 'N/A'}</span></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} color="var(--text-light)" /><span>Subido: {new Date(report.timestamp).toLocaleString('es-DO')}</span></div>
                                {showRawMetadata[idx] && (
                                    <div style={{ gridColumn: '1/-1', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '10px', fontSize: '0.72rem', overflow: 'auto', maxHeight: '180px', border: '1px solid var(--border-color)' }}>
                                        <pre style={{ margin: 0, color: 'var(--text-light)' }}>{JSON.stringify(meta, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="modal-overlay-modern"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 24 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="modal-container-modern"
                    onClick={e => e.stopPropagation()}
                    style={{ overflow: 'hidden' }}
                >
                    {/* Colored top accent line */}
                    <div style={{ height: '4px', background: `linear-gradient(90deg, ${typeCfg.color}, ${typeCfg.color}88)`, flexShrink: 0 }} />

                    {/* Header */}
                    <div className="modal-header-modern" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <h2 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.6rem)', fontWeight: '900', margin: 0, color: 'var(--text-main)', lineHeight: '1.2' }}>
                                Detalles del Reporte
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {/* Status badge */}
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', background: statusCfg.bg, color: statusCfg.color, letterSpacing: '0.04em' }}>
                                    {statusCfg.label}
                                </span>
                                {/* Type badge */}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', background: typeCfg.bg, color: typeCfg.color }}>
                                    <span style={{ fontSize: '0.75rem', display: 'flex' }}>{typeCfg.icon}</span>
                                    {typeCfg.label}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="modal-close-btn" style={{ flexShrink: 0 }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="modal-body-modern custom-scrollbar">
                        <div className="modal-grid-modern">

                            {/* ── Left Column ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                {/* Media */}
                                <div className="modal-media-wrapper" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                    <MediaGallery media={report.media?.length > 0 ? report.media : (report.photos || [])} objectFit="contain" />
                                </div>

                                {/* Reporter info pills */}
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-solid)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.6rem 0.9rem', flex: 1, minWidth: '160px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                                            {report.userId?.avatar
                                                ? <img src={report.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <User size={15} />
                                            }
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>Reportado por</div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.2 }}>
                                                {report.userId?.firstName ? `${report.userId.firstName} ${report.userId.lastName}` : report.userId?.username || 'Usuario'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-solid)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.6rem 0.9rem', flex: 1, minWidth: '160px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Calendar size={15} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>Fecha y hora</div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.2 }}>
                                                {formatDate(report.timestamp)}
                                                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}> · {formatTime(report.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div style={{ background: 'var(--surface-solid)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Descripción</div>
                                    <p style={{ color: 'var(--text-main)', lineHeight: '1.75', whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>
                                        {report.description}
                                    </p>
                                </div>

                                {/* Vehicle info */}
                                {report.carInfo && (report.carInfo.brand || report.carInfo.model || report.carInfo.year || report.carInfo.color) && (
                                    <div style={{ background: 'var(--surface-solid)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FaCar size={14} color="var(--primary)" />
                                            </div>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>Vehículo Involucrado</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {[
                                                { label: 'Marca', val: report.carInfo.brand },
                                                { label: 'Modelo', val: report.carInfo.model },
                                                { label: 'Año', val: report.carInfo.year },
                                                { label: 'Color', val: report.carInfo.color },
                                            ].filter(f => f.val).map(f => (
                                                <div key={f.label} style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.15rem' }}>{f.label}</div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>{f.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Right Column ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                {/* Map */}
                                <div style={{ background: 'var(--surface-solid)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem 1.25rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MapPin size={14} color="var(--primary)" />
                                            </div>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>Ubicación del Incidente</span>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps?q=${reportLocation.lat},${reportLocation.lng}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
                                        >
                                            <ExternalLink size={13} /> Ver en Maps
                                        </a>
                                    </div>
                                    <div className="modal-map-wrapper" style={{ margin: '0 0.75rem', borderRadius: '12px', overflow: 'hidden' }}>
                                        <MapContainer center={reportLocation} zoom={16} scrollWheelZoom={false} dragging={false} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                            <Marker position={reportLocation}>
                                                <Popup>{report.location?.address || 'Ubicación del incidente'}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                    <div style={{ padding: '0.75rem 1.25rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                        <MapPin size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            {report.location?.address || `${reportLocation.lat?.toFixed(6)}, ${reportLocation.lng?.toFixed(6)}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Moderator comment */}
                                {report.moderatorComment && (
                                    <div style={{
                                        borderRadius: '16px', overflow: 'hidden',
                                        border: `1px solid ${report.status === 'approved' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    }}>
                                        <div style={{ padding: '0.6rem 1rem', background: report.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: report.status === 'approved' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                                            <strong style={{ color: report.status === 'approved' ? '#059669' : '#dc2626', fontSize: '0.82rem', fontWeight: '800' }}>
                                                {report.status === 'approved' ? 'Comentario del moderador' : 'Motivo de rechazo'}
                                            </strong>
                                        </div>
                                        <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-solid)' }}>
                                            <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.9 }}>{report.moderatorComment}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Metadata (moderators only) */}
                                {isModerator && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Smartphone size={14} color="var(--primary)" />
                                            </div>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>Metadatos Técnicos</span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.15rem 0.5rem', borderRadius: '20px', fontWeight: '600' }}>Solo moderadores</span>
                                        </div>
                                        {renderMetadata()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer-modern">
                        {user?.role === 'moderator' && (report.status === 'pending' || report.status === 'In Process') && (
                            <div className="modal-footer-actions">
                                <button
                                    onClick={() => Swal.fire({
                                        title: '<h2 style="color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;"><div style="background: rgba(16, 185, 129, 0.15); color: var(--success); padding: 8px; border-radius: 50%; display: flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div> Aprobar Reporte</h2>',
                                        html: '<div style="color: var(--text-light); font-size: 0.95rem;">Ingresa un comentario o justificación:</div>',
                                        input: 'textarea', inputPlaceholder: 'Ej. Reporte muy útil y ubicación precisa.',
                                        showCancelButton: true, confirmButtonText: 'Confirmar Aprobación', cancelButtonText: 'Cancelar',
                                        customClass: { confirmButton: 'swal2-lumina-confirm swal2-confirm-success', cancelButton: 'swal2-lumina-cancel' },
                                        buttonsStyling: false, background: 'var(--surface-solid)', color: 'var(--text-main)',
                                        inputValidator: v => (!v?.trim()) && 'El comentario es obligatorio.'
                                    }).then(r => { if (r.isConfirmed) { isModerated.current = true; onModerate(report._id, 'approved', false, r.value); onClose(); } })}
                                    style={{ flex: 1, background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid var(--success)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    <Check size={18} /> Aprobar
                                </button>
                                <button
                                    onClick={() => Swal.fire({
                                        title: '<h2 style="color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;"><div style="background: rgba(239, 68, 68, 0.15); color: var(--error); padding: 8px; border-radius: 50%; display: flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div> Rechazar Reporte</h2>',
                                        html: '<div style="color: var(--text-light); font-size: 0.95rem;">Ingresa el motivo del rechazo:</div>',
                                        input: 'textarea', inputPlaceholder: 'Ej. La foto no es clara.',
                                        showCancelButton: true, confirmButtonText: 'Confirmar Rechazo', cancelButtonText: 'Cancelar',
                                        customClass: { confirmButton: 'swal2-lumina-confirm swal2-confirm-error', cancelButton: 'swal2-lumina-cancel' },
                                        buttonsStyling: false, background: 'var(--surface-solid)', color: 'var(--text-main)',
                                        inputValidator: v => (!v?.trim()) && 'El motivo es obligatorio.'
                                    }).then(r => { if (r.isConfirmed) { isModerated.current = true; onModerate(report._id, 'rejected', false, r.value); onClose(); } })}
                                    style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid var(--error)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    <X size={18} /> Rechazar
                                </button>
                                <button
                                    onClick={() => Swal.fire({
                                        title: '<h2 style="color: var(--text-main); margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;"><div style="background: rgba(245, 158, 11, 0.15); color: var(--warning); padding: 8px; border-radius: 50%; display: flex;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div> Sancionar Usuario</h2>',
                                        html: '<div style="color: var(--text-light); font-size: 0.95rem;">Este reporte es falso o malintencionado. Justifícalo:</div>',
                                        input: 'textarea', inputPlaceholder: 'Ej. Tercera vez subiendo imágenes de internet.',
                                        showCancelButton: true, confirmButtonText: 'Aplicar Sanción', cancelButtonText: 'Cancelar',
                                        customClass: { confirmButton: 'swal2-lumina-confirm swal2-confirm-warning', cancelButton: 'swal2-lumina-cancel' },
                                        buttonsStyling: false, background: 'var(--surface-solid)', color: 'var(--text-main)',
                                        inputValidator: v => (!v?.trim()) && 'La justificación es obligatoria.'
                                    }).then(r => { if (r.isConfirmed) { isModerated.current = true; onModerate(report._id, 'rejected', true, r.value); onClose(); } })}
                                    style={{ flex: 1, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: '1px solid var(--warning)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    <AlertTriangle size={18} /> Sancionar
                                </button>
                            </div>
                        )}
                        <div className="modal-close-wrapper">
                            <button onClick={onClose} className="modal-action-btn modal-action-btn-full">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReportDetailModal;
