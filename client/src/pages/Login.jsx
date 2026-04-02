import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { CircularProgress, Box } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loginWithGoogle } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sanctionExpiry, setSanctionExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let interval;
        if (sanctionExpiry) {
            interval = setInterval(() => {
                const now = new Date().getTime();
                const distance = new Date(sanctionExpiry).getTime() - now;

                if (distance < 0) {
                    clearInterval(interval);
                    setTimeLeft('Sanción expirada. Por favor, intenta de nuevo.');
                    setSanctionExpiry(null);
                } else {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s restantes`);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [sanctionExpiry]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSanctionExpiry(null);
        setIsLoading(true);

        const res = await login(email, password);
        setIsLoading(false);
        
        if (res.success) {
            Swal.fire({
                title: '¡Ingreso Exitoso!',
                text: 'Redirigiendo al panel principal...',
                icon: 'success',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false,
                willClose: () => {
                    navigate('/dashboard');
                }
            });
        } else {
            setError(res.msg);
            Swal.fire({
                title: 'Error de Acceso',
                text: res.msg || 'Las credenciales no coinciden. Por favor busca tus datos e intenta de nuevo.',
                icon: 'error',
                confirmButtonText: 'Volver a intentar',
                confirmButtonColor: 'var(--primary)'
            });
            if (res.sanctionExpiresAt) {
                setSanctionExpiry(res.sanctionExpiresAt);
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        setSanctionExpiry(null);
        
        const res = await loginWithGoogle(credentialResponse.credential);
        setIsLoading(false);
        
        if (res.success) {
            Swal.fire({
                title: '¡Ingreso Exitoso!',
                text: 'Redirigiendo al panel principal...',
                icon: 'success',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false,
                willClose: () => {
                    navigate('/dashboard');
                }
            });
        } else {
            setError(res.msg);
            Swal.fire({
                title: 'Error de Acceso',
                text: res.msg || 'No pudimos validar tu cuenta de Google.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: 'var(--primary)'
            });
            if (res.sanctionExpiresAt) {
                setSanctionExpiry(res.sanctionExpiresAt);
            }
        }
    };

    const handleGoogleError = () => {
        console.error('Login Failed');
        setError('Autenticación con Google cancelada o fallida.');
    };

    return (
        <div className="premium-login-layout">
            {/* Left Decorative Panel */}
            <div className="premium-login-visual">
                <div className="visual-content">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    >
                        <h1>Vialidades Inteligentes</h1>
                        <p>Evalúa, gestiona y monitorea la infraestructura vial con tecnología de punta en una plataforma centralizada y moderna.</p>
                    </motion.div>
                </div>
                {/* Animated gradient shapes */}
                <div className="ambient-shape shape-1"></div>
                <div className="ambient-shape shape-2"></div>
                <div className="ambient-shape shape-3"></div>
            </div>

            {/* Right Form Panel */}
            <div className="premium-login-form-container" ref={scrollContainerRef}>
                <motion.div
                    className="premium-login-card"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} /> Volver
                    </Link>

                    <div className="login-header">
                        <motion.div
                            className="login-icon-wrapper"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.5 }}
                        >
                            <LogIn size={28} />
                        </motion.div>
                        <h2>Bienvenido de Nuevo</h2>
                        <p className="text-muted">Accede a tu cuenta para continuar evaluando las vialidades.</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="login-error-alert"
                        >
                            {error}
                        </motion.div>
                    )}

                    {sanctionExpiry && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="login-sanction-alert"
                        >
                            <strong>
                                <Lock size={16} /> Tiempo Restante de Sanción
                            </strong>
                            <div className="sanction-time">
                                {timeLeft || 'Calculando...'}
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group modern-input-group">
                            <label>Correo Electrónico</label>
                            <div className="input-icon-wrapper">
                                <Mail size={16} className="input-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="tucorreo@ejemplo.com"
                                />
                            </div>
                        </div>
                        <div className="input-group modern-input-group">
                            <div className="password-header">
                                <label>Contraseña</label>
                                <Link to="/forgot-password" className="forgot-link">¿Olvidaste tu contraseña?</Link>
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock size={16} className="input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="login-submit-btn premium-btn"
                            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <CircularProgress size={24} color="inherit" />
                                </Box>
                            ) : 'Iniciar Sesión'}
                        </motion.button>
                    </form>

                    <div className="login-divider">
                        <div className="divider-line"></div>
                        <span>O INGRESAR CON</span>
                        <div className="divider-line"></div>
                    </div>

                    <div className="google-login-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme={isDarkMode ? 'filled_black' : 'outline'}
                            shape="pill"
                            size="large"
                            width="100%"
                        />
                    </div>

                    <div className="login-divider">
                        <div className="divider-line"></div>
                        <span>¿NUEVO EN LA PLATAFORMA?</span>
                        <div className="divider-line"></div>
                    </div>

                    <div className="login-footer">
                        <Link to="/register" className="register-link premium-register-link">
                            Crear una cuenta
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Login;
