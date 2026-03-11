import { Link, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { MapPin, Shield, Users, ArrowRight, Sun, Moon, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
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
            <motion.nav
                className="landing-nav"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
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
            </motion.nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-glow"></div>
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <Shield size={16} /> Plataforma Ciudadana 2.0
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >Tu Comunidad, <span>Tu Seguridad Vial</span></motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <strong>Vialidades de Tránsito</strong> es la plataforma más avanzada para reportar y monitorear incidentes viales en tiempo real.
                        Únete a miles de ciudadanos mejorando la movilidad de nuestra ciudad.
                    </motion.p>
                    <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <Link to="/register" className="cta-button">
                            Comenzar Ahora <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="hero-image"
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                    <div className="map-showcase">
                        <div className="map-showcase-inner">
                            <MapContainer
                                center={[18.88, -70.4]} // Approximate center of Dominican Republic
                                zoom={8}
                                minZoom={8}
                                maxBounds={[[17.0, -72.5], [20.5, -68.0]]}
                                scrollWheelZoom={true}
                                zoomControl={false} // Disable default controls to look cleaner
                                attributionControl={false}
                                style={{ flex: 1, width: '100%', height: '100%', zIndex: 1, backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f8fafc' }}
                            >
                                {mapType === 'satellite' ? (
                                    <TileLayer
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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

                                {/* Overlay Gradient to fade map into background slowly */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '150px',
                                    background: theme === 'dark' ? 'linear-gradient(to top, rgba(10,10,10,1), transparent)' : 'linear-gradient(to top, rgba(248,250,252,1), transparent)',
                                    pointerEvents: 'none',
                                    zIndex: 5
                                }}></div>

                                {/* Map Type Toggle */}
                                <div style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    zIndex: 1000,
                                    display: 'flex',
                                    gap: '8px',
                                    padding: '6px',
                                    background: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '12px',
                                    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                                }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMapType('standard'); }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: mapType === 'standard' ? 'var(--primary)' : 'transparent',
                                            color: mapType === 'standard' ? 'white' : (theme === 'dark' ? 'white' : '#1e2025'),
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <MapPin size={14} /> Callejero
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMapType('satellite'); }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: mapType === 'satellite' ? 'var(--primary)' : 'transparent',
                                            color: mapType === 'satellite' ? 'white' : (theme === 'dark' ? 'white' : '#1e2025'),
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Layers size={14} /> Satélite
                                    </button>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '24px',
                                    right: '24px',
                                    zIndex: 10,
                                    background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '2rem',
                                    backdropFilter: 'blur(10px)',
                                    color: theme === 'dark' ? 'white' : '#1e2025',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 10px #ef4444' }}></span>
                                    Radio Activos
                                </div>
                            </MapContainer>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Features (Optional but adds to the "Web Page" feel) */}
            <section className="features-section">
                <motion.div
                    className="feature-card"
                    whileHover={{ y: -10, scale: 1.02 }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="icon-bg"><MapPin size={24} /></div>
                    <h3>Reporta Incidentes</h3>
                    <p>Notifica accidentes, tráfico o peligros en la vía al instante.</p>
                </motion.div>
                <motion.div
                    className="feature-card"
                    whileHover={{ y: -10, scale: 1.02 }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="icon-bg"><Shield size={24} /></div>
                    <h3>Gana Reputación</h3>
                    <p>Contribuye con reportes veraces y sube de nivel en la comunidad.</p>
                </motion.div>
                <motion.div
                    className="feature-card"
                    whileHover={{ y: -10, scale: 1.02 }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="icon-bg"><Users size={24} /></div>
                    <h3>Evita el Tráfico</h3>
                    <p>Consulta el estado de las vías antes de salir de casa.</p>
                </motion.div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 Vialidades de Tránsito. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
