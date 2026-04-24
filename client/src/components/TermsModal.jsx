import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ScrollText, Database, PenLine, BadgeCheck,
    Fingerprint, ShieldCheck, Gavel, CheckCheck
} from 'lucide-react';

const SECTIONS = [
    {
        icon: Database,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.1)',
        title: '1. Recopilación y Tratamiento de Datos Personales',
        content: (
            <>
                <p style={{ margin: '0 0 0.6rem 0' }}>
                    Para garantizar la integridad de la plataforma, recopilamos y procesamos los siguientes datos:
                </p>
                <Bullets items={[
                    'Identidad: nombre completo, número de cédula, fecha de nacimiento, género y provincia.',
                    'Contacto: número telefónico y correo electrónico.',
                    'Biométricos: foto del documento de identidad e imagen facial (selfie) usados exclusivamente para verificación KYC.',
                    'Actividad: reportes enviados, interacciones y registros de sesión.',
                ]} />
                <p style={{ margin: '0.7rem 0 0 0' }}>
                    Tus datos biométricos <strong>no se comparten con terceros</strong> y se almacenan cifrados. Se usan únicamente para verificar tu identidad y prevenir fraudes.
                </p>
            </>
        ),
    },
    {
        icon: PenLine,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        title: '2. Responsabilidad del Usuario sobre el Contenido',
        content: (
            <>
                <p style={{ margin: '0 0 0.6rem 0' }}>
                    Eres el <strong>único responsable</strong> del contenido que publiques, incluyendo:
                </p>
                <Bullets items={[
                    'Reportes viales: la información debe ser veraz y corresponder a situaciones reales.',
                    'Imágenes adjuntas: deben ser auténticas y no manipuladas.',
                    'Descripciones y comentarios: objetivos, respetuosos y ajustados a la realidad.',
                    'Ubicación del incidente: debe corresponder al lugar real reportado.',
                ]} />
                <p style={{ margin: '0.7rem 0 0 0' }}>
                    Está prohibido publicar información falsa o difamatoria. El incumplimiento puede derivar en <strong>suspensión o eliminación permanente</strong> de tu cuenta.
                </p>
            </>
        ),
    },
    {
        icon: BadgeCheck,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        title: '3. Veracidad de la Información',
        content: (
            <Bullets items={[
                'Los reportes falsos o maliciosos serán eliminados y podrán notificarse a las autoridades.',
                'Está prohibido reportar incidentes que no hayas presenciado o que no ocurran en ese momento.',
                'La suplantación de identidad o uso de documentos falsos es un delito perseguible por ley.',
                'Aplicamos verificación KYC con validación de cédula y reconocimiento facial.',
            ]} />
        ),
    },
    {
        icon: Fingerprint,
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.1)',
        title: '4. Verificación de Identidad (KYC)',
        content: (
            <>
                <p style={{ margin: '0 0 0.6rem 0' }}>
                    El proceso de verificación biométrica es obligatorio e implica:
                </p>
                <Bullets items={[
                    'Captura de tu cédula de identidad para validar nombre y número mediante OCR.',
                    'Selfie en tiempo real para comparar tu rostro con la foto de la cédula.',
                    'Detección de vida (liveness check) para prevenir el uso de imágenes estáticas.',
                    'Los descriptores faciales se generan localmente y se transmiten cifrados.',
                ]} />
                <p style={{ margin: '0.7rem 0 0 0' }}>
                    Estos datos se conservan durante la vigencia de tu cuenta y se eliminan al darte de baja.
                </p>
            </>
        ),
    },
    {
        icon: ShieldCheck,
        color: '#0ea5e9',
        bg: 'rgba(14,165,233,0.1)',
        title: '5. Seguridad y Privacidad',
        content: (
            <Bullets items={[
                'Tu contraseña se almacena cifrada con bcrypt y nunca es accesible en texto plano.',
                'Las sesiones se gestionan con tokens JWT de tiempo limitado.',
                'Tus datos personales no se venden ni se ceden a terceros con fines comerciales.',
                'Puedes solicitar la eliminación de tus datos contactando al equipo de soporte.',
                'La plataforma registra actividad de sesión con fines de seguridad y auditoría interna.',
            ]} />
        ),
    },
    {
        icon: Gavel,
        color: '#f43f5e',
        bg: 'rgba(244,63,94,0.1)',
        title: '6. Suspensiones y Sanciones',
        content: (
            <>
                <p style={{ margin: '0 0 0.6rem 0' }}>
                    El sistema de sanciones puede restringir tu acceso si:
                </p>
                <Bullets items={[
                    'Publicas reportes falsos de forma reiterada.',
                    'Incurres en comportamiento abusivo hacia otros usuarios o moderadores.',
                    'Intentas evadir restricciones creando cuentas adicionales.',
                    'Usas la plataforma para fines distintos al reporte y consulta vial.',
                ]} />
                <p style={{ margin: '0.7rem 0 0 0' }}>
                    Las sanciones son acumulativas y pueden derivar en una inhabilitación permanente.
                </p>
            </>
        ),
    },
];

function Bullets({ items }) {
    return (
        <ul style={{ margin: '0.4rem 0 0 0', padding: 0, listStyle: 'none' }}>
            {items.map((item, i) => (
                <li key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                    marginBottom: '0.45rem', fontSize: '0.84rem',
                }}>
                    <span style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: 'var(--text-muted)', marginTop: '7px', flexShrink: 0,
                        opacity: 0.6,
                    }} />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Section({ icon: Icon, color, bg, bgHdr, border, title, content, textMain, textMuted }) {
    return (
        <div style={{
            marginBottom: '1rem',
            borderRadius: '0.875rem',
            border: `1px solid ${border}`,
            overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: bgHdr,
                borderBottom: `1px solid ${border}`,
            }}>
                <div style={{
                    width: '30px', height: '30px', borderRadius: '0.5rem',
                    background: color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 2px 8px ${color}55`,
                }}>
                    <Icon size={15} color="white" strokeWidth={2.2} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: textMain }}>
                    {title}
                </h4>
            </div>
            <div style={{
                padding: '1rem',
                fontSize: '0.84rem',
                color: textMuted,
                lineHeight: '1.7',
                background: bg,
            }}>
                {content}
            </div>
        </div>
    );
}

export default function TermsModal({ isOpen, onClose, onAccept, theme }) {
    const dark = theme === 'dark';

    const bg       = dark ? '#141414' : '#ffffff';
    const bgSec    = dark ? '#1e1e1e' : '#f8fafc';
    const bgSecHdr = dark ? '#252525' : '#f1f5f9';
    const border   = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
    const textMain = dark ? '#f5f5f5' : '#0f172a';
    const textMuted= dark ? '#a3a3a3' : '#64748b';
    const closeBtn = dark ? '#262626' : '#f1f5f9';

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '660px',
                            maxHeight: '90vh',
                            background: bg,
                            borderRadius: '1.25rem',
                            border: `1px solid ${border}`,
                            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: `1px solid ${border}`,
                            background: bg,
                            flexShrink: 0,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', gap: '1rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '0.75rem',
                                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 6px 16px rgba(99,102,241,0.35)',
                                    flexShrink: 0,
                                }}>
                                    <ScrollText size={20} color="white" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: textMain, lineHeight: 1.2 }}>
                                        Términos y Condiciones
                                    </h2>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.77rem', color: textMuted }}>
                                        Vialidades · Versión Abril 2025
                                    </p>
                                </div>
                            </div>
                            <div
                                onClick={onClose}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && onClose()}
                                style={{
                                    width: '32px', height: '32px',
                                    background: closeBtn,
                                    border: `1px solid ${border}`,
                                    borderRadius: '0.5rem', cursor: 'pointer',
                                    color: textMuted,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'background 0.15s',
                                }}
                            >
                                <X size={16} />
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1, background: bgSec }}>
                            <p style={{
                                fontSize: '0.85rem', color: textMuted,
                                marginBottom: '1.25rem', lineHeight: '1.7',
                                padding: '0.875rem 1rem',
                                background: 'rgba(99,102,241,0.08)',
                                borderRadius: '0.75rem',
                                border: '1px solid rgba(99,102,241,0.2)',
                            }}>
                                Al registrarte en <strong style={{ color: '#6366f1' }}>Vialidades</strong>, aceptas los términos que regulan el uso de la plataforma, el tratamiento de tus datos personales y tu responsabilidad como usuario. Lee con atención antes de continuar.
                            </p>

                            {SECTIONS.map((s, i) => (
                                <Section key={i} {...s} bg={bgSec} bgHdr={bgSecHdr} border={border} textMain={textMain} textMuted={textMuted} />
                            ))}

                            <p style={{
                                marginTop: '0.5rem',
                                fontSize: '0.78rem',
                                color: textMuted,
                                lineHeight: '1.6',
                                textAlign: 'center',
                            }}>
                                Vialidades se reserva el derecho de actualizar estos términos. Los cambios se notificarán por correo electrónico.
                            </p>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: `1px solid ${border}`,
                            background: bg,
                            flexShrink: 0,
                            display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end',
                        }}>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={onClose}
                                onKeyDown={e => e.key === 'Enter' && onClose()}
                                style={{
                                    padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
                                    background: closeBtn, border: `1px solid ${border}`,
                                    color: textMuted, cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
                                    userSelect: 'none',
                                }}
                            >
                                Cerrar
                            </div>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => { onAccept(); onClose(); }}
                                onKeyDown={e => e.key === 'Enter' && (onAccept(), onClose())}
                                style={{
                                    padding: '0.6rem 1.5rem', borderRadius: '0.625rem',
                                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                    color: 'white', cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 700,
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    userSelect: 'none',
                                }}
                            >
                                <CheckCheck size={16} strokeWidth={2.5} />
                                Acepto los Términos
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
