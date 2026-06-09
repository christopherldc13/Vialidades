import { useContext, useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import {
    LifeBuoy, HeartHandshake, UserX, Clock, CheckCircle,
    XCircle, Eye, ArrowLeft, ChevronDown, ChevronUp, RefreshCw, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending:   { label: 'Pendiente',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  Icon: Clock },
    in_review: { label: 'En Revisión', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  Icon: Eye },
    resolved:  { label: 'Resuelto',    color: '#10b981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle },
    rejected:  { label: 'Rechazado',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   Icon: XCircle },
};

const TYPE_CONFIG = {
    familiar:     { label: 'Familiar',        color: '#dc2626', Icon: HeartHandshake, law: 'Ley 192-19' },
    unauthorized: { label: 'No Autorizado',   color: '#6366f1', Icon: UserX,          law: 'Ley 172-13' },
};

const FILTER_TABS = [
    { key: '',          label: 'Todas' },
    { key: 'pending',   label: 'Pendientes' },
    { key: 'in_review', label: 'En Revisión' },
    { key: 'resolved',  label: 'Resueltas' },
    { key: 'rejected',  label: 'Rechazadas' },
];

const formatDate = (d) => new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || {};
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.75rem', borderRadius: '99px',
            background: cfg.bg, color: cfg.color,
            fontSize: '0.75rem', fontWeight: '700',
        }}>
            {cfg.Icon && <cfg.Icon size={12} />} {cfg.label}
        </span>
    );
};

const SuperModSupport = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [copiedCase, setCopiedCase] = useState(null);
    const autoOpenDone = useRef(false);

    const copyCase = (caseNumber) => {
        navigator.clipboard.writeText(caseNumber).then(() => {
            setCopiedCase(caseNumber);
            setTimeout(() => setCopiedCase(null), 2000);
        });
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = filter ? { status: filter } : {};
            const res = await axios.get('/api/support', { params });
            setRequests(res.data);
        } catch (err) {
            if (err.response?.status !== 401) toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [filter]);

    useEffect(() => {
        const openCase = location.state?.openCase;
        if (!openCase || requests.length === 0 || autoOpenDone.current) return;
        const match = requests.find(r => r.caseNumber === openCase);
        if (match) {
            setExpanded(match._id);
            autoOpenDone.current = true;
            setTimeout(() => {
                document.getElementById(`case-${match._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 120);
        }
    }, [requests, location.state]);

    if (!user || !['admin', 'supermoderador'].includes(user.role)) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tienes permisos.</div>;
    }

    const handleUpdateStatus = async (id, newStatus) => {
        if (['resolved', 'rejected'].includes(newStatus)) {
            const label = newStatus === 'resolved' ? 'Resolver' : 'Rechazar';
            const { value: resolution, isConfirmed } = await Swal.fire({
                title: `${label} Solicitud`,
                input: 'textarea',
                inputLabel: 'Comentario de resolución',
                inputPlaceholder: 'Describe la acción tomada o el motivo del rechazo...',
                inputAttributes: { rows: 4 },
                showCancelButton: true,
                confirmButtonText: label,
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'swal2-lumina-popup', confirmButton: 'swal2-lumina-confirm' },
                buttonsStyling: false,
                inputValidator: (v) => !v && 'Debes escribir un comentario.',
            });
            if (!isConfirmed) return;
            setUpdating(id);
            try {
                const res = await axios.patch(`/api/support/${id}`, { status: newStatus, resolution });
                setRequests(prev => prev.map(r => r._id === id ? res.data : r));
                toast.success(`Solicitud ${newStatus === 'resolved' ? 'resuelta' : 'rechazada'}`);
            } catch {
                toast.error('Error al actualizar');
            } finally {
                setUpdating(null);
            }
            return;
        }

        setUpdating(id);
        try {
            const res = await axios.patch(`/api/support/${id}`, { status: newStatus });
            setRequests(prev => prev.map(r => r._id === id ? res.data : r));
            toast.success('Estado actualizado');
        } catch {
            toast.error('Error al actualizar');
        } finally {
            setUpdating(null);
        }
    };

    const counts = FILTER_TABS.reduce((acc, t) => {
        acc[t.key] = t.key === '' ? requests.length : requests.filter(r => r.status === t.key).length;
        return acc;
    }, {});

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <style>{`@keyframes fadeInOut { 0%{opacity:0;transform:translateX(-4px)} 15%{opacity:1;transform:translateX(0)} 75%{opacity:1} 100%{opacity:0} }`}</style>
            <Navbar />
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/supermoderador" style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'var(--surface)', border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                        }}>
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                                <LifeBuoy size={20} color="#dc2626" />
                                <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                    Solicitudes de Soporte
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Eliminación de contenido — Ley 192-19 y Ley 172-13
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchRequests}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', borderRadius: '10px', flexShrink: 0,
                            background: 'var(--surface)', border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)', cursor: 'pointer',
                            fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap',
                            width: 'fit-content',
                        }}
                    >
                        <RefreshCw size={15} /> Actualizar
                    </button>
                </div>

                {/* Filter stat cards */}
                {(() => {
                    const allRequests = requests;
                    const TABS_WITH_META = [
                        { key: '',          label: 'Todas',       color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
                        { key: 'pending',   label: 'Pendientes',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                        { key: 'in_review', label: 'En Revisión', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                        { key: 'resolved',  label: 'Resueltas',   color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                        { key: 'rejected',  label: 'Rechazadas',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
                    ];
                    return (
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                            {TABS_WITH_META.map(t => {
                                const count = t.key === '' ? allRequests.length : allRequests.filter(r => r.status === t.key).length;
                                const active = filter === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => { setFilter(t.key); setExpanded(null); }}
                                        style={{
                                            flex: '1', minWidth: '110px',
                                            padding: '1rem 1.1rem',
                                            background: active ? t.bg : 'var(--surface)',
                                            border: `1px solid ${active ? t.color + '35' : 'var(--border-color)'}`,
                                            borderTop: active ? `3px solid ${t.color}` : '3px solid transparent',
                                            borderRadius: '14px', cursor: 'pointer',
                                            textAlign: 'left', transition: 'all 0.15s',
                                            boxShadow: active ? `0 4px 16px ${t.color}15` : 'none',
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '1.6rem', fontWeight: '900', lineHeight: 1,
                                            color: active ? t.color : 'var(--text-main)',
                                            marginBottom: '0.3rem',
                                        }}>
                                            {count}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: '600', color: active ? t.color : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {t.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    );
                })()}

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando solicitudes...</div>
                ) : requests.length === 0 ? (
                    <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border-color)',
                        borderRadius: '20px', padding: '4rem', textAlign: 'center',
                    }}>
                        <LifeBuoy size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600', margin: 0 }}>No hay solicitudes {filter ? 'con este estado' : 'registradas'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {requests.map(req => {
                            const typeCfg = TYPE_CONFIG[req.type] || {};
                            const isOpen = expanded === req._id;

                            return (
                                <div
                                    key={req._id}
                                    id={`case-${req._id}`}
                                    style={{
                                        background: 'var(--surface)', border: '1px solid var(--border-color)',
                                        borderRadius: '18px', overflow: 'hidden',
                                        borderLeft: `3px solid ${typeCfg.color}`,
                                        transition: 'box-shadow 0.2s',
                                        ...(expanded === req._id && location.state?.openCase === req.caseNumber
                                            ? { boxShadow: `0 0 0 2px ${typeCfg.color}60` }
                                            : {}),
                                    }}
                                >
                                    {/* Row header */}
                                    <div
                                        onClick={() => setExpanded(isOpen ? null : req._id)}
                                        style={{
                                            padding: '1rem 1.25rem',
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            cursor: 'pointer', flexWrap: 'wrap',
                                        }}
                                    >
                                        {/* Type icon */}
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                            background: `${typeCfg.color}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {typeCfg.Icon && <typeCfg.Icon size={18} color={typeCfg.color} />}
                                        </div>

                                        {/* Main info */}
                                        <div style={{ flex: 1, minWidth: '0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                    {req.requesterName}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: '600', padding: '0.15rem 0.6rem',
                                                    borderRadius: '99px', background: `${typeCfg.color}15`, color: typeCfg.color,
                                                }}>
                                                    {typeCfg.label} · {typeCfg.law}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {req.requesterEmail}
                                                {req.victimName && <> · Sobre: <strong style={{ color: 'var(--text-light)' }}>{req.victimName}</strong></>}
                                            </div>
                                        </div>

                                        {/* Status + date + chevron */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                            <StatusBadge status={req.status} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {formatDate(req.createdAt)}
                                            </span>
                                            {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                                        </div>
                                    </div>

                                    {/* Expanded detail */}
                                    {isOpen && (
                                        <div style={{ borderTop: `2px solid ${typeCfg.color}25`, background: 'var(--bg-input)' }}>

                                            {/* Case number banner */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '0.75rem 1.25rem',
                                                background: `${typeCfg.color}08`,
                                                borderBottom: '1px solid var(--border-color)',
                                                flexWrap: 'wrap', gap: '0.5rem',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '28px' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: '28px' }}>Caso</span>
                                                    <code style={{
                                                        display: 'flex', alignItems: 'center',
                                                        height: '28px', boxSizing: 'border-box',
                                                        fontSize: '0.85rem', fontWeight: '800', fontFamily: 'monospace',
                                                        color: typeCfg.color, letterSpacing: '0.06em',
                                                        background: `${typeCfg.color}12`, border: `1px solid ${typeCfg.color}30`,
                                                        padding: '0 0.65rem', borderRadius: '6px',
                                                    }}>{req.caseNumber}</code>
                                                    <button
                                                        onClick={() => copyCase(req.caseNumber)}
                                                        title="Copiar número de caso"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '28px', height: '28px', padding: 0, margin: 0, borderRadius: '7px',
                                                            background: copiedCase === req.caseNumber ? 'rgba(16,185,129,0.12)' : 'var(--surface)',
                                                            border: `1px solid ${copiedCase === req.caseNumber ? 'rgba(16,185,129,0.35)' : 'var(--border-color)'}`,
                                                            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, boxSizing: 'border-box',
                                                        }}
                                                        onMouseEnter={e => { if (copiedCase !== req.caseNumber) e.currentTarget.style.borderColor = typeCfg.color; }}
                                                        onMouseLeave={e => { if (copiedCase !== req.caseNumber) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                                    >
                                                        {copiedCase === req.caseNumber
                                                            ? <Check size={14} color="#10b981" />
                                                            : <Copy size={14} color="var(--text-muted)" />}
                                                    </button>
                                                    {copiedCase === req.caseNumber && (
                                                        <span style={{
                                                            fontSize: '0.72rem', fontWeight: '700', color: '#10b981',
                                                            letterSpacing: '0.03em', lineHeight: '28px',
                                                            animation: 'fadeInOut 2s ease forwards',
                                                        }}>
                                                            Copiado
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Recibido: {formatDate(req.createdAt)}
                                                </span>
                                            </div>

                                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                                {/* Contact + identity */}
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <span style={{ width: '16px', height: '1px', background: 'var(--border-color)', display: 'inline-block' }} />
                                                        Datos del Solicitante
                                                        <span style={{ flex: 1, height: '1px', background: 'var(--border-color)', display: 'inline-block' }} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                                        {[
                                                            { label: 'Nombre', value: req.requesterName },
                                                            { label: 'Correo', value: req.requesterEmail },
                                                            req.requesterPhone && { label: 'Teléfono', value: req.requesterPhone },
                                                            req.requesterCedula && { label: 'Cédula', value: req.requesterCedula },
                                                        ].filter(Boolean).map((f, i) => (
                                                            <div key={i} style={{
                                                                background: 'var(--surface)', border: '1px solid var(--border-color)',
                                                                borderRadius: '10px', padding: '0.65rem 0.85rem',
                                                            }}>
                                                                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{f.label}</div>
                                                                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '600' }}>{f.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Case details */}
                                                {(req.relationship || req.victimName || req.reportId) && (
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <span style={{ width: '16px', height: '1px', background: 'var(--border-color)', display: 'inline-block' }} />
                                                            Detalles del Caso
                                                            <span style={{ flex: 1, height: '1px', background: 'var(--border-color)', display: 'inline-block' }} />
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                                            {[
                                                                req.relationship && { label: 'Parentesco', value: req.relationship },
                                                                req.victimName && { label: 'Persona en reporte', value: req.victimName },
                                                                req.reportId && { label: 'Nº Reporte', value: req.reportId },
                                                            ].filter(Boolean).map((f, i) => (
                                                                <div key={i} style={{
                                                                    background: 'var(--surface)', border: `1px solid ${typeCfg.color}25`,
                                                                    borderRadius: '10px', padding: '0.65rem 0.85rem',
                                                                }}>
                                                                    <div style={{ fontSize: '0.68rem', fontWeight: '700', color: typeCfg.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem', opacity: 0.8 }}>{f.label}</div>
                                                                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '600' }}>{f.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Description + reason */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                    {req.reportDescription && (
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Descripción del Reporte</div>
                                                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.65, background: 'var(--surface)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                                {req.reportDescription}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Motivo de la Solicitud</div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.65, background: 'var(--surface)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                            {req.reason}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Resolution */}
                                                {req.resolution && (
                                                    <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <CheckCircle size={13} /> Resolución
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.65 }}>
                                                            {req.resolution}
                                                        </p>
                                                        {req.resolvedBy && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                                                {req.resolvedBy.firstName} {req.resolvedBy.lastName} · {formatDate(req.resolvedAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                {!['resolved', 'rejected'].includes(req.status) && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: req.status === 'pending' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.6rem' }}>
                                                        {req.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(req._id, 'in_review')}
                                                                disabled={updating === req._id}
                                                                style={{
                                                                    padding: '0.75rem 1rem', borderRadius: '12px',
                                                                    background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                                                                    border: '1px solid rgba(99,102,241,0.25)',
                                                                    fontWeight: '700', fontSize: '0.83rem', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                                                    transition: 'background 0.15s',
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                                                            >
                                                                <Eye size={15} /> Marcar En Revisión
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleUpdateStatus(req._id, 'resolved')}
                                                            disabled={updating === req._id}
                                                            style={{
                                                                padding: '0.75rem 1rem', borderRadius: '12px',
                                                                background: 'linear-gradient(135deg, #10b981, #34d399)',
                                                                color: '#fff', border: 'none',
                                                                fontWeight: '700', fontSize: '0.83rem', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                                                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                                                                transition: 'opacity 0.15s, transform 0.12s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
                                                        >
                                                            <CheckCircle size={15} /> Resolver Solicitud
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(req._id, 'rejected')}
                                                            disabled={updating === req._id}
                                                            style={{
                                                                padding: '0.75rem 1rem', borderRadius: '12px',
                                                                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                                border: '1px solid rgba(239,68,68,0.25)',
                                                                fontWeight: '700', fontSize: '0.83rem', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                                                transition: 'background 0.15s',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                                        >
                                                            <XCircle size={15} /> Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperModSupport;
