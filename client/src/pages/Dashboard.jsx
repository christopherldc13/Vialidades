import { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MediaGallery from '../components/MediaGallery';
import { Plus, TrendingUp, MapPin, Calendar } from 'lucide-react';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view') || 'community';
    const { user, loading: authLoading } = useContext(AuthContext);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isModerator = ['moderator', 'admin'].includes(user?.role);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const fetchReports = useCallback(async () => {
        try {
            if (isModerator) {
                const [pendingRes, statsRes] = await Promise.all([
                    axios.get('/api/reports?status=pending'),
                    axios.get('/api/reports/stats')
                ]);
                setStats(statsRes.data);
                setReports(pendingRes.data);
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
                <div style={{ padding: '2rem 1.5rem 1rem' }}>

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

                    {/* Header row */}
                    <div className="dashboard-header modern-dashboard-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <h2 style={{ fontSize: '1.85rem', fontWeight: '900', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
                                {isModerator ? 'Panel de Moderación' : 'Reportes de Incidentes'}
                            </h2>
                            {isModerator ? (
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }} />
                                    Sesión activa como Moderador
                                </p>
                            ) : (
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                                    Explora y reporta incidencias viales en tu zona.
                                </p>
                            )}
                        </div>

                        {!isModerator && (
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(e, newView) => { if (newView !== null) setSearchParams({ view: newView }); }}
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

                    {/* Moderator Stats */}
                    {isModerator && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                            {[
                                { key: 'pending',   label: 'Pendientes', icon: <Clock size={20} />,       color: 'var(--warning)',  bg: 'rgba(245,158,11,0.1)',  filter: 'pending'    },
                                { key: 'approved',  label: 'Aprobados',  icon: <CheckCircle size={20} />,  color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', filter: 'approved'   },
                                { key: 'rejected',  label: 'Rechazados', icon: <XCircle size={20} />,      color: 'var(--error)',   bg: 'rgba(239,68,68,0.1)',  filter: 'rejected'   },
                                { key: 'sanctioned',label: 'Sancionados',icon: <AlertCircle size={20} />,  color: '#b91c1c',        bg: 'rgba(185,28,28,0.1)',  filter: 'sanctioned' },
                            ].map(s => (
                                <Tooltip key={s.key} title={`${stats[s.key] || 0} reportes — click para ver`} arrow placement="top">
                                    <Link to={`/moderate?filter=${s.filter}`} className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>{s.label}</div>
                                            <div style={{ background: s.bg, color: s.color, padding: '8px', borderRadius: '12px' }}>{s.icon}</div>
                                        </div>
                                        <div className="stat-value" style={{ fontSize: '2.2rem', fontWeight: '800', color: s.color, marginTop: '0.5rem' }}>{stats[s.key] || 0}</div>
                                    </Link>
                                </Tooltip>
                            ))}
                        </div>
                    )}

                    {isModerator && (
                        <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '3rem' }}>
                            <Link to="/moderate" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2.5rem', borderRadius: '16px', background: 'var(--primary)', color: 'white', fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 10px 15px -3px rgba(99,102,241,0.3)', transition: 'transform 0.2s' }}>
                                <RxDashboard size={24} /> Ir al Panel de Moderación
                            </Link>
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

                        return (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                        <Activity size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Métricas Generales</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
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
                                                <PieChart>
                                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 4px 6px ${entry.color}50)` }} />)}
                                                        <Label value={total} position="center" style={{ fontSize: '2rem', fontWeight: '800', fill: 'var(--text-main)' }} />
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--surface-solid)', color: 'var(--text-main)', fontSize: '0.9rem' }} cursor={false} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="stat-card" style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Flujo de Rendimiento</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Tasa de resolución: <span style={{ color: 'var(--success)', fontWeight: '700' }}>{resRate}%</span></div>
                                            </div>
                                            <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '8px', borderRadius: '12px' }}><BarChart2 size={20} /></div>
                                        </div>
                                        <div style={{ flex: 1, minHeight: 0 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: '0.8rem', fill: 'var(--text-muted)', fontWeight: '600' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: '0.8rem', fill: 'var(--text-muted)', fontWeight: '600' }} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--surface-solid)', color: 'var(--text-main)', fontSize: '0.9rem' }} cursor={{ fill: 'var(--bg-page)', opacity: 0.5 }} />
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
                </div>

                {/* ─── USER REPORT GRID ─── */}
                {!isModerator && (
                    <div style={{ padding: '0 1.5rem' }}>
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
                            ) : reports.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem' }}>
                                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
                                    <p style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        {viewMode === 'my' ? 'No has subido ningún reporte aún.' : 'No hay reportes aprobados recientes.'}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {viewMode === 'my' ? 'Sé el primero en reportar un incidente.' : 'Vuelve más tarde.'}
                                    </p>
                                </div>
                            ) : (
                                reports.map((report) => {
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
                                                {/* Type + Status */}
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

                                                {/* Description */}
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6', flex: 1 }}>
                                                    {report.description}
                                                </p>

                                                {/* Moderator comment */}
                                                {report.moderatorComment && (
                                                    <div style={{ padding: '0.65rem 0.85rem', marginTop: '0.75rem', background: report.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderLeft: `3px solid ${report.status === 'approved' ? '#10b981' : '#ef4444'}`, borderRadius: '6px', fontSize: '0.82rem' }}>
                                                        <strong style={{ color: report.status === 'approved' ? '#166534' : '#991b1b', display: 'block', marginBottom: '0.2rem' }}>
                                                            {report.status === 'approved' ? 'Comentario:' : 'Motivo:'}
                                                        </strong>
                                                        <span style={{ color: '#475569' }}>{report.moderatorComment}</span>
                                                    </div>
                                                )}

                                                {/* Footer */}
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
                                })
                            )}
                        </div>
                    </div>
                )}
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
