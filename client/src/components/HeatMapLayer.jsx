import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const TYPE_COLORS = {
    Traffic: '#f59e0b',
    Accident: '#ef4444',
    Violation: '#6366f1',
    Hazard: '#f97316',
    Other: '#64748b',
};

const TYPE_LABELS = {
    Traffic: 'Tráfico Pesado',
    Accident: 'Accidente',
    Violation: 'Infracción',
    Hazard: 'Peligro en la vía',
    Other: 'Otro',
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
        popupAnchor: [0, -40],
    });
};

const HeatMapLayer = ({ points }) => {
    if (!points || points.length === 0) return null;

    return (
        <>
            {points.map((p, index) => {
                const color = TYPE_COLORS[p.type] || '#64748b';
                const label = TYPE_LABELS[p.type] || p.type;
                return (
                    <Marker
                        key={index}
                        position={[p.lat, p.lng]}
                        icon={createPinIcon(color)}
                    >
                        <Popup className="landing-map-popup">
                            <div style={{ padding: '5px', maxWidth: '250px' }}>
                                <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', color, fontWeight: 'bold' }}>
                                    {label}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: '1.4' }}>
                                    {p.description || "Sin descripción proporcionada."}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default HeatMapLayer;
