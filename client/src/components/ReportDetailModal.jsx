import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { X, Calendar, User, Info, Smartphone, Clock, MapPin } from 'lucide-react';
import { CiLocationOn } from "react-icons/ci";
import { motion, AnimatePresence } from 'framer-motion';
import MediaGallery from './MediaGallery';
import { FaCar, FaCarCrash } from "react-icons/fa";
import { BsSignStopFill } from "react-icons/bs";
import { LuTriangleAlert } from "react-icons/lu";
import { IoMdHelpCircle } from "react-icons/io";
import { AlertTriangle, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';


const getIncidentIcon = (type) => {
    switch (type) {
        case 'Traffic': return <FaCar />;
        case 'Accident': return <FaCarCrash />;
        case 'Violation': return <BsSignStopFill />;
        case 'Hazard': return <LuTriangleAlert />;
        default: return <IoMdHelpCircle />;
    }
};

const getStatusLabel = (status, wasSanctioned) => {
    if (wasSanctioned) return 'SANCIONADO';
    switch (status) {
        case 'pending': return 'PENDIENTE';
        case 'approved': return 'APROBADO';
        case 'rejected': return 'RECHAZADO';
        case 'In Process': return 'EN PROCESO';
        default: return status?.toUpperCase();
    }
};

const getIncidentLabel = (type) => {
    switch (type) {
        case 'Traffic': return 'Tráfico Pesado';
        case 'Accident': return 'Accidente';
        case 'Violation': return 'Infracción';
        case 'Hazard': return 'Peligro en la vía';
        default: return type;
    }
};

// Fix for default marker icon in React Leaflet
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ReportDetailModal = ({ report, onClose, onModerate, user }) => {
    const [showRawMetadata, setShowRawMetadata] = useState({});
    const isModerator = user?.role === 'moderator' || user?.role === 'admin';

    const isModerated = useRef(false);

    useEffect(() => {
        // Modal instance active
    }, []);

    if (!report) return null;

    const reportLocation = report.location || { lat: 18.7357, lng: -70.1627 };

    // Metadata helper to extract useful info
    const renderMetadata = () => {
        if (!isModerator || !report?.media) return null;

        const allMetadata = (report.media || []).map(m => m.metadata).filter(m => m && Object.keys(m).length > 0);
        if (allMetadata.length === 0) return (
            <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                Sin metadatos técnicos disponibles.
            </div>
        );

        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                {report.media.map((item, idx) => {
                    const meta = item.metadata || {};
                    if (Object.keys(meta).length === 0) return null;

                    const toggleRaw = () => {
                        setShowRawMetadata(prev => ({ ...prev, [idx]: !prev[idx] }));
                    };

                    // Robust Device Info
                    const deviceModel = meta.image_metadata?.Model || meta.exif?.Model || meta.image_metadata?.Make || meta.exif?.Make || 'Desconocido';

                    // GPS Info
                    const hasGPS = meta.gps || meta.exif?.GPSLatitude || meta.image_metadata?.GPSLatitude;

                    return (
                        <div key={idx} style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    <Info size={18} /> Multimedia #{idx + 1} ({item.type})
                                </div>
                                <button
                                    onClick={toggleRaw}
                                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                                >
                                    {showRawMetadata[idx] ? 'Ocultar Datos Crudos' : 'Ver Datos Crudos'}
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                                {/* Technical Info */}
                                {meta.info && (
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <strong>Formato:</strong> <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{meta.info.format?.toUpperCase()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <strong>Resolución:</strong> <span style={{ fontWeight: '600' }}>{meta.info.width}x{meta.info.height}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <strong>Peso:</strong> <span style={{ fontWeight: '600' }}>{(meta.info.size / 1024).toFixed(2)} KB</span>
                                        </div>
                                    </div>
                                )}

                                {/* Device & GPS */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Smartphone size={16} color="var(--primary)" />
                                    <span><strong>Móvil:</strong> {deviceModel}</span>
                                </div>

                                {hasGPS && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={16} color="#ef4444" />
                                        <span style={{ color: '#ef4444', fontWeight: '600' }}>Ubicación GPS Detectada</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={16} color="var(--text-light)" />
                                    <span><strong>Captura:</strong> {meta.image_metadata?.DateTimeOriginal || meta.exif?.DateTimeOriginal || 'N/A'}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} color="var(--text-light)" />
                                    <span><strong>Subida:</strong> {new Date(report.timestamp).toLocaleString()}</span>
                                </div>

                                {showRawMetadata[idx] && (
                                    <div style={{
                                        gridColumn: '1 / -1', marginTop: '1rem', padding: '1rem',
                                        background: 'var(--bg-input)', color: 'var(--text-light)',
                                        borderRadius: '12px', fontSize: '0.75rem', overflow: 'auto',
                                        maxHeight: '200px', border: '1px solid var(--border-color)'
                                    }}>
                                        <pre style={{ margin: 0 }}>{JSON.stringify(meta, null, 2)}</pre>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-overlay-modern"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="modal-container-modern"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="modal-header-modern">
                        <div>
                            <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: '1.2' }}>Detalles del Reporte</h2>
                            <span style={{
                                display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.75rem',
                                borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800',
                                background: report.status === 'pending' ? 'var(--warning)' : report.status === 'approved' ? 'var(--success)' : report.status === 'In Process' ? 'var(--primary)' : 'var(--error)',
                                color: 'white', textTransform: 'uppercase'
                            }}>
                                {getStatusLabel(report.status, report.wasSanctioned)}
                            </span>
                        </div>
                        <button onClick={onClose} className="modal-close-btn">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="modal-body-modern custom-scrollbar">
                        <div className="modal-grid-modern">

                            {/* Left Column: Media and Description */}
                            <div>
                                <div className="modal-media-wrapper">
                                    <MediaGallery media={report.media && report.media.length > 0 ? report.media : (report.photos || [])} objectFit="contain" />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Reportado por</div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{report.userId?.username || 'Usuario'}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Fecha</div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{new Date(report.timestamp).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span style={{ color: 'var(--primary)', display: 'flex' }}>
                                            {getIncidentIcon(report.type)}
                                        </span>
                                        {getIncidentLabel(report.type)}
                                    </h3>
                                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                                        {report.description}
                                    </p>
                                </div>

                                {/* Vehicle Information Section */}
                                {report.carInfo && (report.carInfo.brand || report.carInfo.model || report.carInfo.year || report.carInfo.color) && (
                                    <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '700', fontSize: '1rem' }}>
                                            <FaCar size={18} style={{ color: 'var(--primary)' }} /> Detalles del Vehículo
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                            {report.carInfo.brand && (
                                                <div>
                                                    <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Marca</span>
                                                    <span style={{ fontWeight: '600' }}>{report.carInfo.brand}</span>
                                                </div>
                                            )}
                                            {report.carInfo.model && (
                                                <div>
                                                    <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Modelo</span>
                                                    <span style={{ fontWeight: '600' }}>{report.carInfo.model}</span>
                                                </div>
                                            )}
                                            {report.carInfo.year && (
                                                <div>
                                                    <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Año</span>
                                                    <span style={{ fontWeight: '600' }}>{report.carInfo.year}</span>
                                                </div>
                                            )}
                                            {report.carInfo.color && (
                                                <div>
                                                    <span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.75rem' }}>Color</span>
                                                    <span style={{ fontWeight: '600' }}>{report.carInfo.color}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Mini-Map and Metadata */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Mini Map */}
                                <div>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '700', fontSize: '1.05rem' }}>
                                        <CiLocationOn size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} /> Ubicación del Incidente
                                    </h4>
                                    <div className="modal-map-wrapper">
                                        <MapContainer
                                            center={reportLocation}
                                            zoom={16}
                                            scrollWheelZoom={false}
                                            dragging={false}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; Esri'
                                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                            />
                                            <Marker position={reportLocation}>
                                                <Popup>{report.location?.address || 'Ubicación'}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                        <CiLocationOn size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} /> <strong>Dirección:</strong> {report.location?.address || `Coords: ${reportLocation.lat.toFixed(6)}, ${reportLocation.lng.toFixed(6)}`}
                                    </p>
                                </div>

                                {/* Metadata Section (Moderator Only) */}
                                {isModerator && (
                                    <div>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-light)' }}>
                                            <Smartphone size={18} /> Metadatos Técnicos (Solo Moderadores)
                                        </h4>
                                        {renderMetadata()}
                                    </div>
                                )}

                                {/* Moderator Comment if exists */}
                                {report.moderatorComment && (
                                    <div style={{
                                        background: report.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        borderLeft: `5px solid ${report.status === 'approved' ? 'var(--success)' : 'var(--error)'}`,
                                        padding: '1.25rem', borderRadius: '12px'
                                    }}>
                                        <strong style={{ color: report.status === 'approved' ? 'var(--success)' : 'var(--error)', display: 'block', marginBottom: '0.5rem' }}>
                                            Comentario del Moderador:
                                        </strong>
                                        <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>{report.moderatorComment}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer-modern">
                        {user?.role === 'moderator' && (report.status === 'pending' || report.status === 'In Process') && (
                            <div className="modal-footer-actions">
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
                                                isModerated.current = true;
                                                onModerate(report._id, 'approved', false, result.value);
                                                onClose();
                                            }
                                        });
                                    }}
                                    style={{
                                        flex: 1, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)',
                                        border: '1px solid var(--success)', padding: '0.75rem 1rem', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
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
                                                isModerated.current = true;
                                                onModerate(report._id, 'rejected', false, result.value);
                                                onClose();
                                            }
                                        });
                                    }}
                                    style={{
                                        flex: 1, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)',
                                        border: '1px solid var(--error)', padding: '0.75rem 1rem', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
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
                                                isModerated.current = true;
                                                onModerate(report._id, 'rejected', true, result.value);
                                                onClose();
                                            }
                                        });
                                    }}
                                    style={{
                                        flex: 1, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)',
                                        border: '1px solid var(--warning)', padding: '0.75rem 1rem', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    title="Sancionar Usuario"
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
