import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { X, Calendar, User, Info, Smartphone, Clock } from 'lucide-react';
import { CiLocationOn } from "react-icons/ci";
import { motion, AnimatePresence } from 'framer-motion';
import MediaGallery from './MediaGallery';
import { FaCar, FaCarCrash } from "react-icons/fa";
import { BsSignStopFill } from "react-icons/bs";
import { LuTriangleAlert } from "react-icons/lu";
import { IoMdHelpCircle } from "react-icons/io";

const getIncidentIcon = (type) => {
    switch (type) {
        case 'Traffic': return <FaCar />;
        case 'Accident': return <FaCarCrash />;
        case 'Violation': return <BsSignStopFill />;
        case 'Hazard': return <LuTriangleAlert />;
        default: return <IoMdHelpCircle />;
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

const ReportDetailModal = ({ report, isOpen, onClose, isModerator }) => {
    const [showRawMetadata, setShowRawMetadata] = useState({});

    if (!isOpen || !report) return null;

    const reportLocation = report.location || { lat: 18.7357, lng: -70.1627 };
    
    // Metadata helper to extract useful info
    const renderMetadata = () => {
        if (!isModerator || !report.media) return null;

        const allMetadata = report.media.map(m => m.metadata).filter(m => m && Object.keys(m).length > 0);
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
                                background: report.status === 'pending' ? 'var(--warning)' : report.status === 'approved' ? 'var(--success)' : 'var(--error)',
                                color: 'white', textTransform: 'uppercase'
                            }}>
                                {report.status === 'pending' ? 'Pendiente' : report.status === 'approved' ? 'Aprobado' : 'Rechazado'}
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
                        <button onClick={onClose} className="modal-action-btn">
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReportDetailModal;
