import { motion } from 'framer-motion';
import { Inbox, Search, ShieldAlert, Map } from 'lucide-react';
import { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const timelineSteps = [
    {
        id: 1,
        title: 'Recepción',
        description: 'El sistema recibe y encola los nuevos reportes emitidos por la comunidad ciudadana.',
        icon: Inbox,
        color: '#3b82f6', // blue
        glow: 'rgba(59, 130, 246, 0.4)'
    },
    {
        id: 2,
        title: 'Evaluación',
        description: 'Análisis minucioso de la evidencia: fotografías, descripción y geolocalización del incidente.',
        icon: Search,
        color: '#f59e0b', // amber
        glow: 'rgba(245, 158, 11, 0.4)'
    },
    {
        id: 3,
        title: 'Veredicto',
        description: 'Se emite un juicio: Aprobación, rechazo, o sanción directa al usuario por conducta indebida.',
        icon: ShieldAlert,
        color: '#8b5cf6', // purple
        glow: 'rgba(139, 92, 246, 0.4)'
    },
    {
        id: 4,
        title: 'Resolución',
        description: 'El mapa de vialidades se actualiza en tiempo real para todos los conductores.',
        icon: Map,
        color: '#10b981', // emerald
        glow: 'rgba(16, 185, 129, 0.4)'
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const ModerationTimeline = () => {
    const { theme } = useContext(ThemeContext);

    return (
        <div style={{ marginTop: '5rem', marginBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Flujo de Moderación
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
                    Conoce el proceso estándar mediante el cual garantizamos la calidad y veracidad de cada reporte.
                </p>
            </div>

            <motion.div 
                className="timeline-container"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    position: 'relative',
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 1rem'
                }}
            >
                {/* Vertical Line */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    bottom: '20px',
                    left: 'calc(1rem + 24px)', // 1rem padding + half of 48px icon width
                    width: '3px',
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '4px',
                    zIndex: 0
                }} />

                {timelineSteps.map((step, index) => (
                    <motion.div 
                        key={step.id} 
                        variants={itemVariants}
                        style={{
                            display: 'flex',
                            gap: '1.5rem',
                            position: 'relative',
                            zIndex: 1
                        }}
                    >
                        {/* Icon Node */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            minWidth: '48px',
                            borderRadius: '50%',
                            background: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                            border: `2px solid ${step.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: step.color,
                            boxShadow: `0 0 20px ${step.glow}`,
                            zIndex: 2,
                            marginTop: '0.25rem'
                        }}>
                            <step.icon size={22} strokeWidth={2.5} />
                        </div>

                        {/* Content Card */}
                        <div style={{
                            flex: 1,
                            background: 'var(--surface-solid)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'transform 0.2sease-in-out',
                            cursor: 'default',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(8px)';
                            e.currentTarget.style.borderColor = step.color;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{ 
                                    background: step.color, 
                                    color: '#fff', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: '800',
                                    letterSpacing: '0.5px'
                                }}>
                                    PASO {step.id}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {step.title}
                                </h4>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                {step.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default ModerationTimeline;
