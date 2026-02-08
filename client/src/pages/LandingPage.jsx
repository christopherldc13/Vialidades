import { Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { MapPin, Shield, Users, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const { user, loading } = useContext(AuthContext);

    // If user is already logged in, redirect to dashboard
    if (!loading && user) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <MapPin size={24} className="brand-icon" />
                    <span>Vialidades</span>
                </div>
                <div className="nav-links">
                    <Link to="/login" className="nav-btn login">Iniciar Sesión</Link>
                    <Link to="/register" className="nav-btn register">Registrarme</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1>Tu Comunidad, <span>Tu Seguridad Vial</span></h1>
                    <p>
                        <strong>Vialidades de Tránsito</strong> es la plataforma líder para reportar y monitorear incidentes viales en tiempo real.
                        Únete a miles de ciudadanos mejorando nuestras calles.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="cta-button">
                            Comenzar Ahora <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
                <div className="hero-image">
                    {/* Abstract visual or placeholder for now */}
                    <div className="floating-card card-1">
                        <Shield size={32} color="var(--primary)" />
                        <span>Reportes Seguros</span>
                    </div>
                    <div className="floating-card card-2">
                        <MapPin size={32} color="var(--error)" />
                        <span>Alertas en Vivo</span>
                    </div>
                    <div className="floating-card card-3">
                        <Users size={32} color="var(--success)" />
                        <span>Comunidad Activa</span>
                    </div>
                </div>
            </header>

            {/* Features (Optional but adds to the "Web Page" feel) */}
            <section className="features-section">
                <div className="feature-card">
                    <div className="icon-bg"><MapPin size={24} /></div>
                    <h3>Reporta Incidentes</h3>
                    <p>Notifica accidentes, tráfico o peligros en la vía al instante.</p>
                </div>
                <div className="feature-card">
                    <div className="icon-bg"><Shield size={24} /></div>
                    <h3>Gana Reputación</h3>
                    <p>Contribuye con reportes veraces y sube de nivel en la comunidad.</p>
                </div>
                <div className="feature-card">
                    <div className="icon-bg"><Users size={24} /></div>
                    <h3>Evita el Tráfico</h3>
                    <p>Consulta el estado de las vías antes de salir de casa.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 Vialidades de Tránsito. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
