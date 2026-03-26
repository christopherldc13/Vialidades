import { Link, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { Shield, Users, ArrowRight, Sun, Moon, Layers, MessageSquare, Send, Mail, User as UserIcon } from 'lucide-react';
import { CiLocationOn } from "react-icons/ci";
import { LiaSatelliteSolid } from "react-icons/lia";
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatMapLayer from '../components/HeatMapLayer';
import ModerationTimeline from '../components/ModerationTimeline';

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

    // Suggestions Form State
    const [suggestionForm, setSuggestionForm] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [sendingSuggestion, setSendingSuggestion] = useState(false);

    const handleSuggestionChange = (e) => {
        setSuggestionForm({ ...suggestionForm, [e.target.name]: e.target.value });
    };

    const handleSuggestionSubmit = async (e) => {
        e.preventDefault();
        setSendingSuggestion(true);

        try {
            await axios.post('/api/suggestions', suggestionForm);
            
            setSendingSuggestion(false);
            setSuggestionForm({ name: '', email: '', message: '' });
            
            Swal.fire({
                title: '¡Sugerencia Enviada!',
                text: 'Gracias por ayudarnos a mejorar Vialidades.',
                icon: 'success',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal2-lumina-popup',
                    title: 'swal2-lumina-title'
                }
            });
            
        } catch (err) {
            console.error("Error submitting suggestion:", err);
            setSendingSuggestion(false);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.msg || 'No se pudo enviar la sugerencia. Inténtalo de nuevo más tarde.',
                confirmButtonColor: 'var(--error)'
            });
        }
    };

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
                    <CiLocationOn size={28} className="brand-icon" style={{ color: 'var(--primary)' }} />
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
                                style={{ flex: 1, width: '100%', height: '100%', zIndex: 1 }}
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
                                    background: theme === 'dark' ? 'linear-gradient(to top, transparent, transparent)' : 'linear-gradient(to top, transparent, transparent)', // Removed solid fade
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
                                        <CiLocationOn size={16} /> Callejero
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
                                        <LiaSatelliteSolid size={18} /> Satélite
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

            {/* Moderation Flow Timeline with background Glow */}
            <section style={{ position: 'relative', zIndex: 10, background: 'transparent', padding: '1rem 0', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>
                <ModerationTimeline />
            </section>

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
                    <div className="icon-bg"><CiLocationOn size={24} /></div>
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

            {/* Suggestions Section - Premium Refinement */}
            <section style={{ padding: '8rem 1.5rem', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
                {/* Dynamic Background Glows */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-5%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>

                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="form-split-grid">
                        
                        {/* Left Side: Branding & Copy */}
                        <motion.div
                            className="form-split-left"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.75rem', 
                                padding: '0.6rem 1.2rem', 
                                background: 'rgba(99, 102, 241, 0.1)', 
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '99px',
                                color: 'var(--primary)',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                marginBottom: '2.5rem'
                            }}>
                                <MessageSquare size={18} /> Feedback Comunitario
                            </div>
                            
                            <h2 style={{ 
                                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
                                fontWeight: '900', 
                                lineHeight: '1.1', 
                                marginBottom: '1.5rem', 
                                color: 'var(--text-main)',
                                letterSpacing: '-0.02em'
                            }}>
                                Construyamos un mejor <span style={{ color: 'var(--primary)' }}>tránsito</span> juntos.
                            </h2>
                            
                            <p style={{ 
                                fontSize: '1.25rem', 
                                color: 'var(--text-light)', 
                                lineHeight: '1.6', 
                                marginBottom: '3rem',
                                maxWidth: '480px'
                            }}>
                                Tu experiencia diaria es la clave para identificar problemas y proponer soluciones innovadoras. Envíanos tu sugerencia ahora.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {[
                                    { label: 'Identifica Mejores Vías', icon: <CiLocationOn /> },
                                    { label: 'Propón Nuevas Reglas', icon: <Shield /> },
                                    { label: 'Sintoniza la Comunidad', icon: <Users /> }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>
                                        <div style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            borderRadius: '12px', 
                                            background: 'var(--surface)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'var(--primary)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right Side: The Form Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="card" style={{ 
                                padding: 'clamp(2rem, 5vw, 4rem)',
                                borderRadius: '40px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)',
                                backdropFilter: 'blur(20px)',
                                position: 'relative'
                            }}>
                                {/* Decorative Gradient Border effect */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '4px',
                                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                                    borderRadius: '40px 40px 0 0'
                                }}></div>

                                <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem', display: 'block' }}>Nombre Completo</label>
                                            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                                                <UserIcon size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={suggestionForm.name}
                                                    onChange={handleSuggestionChange}
                                                    required
                                                    placeholder="Ej: Juan Pérez"
                                                    style={{ 
                                                        height: '58px', 
                                                        paddingLeft: '3.5rem', 
                                                        background: 'var(--bg-input)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '16px',
                                                        fontSize: '1rem',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem', display: 'block' }}>Correo Electrónico</label>
                                            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                                                <Mail size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={suggestionForm.email}
                                                    onChange={handleSuggestionChange}
                                                    required
                                                    placeholder="ejemplo@correo.com"
                                                    style={{ 
                                                        height: '58px', 
                                                        paddingLeft: '3.5rem', 
                                                        background: 'var(--bg-input)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '16px',
                                                        fontSize: '1rem',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem', display: 'block' }}>Tu Sugerencia</label>
                                        <textarea 
                                            name="message"
                                            value={suggestionForm.message}
                                            onChange={handleSuggestionChange}
                                            required
                                            placeholder="Descríbenos tu idea para mejorar Vialidades..." 
                                            style={{ 
                                                minHeight: '180px', 
                                                padding: '1.5rem', 
                                                borderRadius: '20px', 
                                                background: 'var(--bg-input)', 
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-main)',
                                                fontFamily: 'inherit',
                                                fontSize: '1.05rem',
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                resize: 'vertical',
                                                lineHeight: '1.6'
                                            }}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={sendingSuggestion}
                                        style={{ 
                                            height: '64px',
                                            borderRadius: '20px', 
                                            background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                                            color: 'white',
                                            fontWeight: '800',
                                            fontSize: '1.1rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 12px 30px -10px rgba(99, 102, 241, 0.5)'
                                        }}
                                        className="cta-button"
                                    >
                                        {sendingSuggestion ? 'Enviando...' : (
                                            <>
                                                Enviar Sugerencia <Send size={22} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
