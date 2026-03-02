import { Link, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { MapPin, Shield, Users, ArrowRight, Sun, Moon, Layers } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatMapLayer from '../components/HeatMapLayer';

// Create a custom pulsing icon for the map
const createPulseIcon = () => {
    return L.divIcon({
        className: 'custom-pulse-icon',
        html: '<div class="pulse-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const LandingPage = () => {
    const { user, loading } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [heatPoints, setHeatPoints] = useState([]);
    const [mapType, setMapType] = useState('standard'); // 'standard' or 'satellite'

    useEffect(() => {
        const fetchPublicReports = async () => {
            try {
                const res = await axios.get('/api/reports/public');
                // Map the full public payload including the popup info
                const points = res.data.map(report => ({
                    lat: report.location.lat,
                    lng: report.location.lng,
                    type: report.type,
                    description: report.description,
                    intensity: 1
                }));
                console.log("[DEBUG] Processed Heat Points on Landing Page:", points);
                setHeatPoints(points);
            } catch (err) {
                console.error("Error fetching heat map points:", err);
            }
        };

        fetchPublicReports();
    }, []);

    // If user is already logged in, redirect to dashboard
    if (!loading && user) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <MapPin size={24} className="brand-icon" />
                    <span>Vialidades</span>
                </div>
                <div className="nav-links">
                    <button onClick={toggleTheme} className="secondary" style={{ padding: '0.5rem', width: 'auto', border: 'none', background: 'transparent' }} title="Cambiar Tema">
                        {theme === 'dark' ? <Sun size={24} color="var(--text-main)" /> : <Moon size={24} color="var(--text-main)" />}
                    </button>
                    <Link to="/login" className="nav-btn login">Iniciar Sesión</Link>
                    <Link to="/register" className="nav-btn register">Registrarme</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1>Tu Comunidad, <span>Tu Seguridad Vial</span></h1>
                    <p>
                        <strong>Vialidades de Tránsito</strong> es la plataforma líder para reportar y monitorear incidentes viales en tiempo real.
                        Únete a miles de ciudadanos mejorando nuestras calles.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="cta-button">
                            Comenzar Ahora <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
                <div className="hero-image" style={{ position: 'relative', overflow: 'hidden', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column' }}>
                    {/* Premium Title Overlay - Now Outside the Map Area but inside the container */}
                    <div style={{
                        background: theme === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.9)',
                        padding: '1rem 1.5rem',
                        width: '100%',
                        zIndex: 2,
                        textAlign: 'center'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: theme === 'dark' ? 'white' : '#1e2025' }}>
                            Mapa de Incidentes
                        </h2>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Reportes ciudadanos activos en vivo
                        </p>
                    </div>

                    <MapContainer
                        center={[18.88, -70.4]} // Approximate center of Dominican Republic
                        zoom={8}                 // Slightly closer default zoom
                        minZoom={8}              // Prevent zooming out too far
                        maxBounds={[[17.0, -72.5], [20.5, -68.0]]} // Lock view to DR bounds
                        scrollWheelZoom={true}
                        zoomControl={true}
                        attributionControl={false}
                        style={{ flex: 1, width: '100%', minHeight: '400px', zIndex: 1, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f0f0f0' }}
                    >
                        {mapType === 'satellite' ? (
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            />
                        ) : theme === 'dark' ? (
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        ) : (
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                        )}

                        {heatPoints.length > 0 && <HeatMapLayer points={heatPoints} />}

                        {/* Map Type Toggle - Moved INSIDE the map container */}
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '10px',
                            zIndex: 1000,
                            display: 'flex',
                            gap: '4px',
                            padding: '4px'
                        }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMapType('standard'); }}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: mapType === 'standard' ? 'var(--primary)' : 'transparent',
                                    color: mapType === 'standard' ? 'white' : (mapType === 'satellite' ? 'white' : (theme === 'dark' ? 'white' : '#1e2025')),
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: mapType === 'standard' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                                    textShadow: mapType === 'satellite' ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'
                                }}
                            >
                                <MapPin size={14} /> Callejero
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMapType('satellite'); }}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: mapType === 'satellite' ? 'var(--primary)' : 'transparent',
                                    color: mapType === 'satellite' ? 'white' : (theme === 'dark' ? 'white' : '#1e2025'),
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: mapType === 'satellite' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                                }}
                            >
                                <Layers size={14} /> Satélite
                            </button>
                        </div>
                    </MapContainer>

                    {/* Small transparent overlay text to explain what they are seeing */}
                    <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '2rem', backdropFilter: 'blur(10px)', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'red', display: 'inline-block', boxShadow: '0 0 10px red' }}></span>
                        En Vivo
                    </div>
                </div>
            </header>

            {/* Features (Optional but adds to the "Web Page" feel) */}
            <section className="features-section">
                <div className="feature-card">
                    <div className="icon-bg"><MapPin size={24} /></div>
                    <h3>Reporta Incidentes</h3>
                    <p>Notifica accidentes, tráfico o peligros en la vía al instante.</p>
                </div>
                <div className="feature-card">
                    <div className="icon-bg"><Shield size={24} /></div>
                    <h3>Gana Reputación</h3>
                    <p>Contribuye con reportes veraces y sube de nivel en la comunidad.</p>
                </div>
                <div className="feature-card">
                    <div className="icon-bg"><Users size={24} /></div>
                    <h3>Evita el Tráfico</h3>
                    <p>Consulta el estado de las vías antes de salir de casa.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 Vialidades de Tránsito. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
