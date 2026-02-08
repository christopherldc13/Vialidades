import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in React Leaflet
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks and draggability
const LocationMarker = ({ position, setPosition }) => {
    const markerRef = useRef(null);
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    setPosition(marker.getLatLng());
                }
            },
        }),
        [setPosition],
    );

    return position === null ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Popup>Estás aquí. Arrastra para ajustar.</Popup>
        </Marker>
    );
};

const DraggableMap = ({ location, setLocation }) => {
    // Default to a central location (Dominican Republic)
    const [center, setCenter] = useState({ lat: 18.7357, lng: -70.1627 });
    const [zoom, setZoom] = useState(8);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const updateLocation = (coords) => {
        const newPos = { lat: coords.latitude, lng: coords.longitude };
        setCenter(newPos);
        setLocation(newPos);
        setZoom(16);
        setLoadingLocation(false);
    };

    const fetchIpLocation = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data.latitude && data.longitude) {
                const newPos = { lat: data.latitude, lng: data.longitude };
                setCenter(newPos);
                setLocation(newPos);
                setZoom(13);
                // Inform the user that this is just an approximation
                alert("⚠️ Sin señal GPS. Mostrando zona aproximada por internet. Por favor arrastra el pin 📍 a tu ubicación exacta.");
            }
        } catch (ipError) {
            console.error("IP Geolocation failed:", ipError);
            alert("No se pudo determinar la ubicación. Por favor selecciónala manualmente en el mapa.");
        }
        setLoadingLocation(false);
    };

    const getLocation = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            // 1. Try High Accuracy (GPS)
            navigator.geolocation.getCurrentPosition(
                (position) => updateLocation(position.coords),
                (error) => {
                    console.warn("High accuracy GPS failed, trying low accuracy...", error);
                    // 2. Try Low Accuracy (Wifi/Cells) - Better than IP, works indoors
                    navigator.geolocation.getCurrentPosition(
                        (position) => updateLocation(position.coords),
                        (errorLow) => {
                            console.warn("Low accuracy GPS failed, trying IP...", errorLow);
                            // 3. Fallback to IP
                            fetchIpLocation();
                        },
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
                    );
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
            fetchIpLocation();
        }
    };

    // Initial location fetch
    useEffect(() => {
        getLocation();
    }, []); // Run only once on mount

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '2px solid #e2e8f0', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} key={`${center.lat}-${center.lng}`}>
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <LocationMarker position={location || center} setPosition={setLocation} />
            </MapContainer>

            <button
                type="button"
                onClick={getLocation}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 400,
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    background: 'white',
                    color: 'var(--primary)',
                    border: '2px solid white',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                {loadingLocation ? '📍 Ubicando...' : '📍 Ubícame'}
            </button>
        </div>
    );
};

export default DraggableMap;
