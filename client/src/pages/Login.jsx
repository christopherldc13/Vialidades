import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sanctionExpiry, setSanctionExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

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

        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.msg);
            if (res.sanctionExpiresAt) {
                setSanctionExpiry(res.sanctionExpiresAt);
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2 className="text-center">Bienvenido de Nuevo</h2>
                <p className="text-center text-muted mb-4">Inicia sesión en tu cuenta</p>

                {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                {sanctionExpiry && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                        <strong style={{ color: '#b91c1c', display: 'block', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tiempo Restante de Sanción</strong>
                        <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: '800', fontFamily: 'monospace' }}>
                            {timeLeft || 'Calculando...'}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                    </button>
                </form>
                <p style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                    <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </p>
                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
