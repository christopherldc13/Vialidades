import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Calendar, Hash } from 'lucide-react';
import { FaCar, FaCarCrash, FaWater, FaRoad } from 'react-icons/fa';
import { BsSignStopFill } from 'react-icons/bs';
import { LuTriangleAlert } from 'react-icons/lu';
import { MdConstruction } from 'react-icons/md';
import { IoMdHelpCircle } from 'react-icons/io';

const TYPE_CONFIG = {
    Traffic:   { label: 'Tráfico Pesado',   icon: <FaCar />,           color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    Accident:  { label: 'Accidente',         icon: <FaCarCrash />,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    Violation: { label: 'Infracción',        icon: <BsSignStopFill />,  color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
    Hazard:    { label: 'Peligro en la vía', icon: <LuTriangleAlert />, color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
    RoadWork:  { label: 'Obra en la vía',    icon: <MdConstruction />,  color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
    Pothole:   { label: 'Bache peligroso',   icon: <FaRoad />,          color: '#78716c', bg: 'rgba(120,113,108,0.12)' },
    Flood:     { label: 'Inundación',        icon: <FaWater />,         color: '#0284c7', bg: 'rgba(2,132,199,0.12)'   },
    Other:     { label: 'Otro',              icon: <IoMdHelpCircle />,  color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const createPinIcon = (color) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
            fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`;
    return L.divIcon({
        className: '',
        html: svg,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -44],
    });
};

const IncidentPopup = ({ p }) => {
    const cfg = TYPE_CONFIG[p.type] || TYPE_CONFIG.Other;
    const date = formatDate(p.timestamp);

    return (
        <div style={{
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            width: '240px',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '10px',
        }}>
            {/* Color accent bar */}
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

            <div style={{ padding: '12px 14px 10px' }}>
                {/* Type badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: cfg.bg, borderRadius: '8px',
                    padding: '4px 9px', marginBottom: '8px',
                }}>
                    <span style={{ color: cfg.color, fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                        {cfg.icon}
                    </span>
                    <span style={{ color: cfg.color, fontWeight: '700', fontSize: '0.8rem' }}>
                        {cfg.label}
                    </span>
                </div>

                {/* Description */}
                <p style={{
                    margin: '0 0 10px 0',
                    fontSize: '0.82rem',
                    color: '#374151',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {p.description || 'Sin descripción proporcionada.'}
                </p>

                {/* Divider */}
                <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 8px' }} />

                {/* Meta info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {p.address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <MapPin size={11} color={cfg.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{
                                fontSize: '0.73rem', color: '#6b7280', lineHeight: '1.4',
                                display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {p.address}
                            </span>
                        </div>
                    )}
                    {date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={11} color={cfg.color} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>{date}</span>
                        </div>
                    )}
                    {p.reportNumber && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Hash size={11} color={cfg.color} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.73rem', color: '#6b7280', fontFamily: 'monospace', fontWeight: '600' }}>
                                VTI{String(p.reportNumber).padStart(4, '0')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const HeatMapLayer = ({ points }) => {
    if (!points || points.length === 0) return null;

    return (
        <>
            {points.map((p, index) => {
                const color = (TYPE_CONFIG[p.type] || TYPE_CONFIG.Other).color;
                return (
                    <Marker
                        key={index}
                        position={[p.lat, p.lng]}
                        icon={createPinIcon(color)}
                    >
                        <Popup className="landing-map-popup" maxWidth={260} minWidth={240}>
                            <IncidentPopup p={p} />
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default HeatMapLayer;
