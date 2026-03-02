import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create a custom pulsing icon for the map incidents
const createPulseIcon = () => {
    return L.divIcon({
        className: 'custom-pulse-icon',
        html: '<div class="pulse-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const HeatMapLayer = ({ points }) => {
    if (!points || points.length === 0) return null;

    console.log("[DEBUG] HeatMapLayer mounting with", points.length, "pulsing Marker blobs");

    return (
        <>
            {points.map((p, index) => (
                <Marker
                    key={index}
                    position={[p.lat, p.lng]}
                    icon={createPulseIcon()}
                >
                    <Popup className="landing-map-popup">
                        <div style={{ padding: '5px', maxWidth: '250px' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#ff4d4d', fontWeight: 'bold' }}>
                                {p.type}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: '1.4' }}>
                                {p.description || "Sin descripción proporcionada."}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default HeatMapLayer;
