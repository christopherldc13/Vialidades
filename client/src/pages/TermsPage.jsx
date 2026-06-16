import { useEffect } from 'react';

const sections = [
    {
        title: '1. Propiedad Intelectual',
        body: 'Todo el contenido presente en esta plataforma — incluyendo textos, gráficos, logotipos, íconos, imágenes, código fuente y software — es propiedad exclusiva de Vialidades de Tránsito y se encuentra protegido por las leyes de derechos de autor de la República Dominicana y tratados internacionales aplicables.',
    },
    {
        title: '2. Uso Permitido',
        body: 'Se permite el uso personal y no comercial de la plataforma. Queda expresamente prohibida la reproducción, distribución, modificación, transmisión pública o cualquier explotación del contenido sin autorización escrita previa de Vialidades de Tránsito.',
    },
    {
        title: '3. Contenido Generado por Usuarios',
        body: 'Los reportes, imágenes y datos enviados por los usuarios son de su autoría. Al publicarlos en la plataforma, el usuario otorga a Vialidades de Tránsito una licencia no exclusiva para mostrar, moderar y gestionar dicho contenido con fines operativos y de seguridad vial.',
    },
    {
        title: '4. Marca Registrada',
        body: 'El nombre "Vialidades de Tránsito", el logotipo y demás identidades visuales asociadas son marcas protegidas. No podrán ser usadas sin autorización expresa de sus titulares.',
    },
    {
        title: '5. Limitación de Responsabilidad',
        body: 'Vialidades de Tránsito no se hace responsable por daños directos o indirectos derivados del uso de la plataforma, la inexactitud de los reportes publicados por terceros, ni por interrupciones del servicio.',
    },
    {
        title: '6. Legislación Aplicable',
        body: 'Estos términos se rigen por las leyes de la República Dominicana. Cualquier disputa será resuelta ante los tribunales competentes del país.',
    },
    {
        title: '7. Contacto',
        body: 'Para consultas sobre derechos de autor, uso de contenido o cualquier asunto legal relacionado con esta plataforma, puedes comunicarte a través del Centro de Soporte disponible en la plataforma.',
    },
];

export default function TermsPage() {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-main)', fontFamily: 'inherit' }}>
            <style>{`
                .terms-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1.5rem 3rem 3rem;
                }
                .terms-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .terms-hero {
                    padding: 2.5rem 1rem 2rem;
                }
                .terms-hero h1 {
                    font-size: 1.6rem;
                }
                @media (max-width: 600px) {
                    .terms-content {
                        padding: 1rem 1rem 3rem;
                    }
                    .terms-grid {
                        grid-template-columns: 1fr;
                    }
                    .terms-hero {
                        padding: 1.75rem 1rem 1.5rem;
                    }
                    .terms-hero h1 {
                        font-size: 1.3rem;
                    }
                }
            `}</style>

            {/* Hero */}
            <div className="terms-hero" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #312e81 100%)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>©</div>
                <h1 className="terms-hero" style={{ fontWeight: '800', color: '#fff', margin: '0 0 0.35rem' }}>
                    Derechos Reservados
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0 }}>
                    © 2026 Vialidades de Tránsito · Todos los derechos reservados
                </p>
            </div>

            {/* Content */}
            <div className="terms-content">
                <div className="terms-grid">
                    {sections.slice(0, 6).map(({ title, body }) => (
                        <div key={title} style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '14px',
                            padding: '1.1rem 1.25rem',
                        }}>
                            <h2 style={{
                                fontSize: '0.97rem', fontWeight: '700',
                                color: 'var(--primary)', marginBottom: '0.5rem', marginTop: 0,
                            }}>
                                {title}
                            </h2>
                            <p style={{
                                fontSize: '0.93rem', lineHeight: '1.7',
                                color: 'var(--text-muted)', margin: 0,
                            }}>
                                {body}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Last item full width */}
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.1rem 1.25rem',
                }}>
                    <h2 style={{
                        fontSize: '0.97rem', fontWeight: '700',
                        color: 'var(--primary)', marginBottom: '0.5rem', marginTop: 0,
                    }}>
                        {sections[6].title}
                    </h2>
                    <p style={{
                        fontSize: '0.93rem', lineHeight: '1.7',
                        color: 'var(--text-muted)', margin: 0,
                    }}>
                        {sections[6].body}
                    </p>
                </div>

                <p style={{
                    textAlign: 'center', color: 'var(--text-muted)',
                    fontSize: '0.78rem', marginTop: '1.5rem',
                }}>
                    Última actualización: junio 2026 · Vialidades de Tránsito
                </p>
            </div>
        </div>
    );
}
