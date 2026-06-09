import { motion } from 'framer-motion';
import { Upload, ScanSearch, Map } from 'lucide-react';
import { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const timelineSteps = [
    {
        id: 1,
        title: 'Reporte Enviado',
        description: 'El ciudadano registra el incidente vial con fotos o videos, descripción y ubicación GPS. El sistema aplica difuminado automático de rostros para proteger la privacidad de los involucrados.',
        icon: Upload,
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.35)',
        tags: ['Face Blur', 'GPS Automático', 'Multimedia'],
    },
    {
        id: 2,
        title: 'Análisis Automático',
        description: 'El sistema analiza automáticamente el contenido del reporte. Si detecta material gore o violación de normas, sanciona al usuario de forma inmediata y elimina el reporte. Si el contenido es apto, avanza al siguiente paso.',
        icon: ScanSearch,
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.35)',
        tags: ['Automático', 'Gore → Sanción', 'Válido → Aprobado'],
    },
    {
        id: 3,
        title: 'Publicado al Público',
        description: 'El reporte aprobado aparece al instante en el mapa de calor ciudadano, visible para toda la comunidad. El usuario que reportó recibe una notificación con el resultado.',
        icon: Map,
        color: '#10b981',
        glow: 'rgba(16,185,129,0.35)',
        tags: ['Mapa en Vivo', 'Notificación', 'Comunidad'],
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }
};

const ModerationTimeline = () => {
    const { theme } = useContext(ThemeContext);

    return (
        <div style={{ marginTop: '5rem', marginBottom: '4rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h3 style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em',
                }}>
                    Flujo de Publicación de Reportes
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                    Así garantizamos que cada reporte publicado sea seguro y respetuoso para toda la comunidad.
                </p>
            </div>

            {/* Timeline */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.75rem',
                    position: 'relative',
                    maxWidth: '780px',
                    margin: '0 auto',
                    padding: '0 1rem',
                }}
            >
                {/* Vertical connector line */}
                <div style={{
                    position: 'absolute',
                    top: '28px',
                    bottom: '28px',
                    left: 'calc(1rem + 23px)',
                    width: '2px',
                    background: theme === 'dark'
                        ? 'linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))'
                        : 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.1), rgba(0,0,0,0.04))',
                    borderRadius: '4px',
                    zIndex: 0,
                }} />

                {timelineSteps.map((step) => (
                    <motion.div
                        key={step.id}
                        variants={itemVariants}
                        style={{ display: 'flex', gap: '1.4rem', position: 'relative', zIndex: 1 }}
                    >
                        {/* Icon node */}
                        <div style={{
                            width: '46px',
                            height: '46px',
                            minWidth: '46px',
                            borderRadius: '50%',
                            background: theme === 'dark' ? '#1a1a2e' : '#ffffff',
                            border: `2px solid ${step.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: step.color,
                            boxShadow: `0 0 18px ${step.glow}`,
                            zIndex: 2,
                            marginTop: '0.2rem',
                            flexShrink: 0,
                        }}>
                            <step.icon size={20} strokeWidth={2.2} />
                        </div>

                        {/* Content card */}
                        <div
                            style={{
                                flex: 1,
                                background: 'var(--surface-solid)',
                                padding: '1.3rem 1.5rem',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'default',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateX(6px)';
                                e.currentTarget.style.borderColor = step.color;
                                e.currentTarget.style.boxShadow = `0 4px 24px ${step.glow}`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Step badge + title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                                <span style={{
                                    background: step.color,
                                    color: '#fff',
                                    padding: '2px 9px',
                                    borderRadius: '99px',
                                    fontSize: '0.68rem',
                                    fontWeight: '800',
                                    letterSpacing: '0.06em',
                                    flexShrink: 0,
                                }}>
                                    PASO {step.id}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {step.title}
                                </h4>
                            </div>

                            {/* Description */}
                            <p style={{ margin: '0 0 0.85rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                                {step.description}
                            </p>

                            {/* Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {step.tags.map(tag => (
                                    <span key={tag} style={{
                                        background: `${step.color}15`,
                                        border: `1px solid ${step.color}35`,
                                        color: step.color,
                                        fontSize: '0.71rem',
                                        fontWeight: '700',
                                        padding: '0.18rem 0.65rem',
                                        borderRadius: '99px',
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default ModerationTimeline;
