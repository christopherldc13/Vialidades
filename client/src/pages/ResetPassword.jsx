import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden.');
        }

        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres.');
        }

        setIsLoading(true);

        try {
            const res = await axios.post(`/api/auth/reset-password/${token}`, { password });

            setMessage('Tu contraseña ha sido restablecida exitosamente.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error("Reset Password Error:", err);
            setError(err.response?.data?.msg || err.message || 'Error al restablecer la contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    if (message) {
        return (
            <div className="auth-container">
                <div className="card text-center" style={{ maxWidth: '400px' }}>
                    <div style={{ color: '#10b981', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={60} />
                    </div>
                    <h2>¡Contraseña Actualizada!</h2>
                    <p className="text-muted" style={{ margin: '1rem 0 2rem' }}>
                        {message} Serás redirigido al inicio de sesión en unos segundos.
                    </p>
                    <Link to="/login" className="btn" style={{ display: 'inline-block', textDecoration: 'none', background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)' }}>
                        Ir al Login ahora
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'var(--bg-input)',
                        width: '60px', height: '60px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'var(--primary)'
                    }}>
                        <Lock size={30} />
                    </div>
                    <h2>Crear Nueva Contraseña</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Por favor ingresa tu nueva contraseña segura abajo.
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nueva Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                placeholder="Mínimo 6 caracteres"
                                style={{ paddingRight: '3rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Confirmar Contraseña</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Repite tu nueva contraseña"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <button type="submit" disabled={isLoading || !password || !confirmPassword} style={{ opacity: isLoading ? 0.7 : 1, width: '100%', marginTop: '1rem' }}>
                        {isLoading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
