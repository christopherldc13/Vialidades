import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import { Plus, TrendingUp, MapPin, Calendar, MessageSquare, Mail, Trash2, MoreVertical, Eye, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Skeleton, Box, ToggleButton, ToggleButtonGroup, CircularProgress, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AuthContext from '../context/AuthContext';
import ReportDetailModal from '../components/ReportDetailModal';
import { Clock, CheckCircle, XCircle, AlertCircle, PieChart as PieChartIcon, Activity, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { MdWavingHand } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { RiUserCommunityLine } from "react-icons/ri";
import { TbReportSearch } from "react-icons/tb";
import './DashboardExtras.css';
import { FaCar, FaCarCrash, FaWater, FaRoad } from "react-icons/fa";
import { BsSignStopFill } from "react-icons/bs";
import { LuTriangleAlert } from "react-icons/lu";
import { IoMdHelpCircle } from "react-icons/io";
import { MdConstruction } from "react-icons/md";
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : ''));

const CAT_MAP = {
    idea:   { label: 'Nueva Idea', color: '#64748b', bg: 'rgba(100,116,139,0.1)', gradient: 'linear-gradient(135deg,#64748b,#94a3b8)' },
    mejora: { label: 'Mejora',     color: '#64748b', bg: 'rgba(100,116,139,0.1)', gradient: 'linear-gradient(135deg,#64748b,#94a3b8)' },
    bug:    { label: 'Problema',   color: '#64748b', bg: 'rgba(100,116,139,0.1)', gradient: 'linear-gradient(135deg,#64748b,#94a3b8)' },
    otro:   { label: 'Otro',       color: '#64748b', bg: 'rgba(100,116,139,0.1)', gradient: 'linear-gradient(135deg,#64748b,#94a3b8)' },
};

const INTERVAL_MS = 5000;

function FeedbackCarousel({ suggestions }) {
    const [idx, setIdx] = useState(0);
    const [dir, setDir] = useState(1);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const startRef = useRef(Date.now());
    const rafRef = useRef(null);

    const goTo = (next, direction) => {
        setDir(direction);
        setIdx(next);
        setProgress(0);
        startRef.current = Date.now();
    };

    const prev = () => goTo((idx - 1 + suggestions.length) % suggestions.length, -1);
    const next = () => goTo((idx + 1) % suggestions.length, 1);

    useEffect(() => {
        if (suggestions.length <= 1) return;
        const tick = () => {
            if (!paused) {
                const elapsed = Date.now() - startRef.current;
                const p = Math.min(elapsed / INTERVAL_MS, 1);
                setProgress(p);
                if (p >= 1) {
                    setDir(1);
                    setIdx(i => (i + 1) % suggestions.length);
                    setProgress(0);
                    startRef.current = Date.now();
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [suggestions.length, paused]);

    const s = suggestions[idx];
    const cat = s?.category ? (CAT_MAP[s.category] || CAT_MAP.otro) : null;
    const accentColor = cat?.color || '#64748b';

    const variants = {
        enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
        center: { x: 0, opacity: 1, scale: 1 },
        exit:  (d) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
    };

    const ArrowBtn = ({ onClick, children }) => {
        const [hovered, setHovered] = useState(false);
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${hovered ? accentColor : '#e2e8f0'}`,
                    background: hovered ? `${accentColor}12` : '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.18s ease',
                    boxShadow: hovered ? `0 4px 14px ${accentColor}30` : '0 2px 6px rgba(0,0,0,0.08)',
                    outline: 'none', lineHeight: 0, padding: 0,
                }}
            >
                {children}
            </button>
        );
    };

    return (
        <div
            style={{ position: 'relative', userSelect: 'none' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Card */}
            <div style={{ overflow: 'hidden', borderRadius: '20px' }}>
                <AnimatePresence initial={false} custom={dir} mode="wait">
                    <motion.div
                        key={idx}
                        custom={dir}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            background: 'var(--surface-solid)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '20px',
                            padding: '1.75rem 2rem',
                            display: 'flex', flexDirection: 'column', gap: '1.1rem',
                            boxShadow: `0 2px 20px rgba(0,0,0,0.06)`,
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                                background: cat?.gradient || 'linear-gradient(135deg,#6366f1,#818cf8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: '900', fontSize: '1.2rem',
                                boxShadow: `0 6px 18px ${accentColor}35`,
                            }}>
                                {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '800', fontSize: '0.97rem', color: 'var(--text-main)' }}>
                                    {s.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                    <Mail size={11} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                                {cat && (
                                    <span style={{
                                        padding: '3px 11px', borderRadius: '99px',
                                        fontSize: '0.71rem', fontWeight: '700',
                                        color: cat.color, background: cat.bg,
                                        border: `1px solid ${cat.color}35`,
                                    }}>
                                        {cat.label}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {formatDate(s.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Divider with accent */}
                        <div style={{ height: '1px', background: `linear-gradient(90deg, ${accentColor}40, var(--border-color) 60%, transparent)` }} />

                        {/* Quote */}
                        <p style={{
                            margin: 0, fontSize: '0.95rem', color: 'var(--text-light)',
                            lineHeight: 1.75, fontStyle: 'italic', paddingLeft: '0.25rem',
                            borderLeft: `3px solid ${accentColor}50`,
                            paddingLeft: '0.85rem',
                            display: '-webkit-box', WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {s.message}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            {suggestions.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', marginTop: '1.1rem' }}>
                    <ArrowBtn onClick={prev}><ChevronLeft size={16} color={accentColor} strokeWidth={2.5} /></ArrowBtn>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {suggestions.map((_, i) => (
                            <motion.button
                                key={i}
                                onClick={() => goTo(i, i > idx ? 1 : -1)}
                                animate={{ width: i === idx ? 22 : 8, background: i === idx ? accentColor : '#cbd5e1' }}
                                transition={{ duration: 0.25 }}
                                style={{ height: '8px', borderRadius: '99px', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
                            />
                        ))}
                    </div>

                    <ArrowBtn onClick={next}><ChevronRight size={16} color={accentColor} strokeWidth={2.5} /></ArrowBtn>
                </div>
            )}
        </div>
    );
}

const DR_PROVINCES = [
    'Azua','Bahoruco','Barahona','Dajabón','Distrito Nacional','Duarte',
    'El Seibo','Elías Piña','Espaillat','Hato Mayor','Hermanas Mirabal',
    'Independencia','La Altagracia','La Romana','La Vega',
    'María Trinidad Sánchez','Monseñor Nouel','Monte Cristi','Monte Plata',
    'Pedernales','Peravia','Puerto Plata','Samaná','San Cristóbal',
    'San José de Ocoa','San Juan','San Pedro de Macorís','Sánchez Ramírez',
    'Santiago','Santiago Rodríguez','Santo Domingo','Valverde',
];


const TYPE_CONFIG = {
    Traffic:   { label: 'Tráfico',         icon: <FaCar />,           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
    Accident:  { label: 'Accidente',        icon: <FaCarCrash />,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    Violation: { label: 'Infracción',       icon: <BsSignStopFill />,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    Hazard:    { label: 'Peligro',          icon: <LuTriangleAlert />, color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
    RoadWork:  { label: 'Obra en la vía',   icon: <MdConstruction />,  color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
    Pothole:   { label: 'Bache peligroso',  icon: <FaRoad />,          color: '#78716c', bg: 'rgba(120,113,108,0.12)' },
    Flood:     { label: 'Inundación',       icon: <FaWater />,         color: '#0284c7', bg: 'rgba(2,132,199,0.12)'   },
};

const STATUS_CONFIG = {
    pending:        { label: 'Pendiente',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    approved:       { label: 'Aprobado',          color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
    rejected:       { label: 'Rechazado',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    sanctioned:     { label: 'Sancionado',        color: '#b91c1c', bg: 'rgba(185,28,28,0.12)'   },
    'In Process':   { label: 'En revisión',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
    needs_review:   { label: 'Pendiente revisar', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getIncidentIcon = (type) => TYPE_CONFIG[type]?.icon || <IoMdHelpCircle />;
const getIncidentLabel = (type) => TYPE_CONFIG[type]?.label || type;
const getIncidentColor = (type) => TYPE_CONFIG[type]?.color || 'var(--primary)';
const getIncidentBg = (type) => TYPE_CONFIG[type]?.bg || 'rgba(99,102,241,0.12)';


const Dashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, sanctioned: 0, published: 0 });
    const [suggestions, setSuggestions] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view') || 'community';
    const { user, loading: authLoading } = useContext(AuthContext);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [cardMenu, setCardMenu] = useState({ anchorEl: null, reportId: null });
    const [revealedReports, setRevealedReports] = useState(new Set());
    const isModerator = ['moderator', 'admin'].includes(user?.role);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        setTypeFilter('all');
        setStatusFilter('all');
        setProvinceFilter('all');
        setDateFrom('');
        setDateTo('');
        setRevealedReports(new Set());
    }, [viewMode]);

    const fetchReports = useCallback(async () => {
        try {
            if (isModerator) {
                const [pendingRes, statsRes, suggestionsRes] = await Promise.all([
                    axios.get('/api/reports?status=pending'),
                    axios.get('/api/reports/stats'),
                    axios.get('/api/suggestions'),
                ]);
                setStats(statsRes.data);
                setReports(pendingRes.data);
                setSuggestions(suggestionsRes.data);
            } else {
                let res;
                if (viewMode === 'my') {
                    res = await axios.get('/api/reports?my=true');
                } else {
                    res = await axios.get('/api/reports');
                }
                setReports(res.data);
            }
        } catch (err) {
            console.error("Error fetching reports:", err);
        } finally {
            setLoading(false);
        }
    }, [isModerator, viewMode]);

    useEffect(() => {
        if (user) fetchReports();
    }, [user, fetchReports]);

    useEffect(() => {
        const handleNewReport = (report) => {
            setStats(prev => ({ ...prev, pending: (prev.pending || 0) + 1 }));
            if (isModerator) {
                setReports(prev => [report, ...prev]);
            } else if (viewMode === 'community' && report.status === 'approved') {
                setReports(prev => [report, ...prev]);
            }
        };
        const handleStatusUpdate = ({ reportId, status, wasSanctioned }) => {
            // Update the matching report immediately in state (no network round-trip needed)
            setReports(prev => prev.map(r =>
                r._id === reportId ? { ...r, status, wasSanctioned } : r
            ));
            // For community view also re-fetch so newly approved reports appear
            if (viewMode === 'community') fetchReports();
        };
        const handleReportFlagged = ({ reportId, status, flagsCount }) => {
            if (isModerator) {
                fetchReports();
            } else {
                setReports(prev => prev.map(r =>
                    r._id === reportId ? { ...r, status, flags: Array(flagsCount).fill(null) } : r
                ));
            }
        };
        socket.on('new_report', handleNewReport);
        socket.on('report_status_updated', handleStatusUpdate);
        socket.on('report_flagged', handleReportFlagged);
        return () => {
            socket.off('new_report', handleNewReport);
            socket.off('report_status_updated', handleStatusUpdate);
            socket.off('report_flagged', handleReportFlagged);
        };
    }, [isModerator, viewMode, fetchReports]);

    useEffect(() => {
        const reportIdToOpen = searchParams.get('reportId');
        if (reportIdToOpen) {
            const existingReport = reports.find(r => r._id === reportIdToOpen);
            if (existingReport) {
                setSelectedReport(existingReport);
                setIsModalOpen(true);
                setSearchParams(params => { params.delete('reportId'); return params; }, { replace: true });
            } else if (!loading) {
                const fetchSingle = async () => {
                    try {
                        const res = await axios.get(`/api/reports/${reportIdToOpen}`);
                        setSelectedReport(res.data);
                        setIsModalOpen(true);
                        setSearchParams(params => { params.delete('reportId'); return params; }, { replace: true });
                    } catch (err) { console.error(err); }
                };
                fetchSingle();
            }
        }
    }, [searchParams, reports, loading, setSearchParams]);

    const filteredReports = reports.filter(r => {
        if (typeFilter !== 'all' && r.type !== typeFilter) return false;
        if (viewMode === 'my' && statusFilter !== 'all') {
            const key = r.wasSanctioned ? 'sanctioned' : r.status;
            if (key !== statusFilter) return false;
        }
        if (provinceFilter !== 'all') {
            const addr = (r.location?.address || '').toLowerCase();
            if (!addr.includes(provinceFilter.toLowerCase())) return false;
        }
        if (viewMode === 'my' && dateFrom) {
            if (new Date(r.timestamp) < new Date(dateFrom)) return false;
        }
        if (viewMode === 'my' && dateTo) {
            if (new Date(r.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
        }
        return true;
    });

    if (authLoading) {
        return (
            <div style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={60} thickness={4} style={{ color: 'var(--primary)' }} />
            </div>
        );
    }

    if (user?.role === 'supermoderador') return <Navigate to="/supermoderador" replace />;

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1500px', margin: '0 auto', paddingBottom: '100px' }}>
                <div className="dash-pad">

                    {/* Welcome row */}
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '14px',
                                    background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '1.1rem', fontWeight: 'bold',
                                    boxShadow: '0 4px 10px rgba(99,102,241,0.25)',
                                    flexShrink: 0, overflow: 'hidden'
                                }}>
                                    {user.avatar
                                        ? <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : user.firstName.charAt(0)
                                    }
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                        Bienvenido de nuevo <MdWavingHand className="waving-hand" style={{ color: '#f59e0b', verticalAlign: 'middle', marginLeft: '4px' }} />
                                    </div>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '800' }}>
                                        {user.firstName} {user.lastName}
                                    </div>
                                </div>
                            </div>

                            {/* User reputation mini-badge */}
                            {!isModerator && (
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        background: 'var(--surface-solid)', border: '1px solid var(--border-color)',
                                        borderRadius: '12px', padding: '0.45rem 0.9rem',
                                        fontSize: '0.85rem', fontWeight: '700'
                                    }}>
                                        <TrendingUp size={15} color="#f59e0b" />
                                        <span style={{ color: '#f59e0b' }}>{user.reputation ?? 0}</span>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>reputación</span>
                                    </div>
                                    {user.sanctions > 0 && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                            borderRadius: '12px', padding: '0.45rem 0.9rem',
                                            fontSize: '0.85rem', fontWeight: '700', color: '#ef4444'
                                        }}>
                                            <AlertCircle size={14} />
                                            {user.sanctions} {user.sanctions === 1 ? 'sanción' : 'sanciones'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Moderator header ── */}
                    {isModerator && (
                        <div className="mod-header">
                            {/* Left: info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                        padding: '0.2rem 0.7rem', borderRadius: '999px',
                                        fontSize: '0.71rem', fontWeight: '700',
                                        border: '1px solid rgba(16,185,129,0.25)',
                                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    }}>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                                        {user?.role === 'admin' ? 'Administrador' : 'Moderador'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                        {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ fontSize: '1.45rem', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.2 }}>
                                    Bienvenido, <span style={{ color: 'var(--primary)' }}>{user?.firstName}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                    Panel de Moderación · Vialidades de Tránsito
                                </p>
                            </div>

                            {/* Right: CTA */}
                            <Link to="/moderate" className="mod-cta">
                                <RxDashboard size={17} /> Ir al Panel
                            </Link>
                        </div>
                    )}

                    {/* Header row — users only */}
                    {!isModerator && (
                    <div className="dashboard-header modern-dashboard-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <h2 style={{ fontSize: '1.85rem', fontWeight: '900', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
                                Reportes de Incidentes
                            </h2>
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                                Explora y reporta incidencias viales en tu zona.
                            </p>
                        </div>

                        {(
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, newView) => { if (newView !== null) setSearchParams({ view: newView }); }}
                                sx={{
                                    backgroundColor: 'var(--surface-solid)',
                                    borderRadius: '16px', p: 0.5,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                    border: '1px solid var(--border-light)',
                                    display: 'flex', gap: '4px',
                                    '& .MuiToggleButton-root': {
                                        border: 'none', borderRadius: '12px !important',
                                        textTransform: 'none', fontWeight: 600,
                                        fontSize: '0.95rem', color: 'var(--text-muted)',
                                        px: 3, py: 1, transition: 'all 0.15s ease',
                                        '&:hover': { backgroundColor: 'rgba(128,128,128,0.1)', color: 'var(--text-main)', transform: 'translateY(-1px)' },
                                        '&.Mui-selected': { backgroundColor: 'var(--primary)', color: '#ffffff', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', '&:hover': { backgroundColor: 'var(--primary-dark)' } }
                                    }
                                }}
                            >
                                <ToggleButton value="community">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <RiUserCommunityLine size={22} /><span>Comunidad</span>
                                    </div>
                                </ToggleButton>
                                <ToggleButton value="my">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <TbReportSearch size={22} /><span>Mis Reportes</span>
                                    </div>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        )}
                    </div>
                    )}

                    {/* Moderator Stats */}
                    {isModerator && (
                        <div className="stat-grid">
                            {[
                                { key: 'pending',    label: 'Pendientes',          desc: 'Esperando revisión',       icon: <Clock size={22} />,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  filter: 'pending'    },
                                { key: 'approved',   label: 'Aprobados',           desc: 'Verificados por ti',       icon: <CheckCircle size={22} />,   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  filter: 'approved'   },
                                { key: 'rejected',   label: 'Rechazados',          desc: 'No aprobados',             icon: <XCircle size={22} />,       color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   filter: 'rejected'   },
                                { key: 'sanctioned', label: 'Sancionados',         desc: 'Con infracción',           icon: <AlertCircle size={22} />,   color: '#b91c1c', bg: 'rgba(185,28,28,0.1)',   filter: 'sanctioned' },
                                { key: 'published',  label: 'Reportes Publicados', desc: 'Sistema y moderadores',    icon: <CheckCircle size={22} />,   color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  filter: 'all'  },
                            ].map(s => (
                                <Tooltip key={s.key} title="Click para gestionar" arrow placement="top">
                                    <Link to={`/moderate?filter=${s.filter}`} className="stat-card" style={{
                                        background: 'var(--surface-solid)',
                                        borderRadius: '18px',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex', flexDirection: 'column',
                                        textDecoration: 'none',
                                        overflow: 'hidden',
                                        transition: 'transform 0.18s, box-shadow 0.18s',
                                        position: 'relative',
                                    }}>
                                        {/* Color accent top bar */}
                                        <div style={{ height: '3px', background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />
                                        <div style={{ padding: '1.4rem 1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>{s.label}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>{s.desc}</div>
                                                </div>
                                                <div style={{ background: s.bg, color: s.color, padding: '9px', borderRadius: '12px', flexShrink: 0 }}>{s.icon}</div>
                                            </div>
                                            <div style={{ fontSize: '2.6rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{stats[s.key] || 0}</div>
                                            <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>Ver en panel</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>→</span>
                                            </div>
                                        </div>
                                    </Link>
                                </Tooltip>
                            ))}
                        </div>
                    )}

                    {/* Analytics for moderators */}
                    {isModerator && (() => {
                        const statusData = [
                            { name: 'Pendientes', value: stats.pending || 0,   color: '#f59e0b' },
                            { name: 'Aprobados',  value: stats.approved || 0,  color: '#6366f1' },
                            { name: 'Rechazados', value: stats.rejected || 0,  color: '#ef4444' },
                            { name: 'Sancionados',value: stats.sanctioned || 0,color: '#b91c1c' },
                        ].filter(i => i.value > 0);

                        const typeLabels = { Traffic: 'Tráfico', Accident: 'Accidente', Violation: 'Infracción', Hazard: 'Peligro', RoadWork: 'Obra', Pothole: 'Bache', Flood: 'Inundación', Other: 'Otro' };
                        const typeData = (stats.byType || []).map(t => ({ name: typeLabels[t._id] || t._id, value: t.count }));
                        const dayData  = stats.byDay || [];

                        const total = statusData.reduce((a, c) => a + c.value, 0);
                        const processed = (stats.approved || 0) + (stats.rejected || 0) + (stats.sanctioned || 0);
                        const resRate = total > 0 ? Math.round((processed / total) * 100) : 0;

                        const Tip = ({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.65rem 0.9rem', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', fontSize: '0.82rem' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{d.name || label}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Total: <strong style={{ color: 'var(--text-main)' }}>{payload[0].value}</strong></div>
                                </div>
                            );
                        };

                        const Card = ({ title, subtitle, icon, children, height = 200 }) => (
                            <div style={{ background: 'var(--surface-solid)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '1.1rem 1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)' }}>{title}</div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>{subtitle}</div>
                                    </div>
                                    <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '6px', borderRadius: '9px', flexShrink: 0 }}>{icon}</div>
                                </div>
                                <div style={{ height }}>{children}</div>
                            </div>
                        );

                        return (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Analítica</h3>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Actividad y distribución de reportes</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '0.4rem 0.85rem' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700' }}>Tasa de resolución: {resRate}%</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                                    {/* Área — 7 días */}
                                    <Card title="Últimos 7 días" subtitle="Actividad diaria" icon={<Activity size={16} />} height={180}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dayData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: '0.68rem', fill: 'var(--text-muted)' }} dy={6} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: '0.68rem', fill: 'var(--text-muted)' }} allowDecimals={false} />
                                                <RechartsTooltip content={<Tip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }} />
                                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 4 }} name="Reportes" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Card>

                                    {/* Donut — estados */}
                                    {statusData.length > 0 && (
                                        <Card title="Estados" subtitle={`${total} reportes`} icon={<PieChartIcon size={16} />} height={180}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
                                                        {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                        <Label value={total} position="center" style={{ fontSize: '1.4rem', fontWeight: '800', fill: 'var(--text-main)' }} />
                                                    </Pie>
                                                    <RechartsTooltip content={<Tip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    )}

                                    {/* Barras horizontales — tipos */}
                                    {typeData.length > 0 && (
                                        <Card title="Tipos de incidente" subtitle="Por categoría" icon={<BarChart2 size={16} />} height={180}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: '0.68rem', fill: 'var(--text-muted)' }} allowDecimals={false} />
                                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: '0.68rem', fill: 'var(--text-muted)' }} width={60} />
                                                    <RechartsTooltip content={<Tip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 5, 5, 0]} maxBarSize={14} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ─── FEEDBACK DE USUARIOS ─── */}
                    {isModerator && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                <div style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>
                                        Feedback de Usuarios
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                        {suggestions.length} mensaje{suggestions.length !== 1 ? 's' : ''} recibido{suggestions.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {suggestions.length === 0 ? (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '3rem 2rem', borderRadius: '16px', gap: '0.75rem',
                                    background: 'var(--surface-solid)', border: '1px dashed var(--border-color)',
                                }}>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '50%',
                                        background: 'rgba(99,102,241,0.1)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <MessageSquare size={24} color="var(--primary)" strokeWidth={1.5} />
                                    </div>
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                        Aún no hay mensajes
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '280px' }}>
                                        Cuando los usuarios envíen sugerencias desde la página de inicio, aparecerán aquí.
                                    </p>
                                </div>
                            ) : (
                            <FeedbackCarousel suggestions={suggestions} />
                            )}
                        </div>
                    )}
                </div>

                {/* ─── USER REPORT SECTION ─── */}
                {!isModerator && (() => {
                    const handleHideReport = async (e, reportId) => {
                        e.stopPropagation();
                        const result = await Swal.fire({
                            title: 'Eliminar reporte',
                            text: '¿Estás seguro de que deseas eliminar este reporte? Dejará de ser visible para ti y para el público.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, eliminar',
                            cancelButtonText: 'Cancelar',
                            confirmButtonColor: '#ef4444',
                            customClass: { popup: 'swal2-lumina-popup', cancelButton: 'swal2-lumina-cancel' }
                        });
                        if (!result.isConfirmed) return;
                        try {
                            await axios.patch(`/api/reports/${reportId}/hide`);
                            setReports(prev => prev.filter(r => r._id !== reportId));
                        } catch (err) {
                            console.error('Hide report error:', err?.response?.status, err?.response?.data);
                            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el reporte.', customClass: { popup: 'swal2-lumina-popup' } });
                        }
                    };

                    const handleFlagReport = async (e, reportId) => {
                        e.stopPropagation();

                        const reasons = [
                            { value: 'Información falsa o engañosa', icon: '🚫' },
                            { value: 'Ubicación incorrecta',         icon: '📍' },
                            { value: 'Contenido inapropiado',        icon: '⚠️' },
                            { value: 'Reporte duplicado',            icon: '📋' },
                            { value: 'Spam o publicidad',            icon: '🗑️' },
                            { value: 'Otro',                         icon: '💬' },
                        ];

                        const { value: selectedReason, isConfirmed } = await Swal.fire({
                            title: 'Denunciar reporte',
                            html: `
                                <style>
                                    #flag-reasons label { color: var(--text-main) !important; }
                                    #flag-reasons label span { color: var(--text-main) !important; }
                                    #flag-other-input { display:none; margin-top:0.75rem; width:100%; box-sizing:border-box; padding:0.65rem 0.9rem; border-radius:10px; border:1.5px solid rgba(245,158,11,0.4); background:var(--bg-input); color:var(--text-main); font-size:0.88rem; font-family:inherit; resize:none; outline:none; }
                                    #flag-other-input:focus { border-color:#f59e0b; }
                                </style>
                                <p style="color:var(--text-muted);font-size:0.88rem;margin:0 0 1rem 0;">¿Por qué deseas denunciar este reporte?</p>
                                <div id="flag-reasons" style="display:flex;flex-direction:column;gap:0.5rem;text-align:left;">
                                    ${reasons.map(r => `
                                        <label style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0.9rem;border-radius:10px;border:1.5px solid rgba(100,100,100,0.18);cursor:pointer;transition:all 0.15s;font-size:0.9rem;font-weight:500;"
                                               onmouseover="this.style.borderColor='rgba(245,158,11,0.5)';this.style.background='rgba(245,158,11,0.07)'"
                                               onmouseout="if(!this.querySelector('input').checked){this.style.borderColor='rgba(100,100,100,0.18)';this.style.background='transparent'}">
                                            <input type="radio" name="flag-reason" value="${r.value}" style="accent-color:#f59e0b;width:16px;height:16px;flex-shrink:0;"
                                                   onchange="document.querySelectorAll('#flag-reasons label').forEach(l=>{l.style.borderColor='rgba(100,100,100,0.18)';l.style.background='transparent'});this.parentElement.style.borderColor='rgba(245,158,11,0.6)';this.parentElement.style.background='rgba(245,158,11,0.09)';document.getElementById('flag-other-input').style.display=this.value==='Otro'?'block':'none';">
                                            <span>${r.icon} ${r.value}</span>
                                        </label>
                                    `).join('')}
                                    <textarea id="flag-other-input" rows="3" placeholder="Describe el motivo de tu denuncia..."></textarea>
                                </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Continuar',
                            cancelButtonText: 'Cancelar',
                            customClass: { popup: 'swal2-lumina-popup', title: 'swal2-lumina-title', confirmButton: 'swal2-lumina-confirm-amber', cancelButton: 'swal2-lumina-cancel' },
                            preConfirm: () => {
                                const checked = document.querySelector('input[name="flag-reason"]:checked');
                                if (!checked) { Swal.showValidationMessage('Por favor selecciona un motivo'); return false; }
                                if (checked.value === 'Otro') {
                                    const text = document.getElementById('flag-other-input')?.value?.trim();
                                    if (!text) { Swal.showValidationMessage('Por favor describe el motivo'); return false; }
                                    return text;
                                }
                                return checked.value;
                            }
                        });
                        if (!isConfirmed) return;

                        const finalReason = selectedReason;

                        try {
                            const { data } = await axios.post(`/api/reports/${reportId}/flag`, { reason: finalReason });
                            setReports(prev => prev.map(r => r._id === reportId ? { ...r, flags: Array(data.flagsCount).fill(null), status: data.status } : r));
                            Swal.fire({ icon: 'success', title: 'Denuncia enviada', text: 'Gracias. Nuestro equipo revisará este reporte.', customClass: { popup: 'swal2-lumina-popup' }, timer: 2500, showConfirmButton: false });
                        } catch (err) {
                            const msg = err?.response?.data?.msg || 'No se pudo enviar la denuncia.';
                            Swal.fire({ icon: 'info', title: 'Aviso', text: msg, customClass: { popup: 'swal2-lumina-popup' } });
                        }
                    };

                    const renderCard = (report) => {
                        const typeColor = getIncidentColor(report.type);
                        const typeBg = getIncidentBg(report.type);
                        const statusKey = report.wasSanctioned ? 'sanctioned' : report.status;
                        const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                        return (
                            <div
                                key={report._id}
                                className="report-card modern-report-card"
                                onClick={() => { if (cardMenu.reportId === report._id) return; setSelectedReport(report); setIsModalOpen(true); }}
                                style={{ cursor: 'pointer', position: 'relative' }}
                            >
                                {viewMode === 'my' && (
                                    <>
                                        <button
                                            className="card-menu-btn"
                                            onClick={(e) => { e.stopPropagation(); setCardMenu({ anchorEl: e.currentTarget, reportId: report._id }); }}
                                            style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 5, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                                        >
                                            <MoreVertical size={17} strokeWidth={2.5} color="#111827" />
                                        </button>
                                        <Menu
                                            anchorEl={cardMenu.anchorEl}
                                            open={cardMenu.reportId === report._id}
                                            onClose={() => setCardMenu({ anchorEl: null, reportId: null })}
                                            onClick={() => setCardMenu({ anchorEl: null, reportId: null })}
                                            PaperProps={{ style: { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '175px', padding: '0.25rem 0' } }}
                                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                        >
                                            <MenuItem
                                                onClick={(e) => { e.stopPropagation(); setSelectedReport(report); setIsModalOpen(true); }}
                                                style={{ fontSize: '0.88rem', gap: '0.6rem', padding: '0.55rem 1rem' }}
                                            >
                                                <ListItemIcon style={{ minWidth: 'unset' }}><Eye size={15} color="var(--primary)" /></ListItemIcon>
                                                <ListItemText primary="Ver detalles" primaryTypographyProps={{ fontSize: '0.88rem' }} />
                                            </MenuItem>
                                            <MenuItem
                                                onClick={(e) => { e.stopPropagation(); handleHideReport(e, report._id); }}
                                                style={{ fontSize: '0.88rem', gap: '0.6rem', padding: '0.55rem 1rem', color: '#ef4444' }}
                                            >
                                                <ListItemIcon style={{ minWidth: 'unset' }}><Trash2 size={15} color="#ef4444" /></ListItemIcon>
                                                <ListItemText primary="Eliminar reporte" primaryTypographyProps={{ fontSize: '0.88rem', color: '#ef4444' }} />
                                            </MenuItem>
                                        </Menu>
                                    </>
                                )}
                                <div className="report-image-container" style={{ position: 'relative' }}>
                                    <div style={{ filter: report.wasSanctioned && !revealedReports.has(report._id) ? 'blur(12px)' : 'none', transition: 'filter 0.3s', pointerEvents: report.wasSanctioned && !revealedReports.has(report._id) ? 'none' : 'auto', height: '100%', width: '100%' }}>
                                        <MediaGallery
                                            media={report.media?.length > 0 ? report.media : (report.photos || [])}
                                            faceBlur={!report.wasSanctioned}
                                        />
                                    </div>
                                    {report.wasSanctioned && !revealedReports.has(report._id) && (
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)', zIndex: 2 }}
                                        >
                                            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                                            <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Contenido sensible</span>
                                            <button
                                                onClick={async e => {
                                                    e.stopPropagation();
                                                    const result = await Swal.fire({
                                                        title: 'Contenido sensible',
                                                        text: 'Este contenido fue marcado como inapropiado por el sistema. Puede contener imágenes de violencia, gore u otro material no apto. ¿Deseas verlo de todos modos?',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'Sí, ver contenido',
                                                        cancelButtonText: 'Cancelar',
                                                        customClass: { popup: 'swal2-lumina-popup', title: 'swal2-lumina-title', confirmButton: 'swal2-lumina-confirm-amber', cancelButton: 'swal2-lumina-cancel' }
                                                    });
                                                    if (result.isConfirmed) setRevealedReports(prev => new Set([...prev, report._id]));
                                                }}
                                                style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '20px', padding: '0.3rem 0.9rem', color: '#fff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.15s', marginTop: 0, width: 'auto', boxShadow: 'none' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                            >
                                                Ver de todos modos
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="report-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.25rem', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: typeBg, borderRadius: '10px', padding: '0.3rem 0.7rem' }}>
                                            <span style={{ color: typeColor, fontSize: '0.9rem', display: 'flex' }}>{getIncidentIcon(report.type)}</span>
                                            <span style={{ color: typeColor, fontWeight: '700', fontSize: '0.88rem' }}>{getIncidentLabel(report.type)}</span>
                                        </div>
                                        {viewMode === 'my' && (
                                            <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: '20px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                {statusCfg.label}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6', flex: 1 }}>
                                        {report.description}
                                    </p>
                                    {report.moderatorComment && (
                                        <div style={{ padding: '0.65rem 0.85rem', marginTop: '0.75rem', background: report.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderLeft: `3px solid ${report.status === 'approved' ? '#10b981' : '#ef4444'}`, borderRadius: '6px', fontSize: '0.82rem' }}>
                                            <strong style={{ color: report.status === 'approved' ? '#166534' : '#991b1b', display: 'block', marginBottom: '0.2rem' }}>
                                                {report.status === 'approved' ? 'Comentario:' : 'Motivo:'}
                                            </strong>
                                            <span style={{ color: '#475569' }}>{report.moderatorComment}</span>
                                        </div>
                                    )}
                                    {report.reportNumber && (
                                        <div style={{ marginTop: '0.55rem' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                N° de reporte: <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-main)' }}>VTI{String(report.reportNumber).padStart(4, '0')}</span>
                                            </span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.9rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                                            <MapPin size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {report.location?.address || (report.location ? `${report.location.lat?.toFixed(4)}, ${report.location.lng?.toFixed(4)}` : 'Sin ubicación')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                                            {(report.timestamp || report.createdAt) && (
                                                <>
                                                    <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>{formatDate(report.timestamp || report.createdAt)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {viewMode === 'community' && (() => {
                                        const reportOwnerId = (report.userId?._id || report.userId)?.toString();
                                        const myId = (user?._id || user?.id)?.toString();
                                        if (!reportOwnerId || !myId) return false;
                                        return reportOwnerId !== myId;
                                    })() && (() => {
                                        const alreadyFlagged = report.flags?.some(f => (f?._id || f)?.toString() === user?._id);
                                        return (
                                            <button
                                                onClick={(e) => !alreadyFlagged && handleFlagReport(e, report._id)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%', marginTop: '0.5rem', marginBottom: 0, background: 'none', border: 'none', boxShadow: 'none', cursor: alreadyFlagged ? 'default' : 'pointer', color: alreadyFlagged ? '#f59e0b' : 'var(--text-muted)', fontSize: '0.72rem', padding: '0.15rem 0', transition: 'color 0.15s', fontFamily: 'inherit', fontWeight: '400', letterSpacing: '0.01em' }}
                                                onMouseEnter={e => { if (!alreadyFlagged) e.currentTarget.style.color = '#f59e0b'; }}
                                                onMouseLeave={e => { if (!alreadyFlagged) e.currentTarget.style.color = 'var(--text-muted)'; }}
                                            >
                                                <Flag size={11} fill={alreadyFlagged ? '#f59e0b' : 'none'} />
                                                {alreadyFlagged ? 'Ya denunciaste este reporte' : '¿Deseas denunciar este reporte?'}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    };

                    const renderSection = (key, title, sectionReports, limit) => {
                        if (sectionReports.length === 0) return null;
                        const expanded = expandedSections[key];
                        const shown = expanded ? sectionReports : sectionReports.slice(0, limit);
                        return (
                            <div key={key} style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>{title}</h3>
                                        <span style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                            {sectionReports.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="report-grid">
                                    {shown.map(r => renderCard(r))}
                                </div>
                                {sectionReports.length > limit && (
                                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))}
                                            style={{ background: 'transparent', border: '1.5px solid var(--border-color)', color: 'var(--primary)', borderRadius: '10px', padding: '0.55rem 1.5rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
                                        >
                                            {expanded ? 'Ver menos ↑' : `Ver más (${sectionReports.length - limit} más) ↓`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    };

                    // ── Community view: sections by date ──
                    if (viewMode === 'community') {
                        const sorted = [...reports].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const sevenDaysAgo = new Date(todayStart); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                        const todayR  = sorted.filter(r => new Date(r.timestamp || r.createdAt) >= todayStart);
                        const weekR   = sorted.filter(r => { const d = new Date(r.timestamp || r.createdAt); return d >= sevenDaysAgo && d < todayStart; });
                        const monthR  = sorted.filter(r => new Date(r.timestamp || r.createdAt) < sevenDaysAgo);
                        const hasAny  = todayR.length + weekR.length + monthR.length > 0;

                        return (
                            <div className="report-section">
                                {loading ? (
                                    <div className="report-grid">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Box key={i} className="report-card modern-report-card">
                                                <Skeleton variant="rectangular" height={220} animation="wave" />
                                                <Box sx={{ p: 'var(--space-md)' }}>
                                                    <Skeleton variant="text" width="60%" height={30} animation="wave" />
                                                    <Skeleton variant="text" width="100%" height={20} animation="wave" />
                                                    <Skeleton variant="text" width="80%" height={20} animation="wave" />
                                                </Box>
                                            </Box>
                                        ))}
                                    </div>
                                ) : !hasAny ? (
                                    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
                                        <p style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay reportes aprobados recientes.</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vuelve más tarde.</p>
                                    </div>
                                ) : (
                                    <>
                                        {renderSection('today', '🕐 Reportes de hoy',           todayR, 4)}
                                        {renderSection('week',  '📅 Reportes de esta semana',    weekR,  4)}
                                        {renderSection('month', '🗓️ Reportes del mes',           monthR, 4)}
                                    </>
                                )}
                            </div>
                        );
                    }

                    // ── My reports view: filter bar + flat grid ──
                    return (
                        <div className="report-section">
                            <div className="filter-bar">
                                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
                                    <option value="all">Todos los tipos</option>
                                    <option value="Traffic">Tráfico</option>
                                    <option value="Accident">Accidente</option>
                                    <option value="Violation">Infracción</option>
                                    <option value="Hazard">Peligro</option>
                                    <option value="RoadWork">Obra en la vía</option>
                                    <option value="Pothole">Bache peligroso</option>
                                    <option value="Flood">Inundación</option>
                                </select>
                                <div className="filter-bar-sep" />
                                <select value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)} className="filter-select">
                                    <option value="all">Todas las provincias</option>
                                    {DR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="filter-bar-sep" />
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                                    <option value="all">Todos los estados</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="approved">Aprobado</option>
                                    <option value="rejected">Rechazado</option>
                                    <option value="sanctioned">Sancionado</option>
                                </select>
                                <div className="filter-bar-sep" />
                                <div className="date-range-group">
                                    <div className="date-range-inputs">
                                        <div className="date-input-wrap">
                                            <span className="date-input-label">Desde</span>
                                            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} className="filter-date" />
                                        </div>
                                        <span className="date-range-sep">—</span>
                                        <div className="date-input-wrap">
                                            <span className="date-input-label">Hasta</span>
                                            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} className="filter-date" />
                                        </div>
                                        {(dateFrom || dateTo) && (
                                            <button className="date-clear-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="report-grid">
                                {loading ? (
                                    Array.from(new Array(6)).map((_, i) => (
                                        <Box key={i} className="report-card modern-report-card">
                                            <Skeleton variant="rectangular" height={220} animation="wave" />
                                            <Box sx={{ p: 'var(--space-md)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Skeleton variant="text" width="60%" height={30} animation="wave" />
                                                    <Skeleton variant="rounded" width={80} height={24} animation="wave" />
                                                </Box>
                                                <Skeleton variant="text" width="100%" height={20} animation="wave" />
                                                <Skeleton variant="text" width="80%" height={20} animation="wave" />
                                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                                                    <Skeleton variant="text" width="40%" height={15} animation="wave" />
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                ) : filteredReports.length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem' }}>
                                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
                                        <p style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                            {reports.length === 0 ? 'No has subido ningún reporte aún.' : 'No hay reportes para este filtro.'}
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {reports.length === 0 ? 'Sé el primero en reportar un incidente.' : 'Prueba seleccionando otro tipo o estado.'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredReports.map(r => renderCard(r))
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {!isModerator && (
                <Link to="/create-report" className="fab">
                    <span className="fab-tooltip">Crea un Reporte</span>
                    <Plus size={32} />
                </Link>
            )}

            {isModalOpen && selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={() => setIsModalOpen(false)}
                    onModerate={() => {}}
                    user={user}
                />
            )}
        </div>
    );
};

export default Dashboard;
