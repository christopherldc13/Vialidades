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

const DraggableMap = ({ location, setLocation, setAddress }) => {
    // Default to a central location (Dominican Republic)
    const [center, setCenter] = useState({ lat: 18.7357, lng: -70.1627 });
    const [zoom, setZoom] = useState(8);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Reverse Geocoding Function
    const fetchAddress = async (lat, lng) => {
        if (!setAddress) return;
        try {
            // Nominatim OpenStreetMap API (Free)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
                // Construct a cleaner address
                const addr = data.address;
                const road = addr.road || addr.pedestrian || addr.street || '';
                const neighborhood = addr.neighbourhood || addr.suburb || '';
                const city = addr.city || addr.town || addr.village || '';
                const state = addr.state || '';

                const parts = [road, neighborhood, city, state].filter(p => p).join(', ');
                setAddress(parts || data.display_name);
            }
        } catch (err) {
            console.error("Geocoding failed", err);
        }
    };

    const updateLocation = (coords) => {
        const newPos = { lat: coords.latitude || coords.lat, lng: coords.longitude || coords.lng };
        setCenter(newPos);
        setLocation(newPos);
        setZoom(16);
        setLoadingLocation(false);
        fetchAddress(newPos.lat, newPos.lng);
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
                fetchAddress(newPos.lat, newPos.lng); // Fetch address for IP location too
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

    // Update address when manual pin drop happens
    const handleSetLocation = (newPos) => {
        setLocation(newPos);
        fetchAddress(newPos.lat, newPos.lng);
    };

    // Search Functionality
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);

    const handleSearchInput = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await res.json();
                setSearchResults(data);
                setShowResults(true);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 1000); // Debounce 1s to be kind to Nominatim API
    };

    const handleSelectResult = (result) => {
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setCenter(newPos);
        setLocation(newPos);
        setZoom(16);
        setAddress(result.display_name);
        setSearchQuery(result.display_name);
        setShowResults(false);
    };

    return (
        <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', marginBottom: '0.5rem', zIndex: 401 }}>
               <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInput}
                    placeholder="Buscar ubicación..."
                    onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        paddingRight: '2.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                />
                 {isSearching && (
                    <div style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.8rem',
                        color: '#94a3b8'
                    }}>
                        ⌛
                    </div>
                )}
                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <ul style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        listStyle: 'none',
                        padding: 0,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {searchResults.map((result, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelectResult(result)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    borderBottom: index < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    fontSize: '0.9rem',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                                {result.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ height: '300px', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '2px solid #e2e8f0', position: 'relative', zIndex: 1 }}>
                <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} key={`${center.lat}-${center.lng}`}>
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <LocationMarker position={location || center} setPosition={handleSetLocation} />
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
        </div>
    );
};

export default DraggableMap;
