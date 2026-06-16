import { Link, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { Shield, Users, ArrowRight, Sun, Moon, Layers, MessageSquare, Send, Mail, User as UserIcon, Database, PenLine, BadgeCheck, ShieldCheck, Gavel, FileText, Camera, UserX, LifeBuoy, ChevronRight, Lightbulb, Wrench, Bug, Sparkles, Lock } from 'lucide-react';
import { CiLocationOn } from "react-icons/ci";
import { LiaSatelliteSolid } from "react-icons/lia";
import { motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatMapLayer from '../components/HeatMapLayer';
import ModerationTimeline from '../components/ModerationTimeline';
import Navbar from '../components/Navbar';

const LANDING_RULES = [
    {
        Icon: Database,
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
        title: 'Datos Personales',
        subtitle: 'Recopilación y Tratamiento',
        points: [
            'Recopilamos nombre, cédula, teléfono y correo para verificar tu identidad.',
            'Tus datos biométricos no se comparten con terceros y se almacenan cifrados.',
            'Solo usamos tu información para verificar identidad y prevenir fraudes.',
        ],
    },
    {
        Icon: PenLine,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        title: 'Contenido Responsable',
        subtitle: 'Responsabilidad del Usuario',
        points: [
            'Eres el único responsable de los reportes e imágenes que publiques.',
            'La información debe ser veraz y corresponder a situaciones reales.',
            'El contenido falso puede resultar en suspensión permanente de la cuenta.',
        ],
    },
    {
        Icon: Camera,
        color: '#dc2626',
        gradient: 'linear-gradient(135deg, #dc2626, #6366f1)',
        title: 'Derecho a la Imagen',
        subtitle: 'Protección de imagen y datos',
        sections: [
            {
                law: 'Ley 192-19',
                color: '#dc2626',
                label: 'Protección de imagen',
                points: [
                    'Prohibido publicar imágenes de fallecidos o heridos sin autorización.',
                    'Vialidades elimina sin aviso contenido que viole esta ley.',
                ],
            },
            {
                law: 'Ley 172-13',
                color: '#6366f1',
                label: 'Protección de datos',
                points: [
                    'Puedes solicitar la eliminación de tu imagen o datos personales.',
                    'Tienes derecho al olvido en cualquier momento.',
                ],
            },
        ],
    },
    {
        Icon: BadgeCheck,
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #34d399)',
        title: 'Veracidad de Reportes',
        subtitle: 'Información Auténtica',
        points: [
            'Solo reporta incidentes que hayas presenciado directamente.',
            'Los reportes falsos serán eliminados y notificados a las autoridades.',
            'Está prohibida la suplantación de identidad y uso de documentos falsos.',
        ],
    },
    {
        Icon: ShieldCheck,
        color: '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
        title: 'Seguridad y Privacidad',
        subtitle: 'Protección de Datos',
        points: [
            'Tu contraseña se almacena con cifrado bcrypt y nunca es visible.',
            'Las sesiones se gestionan con tokens JWT de tiempo limitado.',
            'Puedes solicitar la eliminación de tus datos en cualquier momento.',
        ],
    },
    {
        Icon: Gavel,
        color: '#f43f5e',
        gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)',
        title: 'Sanciones',
        subtitle: 'Sistema de Moderación',
        points: [
            'Los reportes falsos repetidos generan sanciones acumulativas.',
            'El comportamiento abusivo puede resultar en inhabilitación permanente.',
            'Evadir restricciones creando cuentas adicionales está prohibido.',
        ],
    },
];

const LandingPage = () => {
    const { user, loading } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const [heatPoints, setHeatPoints] = useState([]);
    const [mapType, setMapType] = useState('standard');

    // Suggestions Form State
    const [suggestionForm, setSuggestionForm] = useState({
        name: '',
        email: '',
        message: '',
        category: 'idea'
    });
    const [sendingSuggestion, setSendingSuggestion] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

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
                console.log("[DEBUG] Raw API response:", res.data.length, "reportes:", res.data);
                const points = res.data
                    .filter(r => r.location?.lat != null && r.location?.lng != null)
                    .map(report => ({
                        lat: parseFloat(report.location.lat),
                        lng: parseFloat(report.location.lng),
                        type: report.type,
                        description: report.description,
                        address: report.location?.address || null,
                        timestamp: report.timestamp || null,
                        reportNumber: report.reportNumber || null,
                        intensity: 1
                    }))
                    .filter(p => !isNaN(p.lat) && !isNaN(p.lng));
                console.log("[DEBUG] Puntos válidos en mapa:", points.length, points);
                setHeatPoints(points);
            } catch (err) {
                console.error("Error fetching heat map points:", err);
            }
        };

        fetchPublicReports();

        const socket = io(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : ''));

        socket.on('new_report', (report) => {
            if (!report?.location?.lat || !report?.location?.lng) return;
            const lat = parseFloat(report.location.lat);
            const lng = parseFloat(report.location.lng);
            if (isNaN(lat) || isNaN(lng)) return;
            setHeatPoints(prev => [...prev, { lat, lng, type: report.type, description: report.description, address: report.location?.address || null, timestamp: report.timestamp || null, reportNumber: report.reportNumber || null, intensity: 1 }]);
        });

        return () => socket.disconnect();
    }, []);

    // Redirigir según el rol
    if (!loading && user) {
        return <Navigate to={user.role === 'supermoderador' ? '/supermoderador' : '/dashboard'} />;
    }

    return (
        <div className="landing-container">
            <Navbar />

            {/* Hero Section */}

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
                        <strong>Vialidades de Tránsito</strong> es una plataforma para reportar y monitorear incidentes viales.
                        Únete a miles de ciudadanos mejorando la movilidad de nuestra ciudad.
                    </motion.p>
                    <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <Link to="/register" className="cta-button">
                            Comenzar Ahora
                            <span className="cta-arrow"><ArrowRight size={16} /></span>
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
                                center={[18.7, -70.1]}
                                zoom={9}
                                minZoom={9}
                                maxBounds={[[17.4, -71.85], [20.0, -68.3]]}
                                maxBoundsViscosity={1.0}
                                scrollWheelZoom={true}
                                zoomControl={false}
                                attributionControl={false}
                                style={{ flex: 1, width: '100%', height: '100%', zIndex: 1 }}
                            >
                                {mapType === 'satellite' ? (
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                ) : (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                )}
                                {heatPoints.length > 0 && <HeatMapLayer points={heatPoints} />}

                                {/* Map Type Toggle */}
                                <div style={{
                                    position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
                                    display: 'flex', gap: '8px', padding: '6px',
                                    background: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                                    backdropFilter: 'blur(10px)', borderRadius: '12px',
                                    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                                }}>
                                    <button onClick={(e) => { e.stopPropagation(); setMapType('standard'); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: mapType === 'standard' ? 'var(--primary)' : 'transparent', color: mapType === 'standard' ? 'white' : (theme === 'dark' ? 'white' : '#1e2025'), fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CiLocationOn size={16} /> Callejero
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setMapType('satellite'); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: mapType === 'satellite' ? 'var(--primary)' : 'transparent', color: mapType === 'satellite' ? 'white' : (theme === 'dark' ? 'white' : '#1e2025'), fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <LiaSatelliteSolid size={18} /> Satélite
                                    </button>
                                </div>

                                <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 10, background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', padding: '0.75rem 1.25rem', borderRadius: '2rem', backdropFilter: 'blur(10px)', color: theme === 'dark' ? 'white' : '#1e2025', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 10px #ef4444' }}></span>
                                    Radio Activos
                                </div>
                            </MapContainer>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* ─── Public Stats Section ─── */}
            {heatPoints.length > 0 && (() => {
                const typeLabels = { Traffic: 'Tráfico', Accident: 'Accidente', Violation: 'Infracción', Hazard: 'Peligro', RoadWork: 'Obra vial', Pothole: 'Bache', Flood: 'Inundación', Other: 'Otro' };
                const typeColors = { Traffic: '#6366f1', Accident: '#ef4444', Violation: '#f59e0b', Hazard: '#f97316', RoadWork: '#0ea5e9', Pothole: '#8b5cf6', Flood: '#06b6d4', Other: '#64748b' };
                const provinceColors = ['#ef4444','#f97316','#f59e0b','#6366f1','#0ea5e9','#8b5cf6','#10b981','#06b6d4'];

                const getProvince = (address) => {
                    if (!address) return null;
                    const cleaned = address
                        .replace(/república dominicana/gi, '')
                        .replace(/dominican republic/gi, '')
                        .replace(/,\s*$/, '');
                    const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
                    return parts[parts.length - 1] || null;
                };

                const typeCounts = {};
                const provinceCounts = {};
                heatPoints.forEach(p => {
                    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
                    const prov = getProvince(p.address);
                    if (prov) provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
                });
                const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
                const topProvinces = Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]);
                const maxProv = topProvinces[0]?.[1] || 1;
                const maxType = topTypes[0]?.[1] || 1;
                const topProv = topProvinces[0]?.[0];

                return (
                    <section style={{ padding: '5rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '1000px', height: '600px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none' }} />

                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            {/* Header */}
                            <motion.div style={{ textAlign: 'center', marginBottom: '3rem' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1.1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '99px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                    <Layers size={15} /> Estadísticas en Tiempo Real
                                </div>
                                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '0.6rem' }}>
                                    Incidencias en <span style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>República Dominicana</span>
                                </h2>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.6 }}>
                                    Datos en tiempo real basados en reportes publicados por la comunidad.
                                </p>
                            </motion.div>

                            {/* Summary cards — info only, no counts */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'Provincia más afectada', value: topProv || '—', color: '#ef4444' },
                                    { label: 'Tipo más frecuente', value: typeLabels[topTypes[0]?.[0]] || '—', color: typeColors[topTypes[0]?.[0]] || '#6366f1' },
                                ].map((s, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`, borderRadius: '18px 18px 0 0' }} />
                                        <span style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)', fontWeight: '900', color: s.color, lineHeight: 1.1, wordBreak: 'break-word' }}>{s.value}</span>
                                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Province ranking + type breakdown */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>

                                {/* Provinces */}
                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem 1.75rem' }}>
                                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1.4rem' }}>Incidencias por provincia</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {topProvinces.map(([prov, count], i) => {
                                            const pct = Math.round((count / maxProv) * 100);
                                            const color = provinceColors[i % provinceColors.length];
                                            const isTop = i === 0;
                                            return (
                                                <div key={prov}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                                                        <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: isTop ? color : `${color}22`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900', color: isTop ? 'white' : color, flexShrink: 0 }}>{i + 1}</span>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: isTop ? '800' : '600', color: isTop ? 'var(--text-main)' : 'var(--text-light)' }}>{prov}</span>
                                                        {isTop && <span style={{ fontSize: '0.62rem', fontWeight: '900', color, background: `${color}15`, padding: '1px 6px', borderRadius: '99px', letterSpacing: '0.05em' }}>MÁS AFECTADA</span>}
                                                    </div>
                                                    <div style={{ height: isTop ? '8px' : '5px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                                                            style={{ height: '100%', background: isTop ? color : `${color}88`, borderRadius: '99px' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>

                                {/* Type breakdown */}
                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem 1.75rem' }}>
                                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1.4rem' }}>Tipo de incidencia</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {topTypes.map(([type, count], i) => {
                                            const color = typeColors[type] || '#6366f1';
                                            const pct = Math.round((count / maxType) * 100);
                                            const isTop = i === 0;
                                            return (
                                                <div key={type}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                                                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0, display: 'inline-block' }} />
                                                        <span style={{ fontSize: '0.85rem', fontWeight: isTop ? '800' : '600', color: isTop ? 'var(--text-main)' : 'var(--text-light)' }}>{typeLabels[type] || type}</span>
                                                        {isTop && <span style={{ fontSize: '0.62rem', fontWeight: '900', color, background: `${color}15`, padding: '1px 6px', borderRadius: '99px' }}>MAYOR</span>}
                                                    </div>
                                                    <div style={{ height: isTop ? '8px' : '5px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                                                            style={{ height: '100%', background: isTop ? color : `${color}88`, borderRadius: '99px' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>
                );
            })()}

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


            {/* Suggestions Section - Premium Refinement */}
            <section style={{ padding: '8rem 1.5rem', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
                {/* Background glows */}
                <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="form-split-grid">

                        {/* ── Left Side ── */}
                        <motion.div
                            className="form-split-left"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Badge */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.5rem 1.1rem',
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '99px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem',
                                marginBottom: '2rem'
                            }}>
                                <MessageSquare size={15} /> Feedback Comunitario
                            </div>

                            {/* Headline */}
                            <h2 style={{
                                fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: '900',
                                lineHeight: '1.1', marginBottom: '1.25rem',
                                color: 'var(--text-main)', letterSpacing: '-0.02em'
                            }}>
                                Construyamos un mejor{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>tránsito</span>{' '}juntos.
                            </h2>

                            <p style={{ fontSize: '1.05rem', color: 'var(--text-light)', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '440px' }}>
                                Tu experiencia diaria es la clave para identificar problemas y proponer soluciones innovadoras. Cada sugerencia es revisada por nuestro equipo.
                            </p>

                            {/* Stats row */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                                {[
                                    { value: '100%', label: 'Revisadas' },
                                    { value: '0',    label: 'Costo' },
                                ].map((stat, i) => (
                                    <div key={i} style={{
                                        background: 'var(--surface)', border: '1px solid var(--border-color)',
                                        borderRadius: '14px', padding: '0.75rem 1.1rem',
                                        display: 'flex', flexDirection: 'column', gap: '2px',
                                    }}>
                                        <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>{stat.value}</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Steps */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { num: '01', label: 'Elige el tipo de feedback', desc: 'Bug, mejora, nueva idea u otro', color: '#6366f1', icon: <Lightbulb size={16} /> },
                                    { num: '02', label: 'Describe tu experiencia', desc: 'Sé específico para que podamos actuar', color: '#0ea5e9', icon: <PenLine size={16} /> },
                                    { num: '03', label: 'El equipo lo recibe', desc: 'Analizamos cada mensaje enviado', color: '#10b981', icon: <BadgeCheck size={16} /> },
                                ].map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            background: 'var(--surface)', border: '1px solid var(--border-color)',
                                            borderRadius: '16px', padding: '0.9rem 1.1rem',
                                        }}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                                            background: `${step.color}18`, border: `1.5px solid ${step.color}35`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: step.color,
                                        }}>
                                            {step.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)' }}>{step.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>{step.desc}</div>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: step.color, opacity: 0.5, flexShrink: 0 }}>{step.num}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ── Right Side: Form Card ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div style={{
                                borderRadius: '28px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 24px 60px -12px rgba(0,0,0,0.12)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Gradient top bar */}
                                <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--primary), #818cf8, #0ea5e9)', borderRadius: '28px 28px 0 0' }} />

                                {/* Card Header */}
                                <div style={{ padding: '1.75rem 2rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                        }}>
                                            <Send size={17} color="white" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>Envía tu Feedback</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>Anónimo · Gratuito · Sin registro</div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSuggestionSubmit} style={{ padding: '1.5rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                    {/* Category chips */}
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Tipo de feedback
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {[
                                                { value: 'idea',   label: 'Nueva Idea',  icon: <Lightbulb size={13} />, color: '#6366f1' },
                                                { value: 'mejora', label: 'Mejora',       icon: <Sparkles size={13} />, color: '#0ea5e9' },
                                                { value: 'bug',    label: 'Problema',     icon: <Bug size={13} />,      color: '#ef4444' },
                                                { value: 'otro',   label: 'Otro',         icon: <MessageSquare size={13} />, color: '#64748b' },
                                            ].map(cat => {
                                                const active = suggestionForm.category === cat.value;
                                                return (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        onClick={() => setSuggestionForm(f => ({ ...f, category: cat.value }))}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '5px',
                                                            padding: '6px 12px', borderRadius: '10px', cursor: 'pointer',
                                                            border: `1.5px solid ${active ? cat.color : 'var(--border-color)'}`,
                                                            background: active ? `${cat.color}14` : 'var(--bg-input)',
                                                            color: active ? cat.color : 'var(--text-muted)',
                                                            fontWeight: active ? '700' : '500',
                                                            fontSize: '0.8rem', transition: 'all 0.15s',
                                                            fontFamily: 'inherit',
                                                        }}
                                                    >
                                                        {cat.icon} {cat.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Name + Email row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {/* Name */}
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                                            <div style={{ position: 'relative' }}>
                                                <UserIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'name' ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.15s' }} />
                                                <input
                                                    type="text" name="name"
                                                    value={suggestionForm.name}
                                                    onChange={handleSuggestionChange}
                                                    onFocus={() => setFocusedField('name')}
                                                    onBlur={() => setFocusedField(null)}
                                                    required placeholder="Juan Pérez"
                                                    style={{
                                                        height: '46px', paddingLeft: '2.75rem',
                                                        background: 'var(--bg-input)',
                                                        border: `1.5px solid ${focusedField === 'name' ? 'var(--primary)' : 'var(--border-color)'}`,
                                                        borderRadius: '12px', fontSize: '0.9rem',
                                                        width: '100%', boxSizing: 'border-box',
                                                        color: 'var(--text-main)',
                                                        outline: 'none', transition: 'border-color 0.15s',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {/* Email */}
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'email' ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.15s' }} />
                                                <input
                                                    type="email" name="email"
                                                    value={suggestionForm.email}
                                                    onChange={handleSuggestionChange}
                                                    onFocus={() => setFocusedField('email')}
                                                    onBlur={() => setFocusedField(null)}
                                                    required placeholder="ejemplo@correo.com"
                                                    style={{
                                                        height: '46px', paddingLeft: '2.75rem',
                                                        background: 'var(--bg-input)',
                                                        border: `1.5px solid ${focusedField === 'email' ? 'var(--primary)' : 'var(--border-color)'}`,
                                                        borderRadius: '12px', fontSize: '0.9rem',
                                                        width: '100%', boxSizing: 'border-box',
                                                        color: 'var(--text-main)',
                                                        outline: 'none', transition: 'border-color 0.15s',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu Mensaje</label>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: '600',
                                                color: suggestionForm.message.length > 450 ? '#ef4444' : 'var(--text-muted)',
                                            }}>
                                                {suggestionForm.message.length}/500
                                            </span>
                                        </div>
                                        <textarea
                                            name="message"
                                            value={suggestionForm.message}
                                            onChange={e => {
                                                if (e.target.value.length <= 500) handleSuggestionChange(e);
                                            }}
                                            onFocus={() => setFocusedField('message')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                            placeholder="Descríbenos tu idea para mejorar Vialidades..."
                                            style={{
                                                minHeight: '140px', padding: '1rem 1.1rem',
                                                borderRadius: '14px', background: 'var(--bg-input)',
                                                border: `1.5px solid ${focusedField === 'message' ? 'var(--primary)' : 'var(--border-color)'}`,
                                                color: 'var(--text-main)', fontFamily: 'inherit',
                                                fontSize: '0.9rem', width: '100%', boxSizing: 'border-box',
                                                resize: 'vertical', lineHeight: '1.6',
                                                outline: 'none', transition: 'border-color 0.15s',
                                            }}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={sendingSuggestion}
                                        style={{
                                            height: '52px', borderRadius: '14px',
                                            background: sendingSuggestion
                                                ? 'rgba(99,102,241,0.5)'
                                                : 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                                            color: 'white', fontWeight: '800', fontSize: '0.95rem',
                                            border: 'none', cursor: sendingSuggestion ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                            transition: 'all 0.2s', boxShadow: sendingSuggestion ? 'none' : '0 8px 20px -6px rgba(99,102,241,0.5)',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {sendingSuggestion ? (
                                            <>
                                                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                Enviando...
                                            </>
                                        ) : (
                                            <><Send size={17} /> Enviar Feedback</>
                                        )}
                                    </button>

                                    {/* Privacy note */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                        <Lock size={12} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Tu información es confidencial y no se comparte con terceros.
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Soporte / Solicitudes Legales ─── */}
            <section style={{ padding: '5rem 1.5rem 7rem', position: 'relative', overflow: 'hidden' }}>
                {/* Background glows */}
                <div style={{ position: 'absolute', top: '15%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />

                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {/* Header */}
                    <motion.div
                        style={{ textAlign: 'center', marginBottom: '3.5rem' }}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                            borderRadius: '99px', color: '#dc2626', fontWeight: '700', fontSize: '0.9rem',
                            marginBottom: '1.75rem',
                        }}>
                            <LifeBuoy size={18} /> Centro de Soporte
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '900',
                            color: 'var(--text-main)', letterSpacing: '-0.02em',
                            lineHeight: 1.15, marginBottom: '1rem',
                        }}>
                            ¿Apareces en un reporte <span style={{ color: '#dc2626' }}>sin tu permiso</span>?
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
                            Si tú o un familiar aparece en un reporte vial sin haber autorizado el contenido, tienes derecho a solicitar su eliminación inmediata amparado en la <strong style={{ color: 'var(--text-main)' }}>Ley 192-19</strong> y la <strong style={{ color: 'var(--text-main)' }}>Ley 172-13</strong>.
                        </p>
                    </motion.div>

                    {/* Cards */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        {/* Card — Imágenes de Personas */}
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid rgba(220,38,38,0.2)',
                                borderRadius: '24px',
                                padding: '2rem',
                                display: 'flex', flexDirection: 'column', gap: '1.25rem',
                                position: 'relative', overflow: 'hidden',
                                maxWidth: '720px', margin: '0 auto',
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#dc2626', borderRadius: '24px 24px 0 0' }} />

                            {/* Icon + title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                                    background: '#dc2626',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 6px 20px rgba(220,38,38,0.3)',
                                }}>
                                    <UserX size={24} color="white" strokeWidth={2} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                        Imágenes de Personas
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '700', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '2px 10px', borderRadius: '99px' }}>
                                            Ley 192-19
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '700', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 10px', borderRadius: '99px' }}>
                                            Ley 172-13
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.7, margin: 0 }}>
                                Si tú, un familiar fallecido o cualquier persona identificable aparece en un reporte sin su consentimiento, puedes solicitar la eliminación inmediata del contenido. La Ley 192-19 protege la imagen de las personas, abarcando también el derecho al olvido y la protección de datos personales establecido en la Ley 172-13.
                            </p>

                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                                {[
                                    'Familiar directo o representante legal',
                                    'Fallecidos o gravemente lesionados',
                                    'Cualquier persona identificable',
                                    'Imágenes, vídeos o datos personales',
                                    'Derecho al olvido y eliminación de datos',
                                    'Revisión prioritaria por el equipo',
                                ].map((pt, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.83rem', color: 'var(--text-light)' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #6366f1)', flexShrink: 0, marginTop: '6px' }} />
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* CTA Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '24px',
                            padding: '2rem 2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1.5rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                                background: '#dc2626',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 6px 20px rgba(220,38,38,0.25)',
                            }}>
                                <LifeBuoy size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                                    Formulario de Solicitud de Eliminación
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Sin necesidad de crear una cuenta — proceso gratuito y confidencial
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/soporte"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.9rem 2rem',
                                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                                color: 'white', fontWeight: '700', fontSize: '0.95rem',
                                borderRadius: '14px', textDecoration: 'none',
                                boxShadow: '0 8px 20px rgba(220,38,38,0.3)',
                                whiteSpace: 'nowrap',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            Ir al Centro de Soporte <ChevronRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ─── Terms & Rules Section ─── */}
            <section style={{ padding: '3rem 1.5rem 6rem', position: 'relative', overflow: 'hidden' }}>
                {/* Background glows */}
                <div style={{ position: 'absolute', top: '10%', left: '-8%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <motion.div
                        style={{ textAlign: 'center', marginBottom: '4rem' }}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '99px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem',
                            marginBottom: '1.75rem',
                        }}>
                            <FileText size={18} /> Reglas y Términos de Uso
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '900',
                            color: 'var(--text-main)', letterSpacing: '-0.02em',
                            lineHeight: 1.15, marginBottom: '1rem',
                        }}>
                            Compromisos de la <span style={{ color: 'var(--primary)' }}>Comunidad</span>
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
                            Al registrarte en Vialidades aceptas estas reglas, diseñadas para mantener una plataforma segura, veraz y justa para todos.
                        </p>
                    </motion.div>

                    {/* Cards grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {LANDING_RULES.map((rule, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.55, delay: i * 0.07 }}
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '24px',
                                    padding: '1.75rem',
                                    display: 'flex', flexDirection: 'column', gap: '1rem',
                                    backdropFilter: 'blur(12px)',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    position: 'relative', overflow: 'hidden',
                                }}
                                whileHover={{ y: -4, boxShadow: `0 16px 40px -12px ${rule.color}30` }}
                            >
                                {/* Top accent bar */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: rule.color, borderRadius: '24px 24px 0 0' }} />

                                {/* Icon + subtitle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '14px',
                                        background: rule.color, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 6px 16px ${rule.color}40`,
                                    }}>
                                        <rule.Icon size={20} color="white" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{rule.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '2px' }}>{rule.subtitle}</div>
                                    </div>
                                </div>

                                {/* Bullet points / sections */}
                                {rule.sections ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                        {rule.sections.map((section, k) => (
                                            <div key={k}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: section.color, background: `${section.color}12`, border: `1px solid ${section.color}30`, padding: '2px 9px', borderRadius: '99px' }}>
                                                        {section.law}
                                                    </span>
                                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '500' }}>{section.label}</span>
                                                </div>
                                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                    {section.points.map((pt, j) => (
                                                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: section.color, flexShrink: 0, marginTop: '7px', opacity: 0.8 }} />
                                                            {pt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                        {rule.points.map((pt, j) => (
                                            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: rule.color, flexShrink: 0, marginTop: '7px', opacity: 0.8 }} />
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer note */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7 }}
                    >
                        Los términos completos se presentarán al momento de registrarte.<br />
                        Vialidades se reserva el derecho de actualizar estas reglas. Los cambios se notificarán por correo electrónico.
                    </motion.p>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
