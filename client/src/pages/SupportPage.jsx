import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
    HeartHandshake, UserX, LifeBuoy, User as UserIcon,
    Mail, Phone, CreditCard, FileText, Send, ChevronDown,
    Search, CheckCircle2, Clock, XCircle, Eye, Hash, Calendar, Tag
} from 'lucide-react';

const TABS = [
    {
        key: 'familiar',
        label: 'Solicitud de Familiar',
        Icon: HeartHandshake,
        color: '#dc2626',
        gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
        law: 'Ley 192-19',
        description: 'Para familiares o representantes legales de personas fallecidas o gravemente lesionadas que aparecen en un reporte.',
    },
    {
        key: 'unauthorized',
        label: 'Contenido No Autorizado',
        Icon: UserX,
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
        law: 'Ley 172-13',
        description: 'Para personas cuya imagen o datos personales aparecen en un reporte sin su consentimiento.',
    },
];

const RELATIONSHIPS = [
    'Hijo/a', 'Padre/Madre', 'Hermano/a', 'Cónyuge',
    'Abuelo/a', 'Tío/a', 'Sobrino/a', 'Representante Legal', 'Otro',
];

const EMPTY_FORM = {
    requesterName: '', requesterEmail: '', requesterPhone: '', requesterCedula: '',
    relationship: '', victimName: '', reportId: '', reportDescription: '', reason: '',
};

const Field = ({ icon, label, name, value, onChange, required, placeholder, type = 'text' }) => (
    <div>
        <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            {label}
        </label>
        <div style={{ position: 'relative' }}>
            {icon && (
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    {icon}
                </span>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                style={{
                    width: '100%', height: '48px',
                    paddingLeft: icon ? '2.75rem' : '1rem', paddingRight: '1rem',
                    background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', color: 'var(--text-main)',
                    fontSize: '0.9rem', boxSizing: 'border-box',
                }}
            />
        </div>
    </div>
);

const TYPE_CONFIG = {
    familiar:     { label: 'Solicitud de Familiar', color: '#dc2626', Icon: HeartHandshake, law: 'Ley 192-19' },
    unauthorized: { label: 'Contenido No Autorizado', color: '#6366f1', Icon: UserX,          law: 'Ley 172-13' },
};

const STEPS = [
    { key: 'pending',   label: 'Recibida',     Icon: CheckCircle2, description: 'Tu solicitud fue registrada exitosamente.' },
    { key: 'in_review', label: 'En Revisión',  Icon: Eye,          description: 'Nuestro equipo está revisando tu caso.' },
    { key: 'done',      label: 'Finalizada',   Icon: CheckCircle2, description: 'Tu solicitud ha sido procesada.' },
];

const getStepIndex = (status) => {
    if (status === 'pending')   return 0;
    if (status === 'in_review') return 1;
    return 2;
};

const STATUS_FINAL = {
    resolved: { label: 'Resuelta',   color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', Icon: CheckCircle2 },
    rejected: { label: 'Rechazada',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  Icon: XCircle },
};

const formatDate = (d) => new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const STEP_META = [
    {
        label: 'Recibida',
        sublabel: 'Solicitud registrada',
        Icon: CheckCircle2,
        activeColor: '#6366f1',
    },
    {
        label: 'En Revisión',
        sublabel: 'Equipo evaluando',
        Icon: Eye,
        activeColor: '#f59e0b',
    },
    {
        label: 'Finalizada',
        sublabel: 'Caso cerrado',
        Icon: CheckCircle2,
        activeColor: '#10b981',
    },
];

const CaseStatusCard = ({ case_: c }) => {
    const typeCfg = TYPE_CONFIG[c.type] || {};
    const stepIdx = getStepIndex(c.status);
    const isFinal = ['resolved', 'rejected'].includes(c.status);
    const finalCfg = STATUS_FINAL[c.status];

    const statusBannerColor = isFinal
        ? (c.status === 'resolved' ? '#10b981' : '#ef4444')
        : stepIdx === 1 ? '#f59e0b' : '#6366f1';
    const statusBannerLabel = isFinal
        ? (c.status === 'resolved' ? 'Solicitud Resuelta' : 'Solicitud Rechazada')
        : stepIdx === 0 ? 'En espera de revisión' : 'En revisión por el equipo';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{
                background: 'var(--surface)',
                border: `1px solid ${isFinal ? finalCfg.border : 'var(--border-color)'}`,
                borderRadius: '24px', overflow: 'hidden',
            }}
        >
            {/* Status banner */}
            <div style={{
                padding: '1.25rem 1.75rem',
                background: `${statusBannerColor}12`,
                borderBottom: `1px solid ${statusBannerColor}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: statusBannerColor,
                        boxShadow: `0 0 0 3px ${statusBannerColor}30`,
                        flexShrink: 0,
                        animation: !isFinal ? 'pulse 2s infinite' : 'none',
                    }} />
                    <span style={{ fontWeight: '800', fontSize: '0.95rem', color: statusBannerColor }}>
                        {statusBannerLabel}
                    </span>
                </div>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.25rem 0.8rem', borderRadius: '99px',
                    background: `${typeCfg.color}12`, color: typeCfg.color,
                    fontSize: '0.73rem', fontWeight: '700',
                }}>
                    {typeCfg.Icon && <typeCfg.Icon size={12} />} {typeCfg.label} · {typeCfg.law}
                </span>
            </div>

            {/* Case number */}
            <div style={{
                padding: '1.25rem 1.75rem 0',
                display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
                <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
                        Número de Caso
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'monospace', letterSpacing: '3px' }}>
                        {c.caseNumber}
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div style={{ padding: '1.75rem' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>

                    {/* Track background */}
                    <div style={{
                        position: 'absolute', top: '24px', left: '25px', right: '25px',
                        height: '4px', background: 'var(--border-color)', borderRadius: '99px', zIndex: 0,
                    }} />
                    {/* Track fill */}
                    <div style={{
                        position: 'absolute', top: '24px', left: '25px',
                        height: '4px', borderRadius: '99px', zIndex: 1,
                        width: stepIdx === 0 ? '0%' : stepIdx === 1 ? 'calc(50% - 0px)' : 'calc(100% - 50px)',
                        background: isFinal && c.status === 'rejected'
                            ? 'linear-gradient(90deg,#6366f1,#ef4444)'
                            : 'linear-gradient(90deg,#6366f1,#10b981)',
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />

                    {STEP_META.map((step, i) => {
                        const done = i < stepIdx || (i === 2 && isFinal);
                        const active = i === stepIdx && !isFinal;
                        const isFinalStep = i === 2;

                        const circleColor = done
                            ? (isFinalStep && c.status === 'rejected' ? '#ef4444' : '#10b981')
                            : active ? step.activeColor : 'var(--text-muted)';

                        const circleBg = done
                            ? (isFinalStep && c.status === 'rejected' ? '#ef4444' : '#10b981')
                            : active ? step.activeColor : 'var(--surface)';

                        const StepIcon = isFinalStep && isFinal && c.status === 'rejected' ? XCircle : step.Icon;

                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                                <div style={{
                                    width: '50px', height: '50px', borderRadius: '50%',
                                    background: done || active ? circleBg : 'var(--surface)',
                                    border: `2.5px solid ${done || active ? circleBg : 'var(--border-color)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '0.7rem',
                                    boxShadow: active
                                        ? `0 0 0 5px ${circleColor}20, 0 4px 16px ${circleColor}40`
                                        : done ? `0 4px 12px ${circleColor}30` : 'none',
                                    transition: 'all 0.4s ease',
                                    position: 'relative',
                                }}>
                                    <StepIcon size={22} color={done || active ? 'white' : 'var(--text-muted)'} strokeWidth={2.5} />
                                </div>
                                <span style={{
                                    fontSize: '0.78rem', fontWeight: done || active ? '800' : '500',
                                    color: done || active ? circleColor : 'var(--text-muted)',
                                    textAlign: 'center', lineHeight: 1.3,
                                }}>
                                    {isFinalStep && isFinal ? (c.status === 'resolved' ? 'Resuelta' : 'Rechazada') : step.label}
                                </span>
                                <span style={{
                                    fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500',
                                    textAlign: 'center', marginTop: '0.15rem',
                                }}>
                                    {isFinalStep && isFinal
                                        ? (c.status === 'resolved' ? 'Procesada' : 'No procedió')
                                        : step.sublabel}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Status message box */}
                <div style={{
                    background: `${statusBannerColor}08`,
                    border: `1px solid ${statusBannerColor}20`,
                    borderRadius: '14px', padding: '1rem 1.25rem',
                    marginBottom: c.resolution ? '1rem' : '1.25rem',
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                        background: `${statusBannerColor}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {isFinal
                            ? (c.status === 'resolved' ? <CheckCircle2 size={17} color="#10b981" /> : <XCircle size={17} color="#ef4444" />)
                            : stepIdx === 1 ? <Eye size={17} color="#f59e0b" /> : <Clock size={17} color="#6366f1" />
                        }
                    </div>
                    <div>
                        <p style={{ margin: '0 0 0.15rem', fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            {isFinal
                                ? (c.status === 'resolved' ? 'Solicitud procesada correctamente' : 'Solicitud no pudo ser procesada')
                                : stepIdx === 0 ? 'Recibida — pendiente de asignación' : 'Nuestro equipo está evaluando tu caso'
                            }
                        </p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {isFinal
                                ? 'El equipo de moderación ha dado respuesta a tu solicitud.'
                                : stepIdx === 0
                                    ? 'Tu solicitud fue recibida y será asignada a un moderador en breve.'
                                    : 'Recibirás una notificación al correo cuando haya una respuesta.'
                            }
                        </p>
                    </div>
                </div>

                {/* Resolution */}
                {c.resolution && (
                    <div style={{
                        background: isFinal ? finalCfg.bg : 'var(--bg-input)',
                        border: `1px solid ${isFinal ? finalCfg.border : 'var(--border-color)'}`,
                        borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem',
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: isFinal ? finalCfg.color : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <UserIcon size={12} /> Respuesta del equipo de moderación
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.7, fontStyle: 'italic' }}>
                            "{c.resolution}"
                        </p>
                    </div>
                )}

                {/* Meta row */}
                <div style={{
                    display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
                    paddingTop: '1rem', borderTop: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.35rem 0.75rem', borderRadius: '99px' }}>
                        <Calendar size={12} /> {formatDate(c.createdAt)}
                    </div>
                    {c.resolvedAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.35rem 0.75rem', borderRadius: '99px' }}>
                            <CheckCircle2 size={12} /> Resuelta: {formatDate(c.resolvedAt)}
                        </div>
                    )}
                    {c.victimName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.35rem 0.75rem', borderRadius: '99px' }}>
                            <Tag size={12} /> {c.victimName}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.4); }
                }
            `}</style>
        </motion.div>
    );
};

const SupportPage = () => {
    const [pageMode, setPageMode] = useState('form'); // 'form' | 'lookup'
    const [activeTab, setActiveTab] = useState('familiar');
    const [form, setForm] = useState(EMPTY_FORM);
    const [sending, setSending] = useState(false);

    const [caseInput, setCaseInput] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [caseResult, setCaseResult] = useState(null);
    const [lookupError, setLookupError] = useState('');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const tab = TABS.find(t => t.key === activeTab);

    const formatPhone = (val) => {
        const d = val.replace(/\D/g, '').slice(0, 10);
        if (d.length <= 3) return d;
        if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    };

    const formatCedula = (val) => {
        const d = val.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 3) return d;
        if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formatted = value;
        if (name === 'requesterPhone') formatted = formatPhone(value);
        if (name === 'requesterCedula') formatted = formatCedula(value);
        setForm({ ...form, [name]: formatted });
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!caseInput.trim()) return;
        setLookupLoading(true);
        setLookupError('');
        setCaseResult(null);
        try {
            const res = await axios.get(`/api/support/case/${caseInput.trim().toUpperCase()}`);
            setCaseResult(res.data);
        } catch (err) {
            setLookupError(err.response?.data?.msg || 'No se encontró ningún caso con ese número.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleSwitchMode = (mode) => {
        setPageMode(mode);
        setCaseResult(null);
        setLookupError('');
        setCaseInput('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        setForm(EMPTY_FORM);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await axios.post('/api/support', { type: activeTab, ...form });
            const caseNum = res.data.caseNumber;
            setSending(false);
            setForm(EMPTY_FORM);
            Swal.fire({
                icon: 'success',
                title: '¡Solicitud Enviada!',
                html: `
                    <p style="margin-bottom:0.75rem;font-size:0.88rem;line-height:1.5">Tu solicitud fue recibida. Recibirás una respuesta en <strong>${form.requesterEmail}</strong> en las próximas 72 horas hábiles.</p>
                    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:12px;padding:14px;margin:0.5rem 0">
                        <p style="margin:0 0 4px;font-size:10px;color:#fca5a5;font-weight:700;letter-spacing:2px;text-transform:uppercase">Número de Caso</p>
                        <p style="margin:0 0 10px;font-size:20px;font-weight:900;color:#fff;letter-spacing:3px;font-family:monospace">${caseNum}</p>
                        <button id="copy-case-btn" onclick="navigator.clipboard.writeText('${caseNum}').then(()=>{this.textContent='✓ Copiado';this.style.background='rgba(255,255,255,0.25)';setTimeout(()=>{this.textContent='Copiar número';this.style.background='rgba(255,255,255,0.12)'},2000)})" style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.3);border-radius:8px;color:#fff;font-size:12px;font-weight:700;padding:5px 16px;cursor:pointer;letter-spacing:0.5px;transition:background 0.2s">Copiar número</button>
                    </div>
                    <p style="font-size:0.75rem;color:#6b7280;margin-top:0.6rem">Guarda este número para consultar el estado de tu solicitud.</p>
                `,
                confirmButtonText: 'Entendido',
                width: 'min(360px, 92vw)',
                customClass: { popup: 'swal2-lumina-popup', confirmButton: 'swal2-lumina-confirm' },
                buttonsStyling: false,
            });
        } catch (err) {
            setSending(false);
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar',
                text: err.response?.data?.msg || 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
                confirmButtonText: 'Cerrar',
                customClass: { popup: 'swal2-lumina-popup', confirmButton: 'swal2-lumina-confirm' },
                buttonsStyling: false,
            });
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Navbar />

            {/* Hero */}
            <section style={{ padding: '5rem 1.5rem 3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: '700px', height: '400px',
                    background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)',
                    filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
                }} />
                <motion.div
                    style={{ position: 'relative', zIndex: 1 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 1.2rem',
                        background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                        borderRadius: '99px', color: '#dc2626', fontWeight: '700', fontSize: '0.9rem',
                        marginBottom: '1.5rem',
                    }}>
                        <LifeBuoy size={18} /> Centro de Soporte
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900',
                        color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1,
                        marginBottom: '1rem', margin: '0 auto 1rem',
                    }}>
                        Solicitud de Eliminación<br />
                        <span style={{ color: '#dc2626' }}>de Contenido</span>
                    </h1>
                    <p style={{
                        fontSize: '1.05rem', color: 'var(--text-light)',
                        maxWidth: '580px', margin: '0 auto 1.75rem', lineHeight: 1.7,
                    }}>
                        Si tú o un familiar aparece en un reporte sin haber autorizado el contenido, puedes solicitar su eliminación aquí de forma gratuita y confidencial.
                    </p>
                    {/* Checkmarks */}
                    <div style={{
                        display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center',
                        fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600',
                        marginBottom: '2.5rem',
                    }}>
                        {['Sin necesidad de cuenta', 'Proceso gratuito', 'Respuesta en 72 h hábiles'].map(t => (
                            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{
                                    width: '18px', height: '18px', borderRadius: '50%',
                                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#10b981', fontSize: '0.65rem', fontWeight: '900', flexShrink: 0,
                                }}>✓</span>
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Mode switcher */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            background: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '0.3rem',
                            gap: '0.25rem',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        }}>
                            {[
                                { key: 'form',   label: 'Nueva Solicitud', Icon: Send },
                                { key: 'lookup', label: 'Consultar Estado', Icon: Search },
                            ].map(({ key, label, Icon }) => {
                                const active = pageMode === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleSwitchMode(key)}
                                        style={{
                                            padding: '0.65rem 1.5rem',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: active ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'transparent',
                                            color: active ? 'white' : 'var(--text-muted)',
                                            fontWeight: '700',
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s',
                                            boxShadow: active ? '0 4px 12px rgba(220,38,38,0.3)' : 'none',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <Icon size={15} /> {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── LOOKUP SECTION ── */}
            <AnimatePresence mode="wait">
            {pageMode === 'lookup' && (
                <motion.section
                    key="lookup"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    style={{ padding: '0 1.5rem 6rem' }}
                >
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        {/* Search card */}
                        <div style={{
                            background: 'var(--surface)', border: '1px solid var(--border-color)',
                            borderRadius: '24px', padding: '2rem', marginBottom: '1.5rem',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #dc2626, #6366f1)' }} />
                            <p style={{ fontSize: '0.73rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
                                Consultar número de caso
                            </p>
                            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                                    <Hash size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        value={caseInput}
                                        onChange={e => { setCaseInput(e.target.value.toUpperCase()); setLookupError(''); }}
                                        placeholder="VIL-XXXXXXX"
                                        style={{
                                            width: '100%', height: '52px', paddingLeft: '2.75rem', paddingRight: '1rem',
                                            background: 'var(--bg-input)', border: `1px solid ${lookupError ? '#ef4444' : 'var(--border-color)'}`,
                                            borderRadius: '14px', color: 'var(--text-main)',
                                            fontSize: '1rem', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '2px',
                                            textTransform: 'uppercase', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={lookupLoading || !caseInput.trim()}
                                    style={{
                                        height: '52px', padding: '0 1.75rem', borderRadius: '14px',
                                        background: lookupLoading ? 'var(--border-color)' : '#dc2626',
                                        color: 'white', fontWeight: '800', fontSize: '0.9rem',
                                        border: 'none', cursor: lookupLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Search size={17} /> {lookupLoading ? 'Buscando...' : 'Consultar'}
                                </button>
                            </form>
                            {lookupError && (
                                <p style={{ margin: '0.75rem 0 0', fontSize: '0.83rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <XCircle size={15} /> {lookupError}
                                </p>
                            )}
                        </div>

                        {/* Result card */}
                        <AnimatePresence>
                        {caseResult && <CaseStatusCard case_={caseResult} />}
                        </AnimatePresence>

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                                ← Volver al inicio
                            </Link>
                        </div>
                    </div>
                </motion.section>
            )}
            </AnimatePresence>

            {/* Form section */}
            <AnimatePresence mode="wait">
            {pageMode === 'form' && (
            <motion.section
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                style={{ padding: '0 1.5rem 6rem' }}
            >
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>

                    {/* Type tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
                        {TABS.map(t => (
                            <motion.button
                                key={t.key}
                                onClick={() => handleTabChange(t.key)}
                                whileHover={{ y: -2 }}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderRadius: '20px',
                                    border: activeTab === t.key ? `2px solid ${t.color}` : '2px solid var(--border-color)',
                                    background: activeTab === t.key ? `${t.color}10` : 'var(--surface)',
                                    cursor: 'pointer', textAlign: 'left',
                                    transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                        background: activeTab === t.key ? t.gradient : 'var(--bg-input)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <t.Icon size={18} color={activeTab === t.key ? 'white' : 'var(--text-muted)'} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{t.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: activeTab === t.key ? t.color : 'var(--text-muted)', fontWeight: '600' }}>{t.law}</div>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.79rem', color: 'var(--text-light)', lineHeight: 1.55 }}>
                                    {t.description}
                                </p>
                            </motion.button>
                        ))}
                    </div>

                    {/* Form card */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'var(--surface)', border: '1px solid var(--border-color)',
                            borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 3rem)',
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: tab.gradient }} />

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Solicitante */}
                            <div>
                                <p style={{ fontSize: '0.73rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
                                    Datos del Solicitante
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                    <Field icon={<UserIcon size={17} />} label="Nombre Completo *" name="requesterName" value={form.requesterName} onChange={handleChange} required placeholder="Juan Pérez" />
                                    <Field icon={<Mail size={17} />} label="Correo Electrónico *" name="requesterEmail" type="email" value={form.requesterEmail} onChange={handleChange} required placeholder="correo@ejemplo.com" />
                                    <Field icon={<Phone size={17} />} label="Teléfono" name="requesterPhone" value={form.requesterPhone} onChange={handleChange} placeholder="809-000-0000" />
                                    <Field icon={<CreditCard size={17} />} label="Cédula" name="requesterCedula" value={form.requesterCedula} onChange={handleChange} placeholder="001-0000000-0" />
                                </div>
                            </div>

                            {/* Familiar-specific */}
                            {activeTab === 'familiar' && (
                                <div>
                                    <p style={{ fontSize: '0.73rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
                                        Datos de la Víctima
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                Parentesco *
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    name="relationship"
                                                    value={form.relationship}
                                                    onChange={handleChange}
                                                    required
                                                    style={{
                                                        width: '100%', height: '48px', padding: '0 2.5rem 0 1rem',
                                                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                                                        borderRadius: '12px', color: form.relationship ? 'var(--text-main)' : 'var(--text-muted)',
                                                        fontSize: '0.9rem', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
                                                    }}
                                                >
                                                    <option value="">Seleccionar parentesco...</option>
                                                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                        <Field icon={<UserIcon size={17} />} label="Nombre de la Víctima *" name="victimName" value={form.victimName} onChange={handleChange} required placeholder="Nombre completo del familiar" />
                                    </div>
                                </div>
                            )}

                            {/* Unauthorized-specific */}
                            {activeTab === 'unauthorized' && (
                                <div>
                                    <p style={{ fontSize: '0.73rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
                                        Persona Afectada
                                    </p>
                                    <Field icon={<UserIcon size={17} />} label="Nombre de la persona en el reporte *" name="victimName" value={form.victimName} onChange={handleChange} required placeholder="Nombre de quien aparece sin consentimiento" />
                                </div>
                            )}

                            {/* Identificación del reporte */}
                            <div>
                                <p style={{ fontSize: '0.73rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
                                    Identificación del Reporte
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <Field icon={<FileText size={17} />} label="Número de Reporte (si lo conoce)" name="reportId" value={form.reportId} onChange={handleChange} placeholder="Ej: #1234 — déjalo en blanco si no lo sabes" />
                                    <div>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            Descripción del Reporte *
                                        </label>
                                        <textarea
                                            name="reportDescription"
                                            value={form.reportDescription}
                                            onChange={handleChange}
                                            required
                                            placeholder="Describe el reporte: fecha aproximada, tipo de incidente (accidente, etc.), ubicación y qué aparece en las imágenes o vídeos..."
                                            style={{
                                                width: '100%', minHeight: '100px', padding: '0.9rem 1rem',
                                                background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                                                borderRadius: '12px', color: 'var(--text-main)',
                                                fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', lineHeight: 1.6,
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Motivo */}
                            <div>
                                <p style={{ fontSize: '0.73rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
                                    Motivo de la Solicitud
                                </p>
                                <div>
                                    <label style={{ fontSize: '0.82rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                        Explicación detallada *
                                    </label>
                                    <textarea
                                        name="reason"
                                        value={form.reason}
                                        onChange={handleChange}
                                        required
                                        placeholder="Explica por qué solicitas la eliminación y cómo afecta a la persona involucrada..."
                                        style={{
                                            width: '100%', minHeight: '130px', padding: '0.9rem 1rem',
                                            background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                                            borderRadius: '12px', color: 'var(--text-main)',
                                            fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', lineHeight: 1.6,
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Aviso legal */}
                            <div style={{
                                background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)',
                                borderRadius: '12px', padding: '1rem',
                                fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65,
                            }}>
                                <strong style={{ color: '#dc2626' }}>Aviso Legal: </strong>
                                La información proporcionada será tratada de forma confidencial conforme a la Ley 172-13 de Protección de Datos Personales. Al enviar esta solicitud certificas que la información es verídica y que tienes legitimidad para presentarla. La presentación de datos falsos puede conllevar consecuencias legales.
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                style={{
                                    height: '56px', borderRadius: '16px',
                                    background: sending ? 'var(--border-color)' : tab.gradient,
                                    color: 'white', fontWeight: '800', fontSize: '1rem',
                                    border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                    transition: 'opacity 0.2s',
                                    boxShadow: sending ? 'none' : `0 8px 24px ${tab.color}40`,
                                }}
                            >
                                {sending ? 'Enviando...' : <><Send size={20} /> Enviar Solicitud</>}
                            </button>
                        </form>
                    </motion.div>

                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <Link to="/" style={{
                            color: 'var(--text-muted)', fontSize: '0.85rem',
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none',
                        }}>
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>
            </motion.section>
            )}
            </AnimatePresence>
        </div>
    );
};

export default SupportPage;
