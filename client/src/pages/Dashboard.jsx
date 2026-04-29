import { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import { Plus, TrendingUp, MapPin, Calendar, MessageSquare, Mail } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Skeleton, Box, ToggleButton, ToggleButtonGroup, CircularProgress, Tooltip } from '@mui/material';
import AuthContext from '../context/AuthContext';
import ReportDetailModal from '../components/ReportDetailModal';
import { Clock, CheckCircle, XCircle, AlertCircle, PieChart as PieChartIcon, Activity, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MdWavingHand } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { RiUserCommunityLine } from "react-icons/ri";
import { TbReportSearch } from "react-icons/tb";
import './DashboardExtras.css';
import { FaCar, FaCarCrash } from "react-icons/fa";
import { BsSignStopFill } from "react-icons/bs";
import { LuTriangleAlert } from "react-icons/lu";
import { IoMdHelpCircle } from "react-icons/io";
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

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
    Traffic:   { label: 'Tráfico',    icon: <FaCar />,           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
    Accident:  { label: 'Accidente',  icon: <FaCarCrash />,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    Violation: { label: 'Infracción', icon: <BsSignStopFill />,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    Hazard:    { label: 'Peligro',    icon: <LuTriangleAlert />, color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
};

const STATUS_CONFIG = {
    pending:   { label: 'Pendiente',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    approved:  { label: 'Aprobado',    color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
    rejected:  { label: 'Rechazado',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    sanctioned:{ label: 'Sancionado',  color: '#b91c1c', bg: 'rgba(185,28,28,0.12)'   },
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
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, sanctioned: 0 });
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
    const isModerator = ['moderator', 'admin'].includes(user?.role);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        setTypeFilter('all');
        setStatusFilter('all');
        setProvinceFilter('all');
        setDateFrom('');
        setDateTo('');
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
        const handleStatusUpdate = () => { fetchReports(); };
        socket.on('new_report', handleNewReport);
        socket.on('report_status_updated', handleStatusUpdate);
        return () => {
            socket.off('new_report', handleNewReport);
            socket.off('report_status_updated', handleStatusUpdate);
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
                                { key: 'pending',    label: 'Pendientes',  desc: 'Esperando revisión', icon: <Clock size={22} />,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  filter: 'pending'    },
                                { key: 'approved',   label: 'Aprobados',   desc: 'Verificados',        icon: <CheckCircle size={22} />,   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  filter: 'approved'   },
                                { key: 'rejected',   label: 'Rechazados',  desc: 'No aprobados',       icon: <XCircle size={22} />,       color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   filter: 'rejected'   },
                                { key: 'sanctioned', label: 'Sancionados', desc: 'Con infracción',     icon: <AlertCircle size={22} />,   color: '#b91c1c', bg: 'rgba(185,28,28,0.1)',   filter: 'sanctioned' },
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
                        const chartData = [
                            { name: 'Pendientes', value: stats.pending || 0, color: '#f59e0b' },
                            { name: 'Aprobados',  value: stats.approved || 0,  color: '#10b981' },
                            { name: 'Rechazados', value: stats.rejected || 0,  color: '#ef4444' },
                            { name: 'Sancionados',value: stats.sanctioned || 0,color: '#b91c1c' },
                        ].filter(i => i.value > 0);

                        if (chartData.length === 0) return null;
                        const total = chartData.reduce((a, c) => a + c.value, 0);
                        const processed = (stats.approved || 0) + (stats.rejected || 0) + (stats.sanctioned || 0);
                        const resRate = total > 0 ? Math.round((processed / total) * 100) : 0;

                        const CustomTooltip = ({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div style={{
                                        background: 'var(--surface-solid)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '0.75rem 1rem',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                        color: 'var(--text-main)'
                                    }}>
                                        <div style={{ fontWeight: '700', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                                            {data.name || label}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: data.color || payload[0].color || 'var(--primary)' }}></div>
                                            <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{payload[0].value}</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        };

                        return (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', padding: '8px', borderRadius: '10px', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>Métricas Generales</h3>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>Distribución y flujo de todos los reportes</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '0.4rem 0.85rem' }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                                        <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '700' }}>Tasa de resolución: {resRate}%</span>
                                    </div>
                                </div>
                                <div className="chart-grid">
                                    <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Distribución de Estados</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total: {total} incidentes</div>
                                            </div>
                                            <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '12px' }}><PieChartIcon size={20} /></div>
                                        </div>
                                        <div style={{ flex: 1, minHeight: 0 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart style={{ outline: 'none' }}>
                                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" strokeWidth={0} activeShape={false}>
                                                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                        <Label value={total} position="center" style={{ fontSize: '2rem', fontWeight: '800', fill: 'var(--text-main)' }} />
                                                    </Pie>
                                                    <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Flujo de Rendimiento</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Comparativa por estado</div>
                                            </div>
                                            <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '8px', borderRadius: '12px' }}><BarChart2 size={20} /></div>
                                        </div>
                                        <div style={{ flex: 1, minHeight: 0 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: '0.8rem', fill: 'var(--text-muted)', fontWeight: '600' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: '0.8rem', fill: 'var(--text-muted)', fontWeight: '600' }} />
                                                    <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
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
                            <div className="feedback-grid">
                                {suggestions.map((s) => (
                                    <div key={s._id} className="stat-card" style={{
                                        background: 'var(--surface-solid)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '16px',
                                        padding: '1.25rem',
                                        display: 'flex', flexDirection: 'column', gap: '0.85rem',
                                    }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                                                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: '800', fontSize: '1rem',
                                                boxShadow: '0 4px 10px rgba(99,102,241,0.3)',
                                            }}>
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {s.name}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                                    <Mail size={11} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {formatDate(s.createdAt)}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ height: '1px', background: 'var(--border-color)' }} />

                                        {/* Message */}
                                        <p style={{
                                            margin: 0, fontSize: '0.87rem', color: 'var(--text-light)',
                                            lineHeight: '1.65', display: '-webkit-box',
                                            WebkitLineClamp: 5, WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {s.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── USER REPORT SECTION ─── */}
                {!isModerator && (() => {
                    const renderCard = (report) => {
                        const typeColor = getIncidentColor(report.type);
                        const typeBg = getIncidentBg(report.type);
                        const statusKey = report.wasSanctioned ? 'sanctioned' : report.status;
                        const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                        return (
                            <div
                                key={report._id}
                                className="report-card modern-report-card"
                                onClick={() => { setSelectedReport(report); setIsModalOpen(true); }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="report-image-container">
                                    <MediaGallery media={report.media?.length > 0 ? report.media : (report.photos || [])} />
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
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.9rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                                            <MapPin size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {report.location?.address || (report.location ? `${report.location.lat?.toFixed(4)}, ${report.location.lng?.toFixed(4)}` : 'Sin ubicación')}
                                            </span>
                                        </div>
                                        {(report.timestamp || report.createdAt) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                                                <Calendar size={12} color="var(--text-muted)" />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{formatDate(report.timestamp || report.createdAt)}</span>
                                            </div>
                                        )}
                                    </div>
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
                                        {renderSection('today', '🕐 Reportes de hoy',           todayR, 3)}
                                        {renderSection('week',  '📅 Reportes de esta semana',    weekR,  3)}
                                        {renderSection('month', '🗓️ Reportes del mes',           monthR, 3)}
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
