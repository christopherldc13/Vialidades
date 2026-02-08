import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const res = await login(email, password);

        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.msg);
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2 className="text-center">Bienvenido de Nuevo</h2>
                <p className="text-center text-muted mb-4">Inicia sesión en tu cuenta</p>

                {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
