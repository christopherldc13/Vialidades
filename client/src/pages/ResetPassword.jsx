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
            <div className="landing-container auth-wrapper modern-login-wrapper">
                <div className="card modern-login-card text-center">
                    <div style={{ color: '#10b981', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={64} />
                    </div>
                    <h2>¡Contraseña Actualizada!</h2>
                    <p className="text-muted" style={{ margin: '0.5rem 0 2rem' }}>
                        {message} Serás redirigido al inicio de sesión en unos segundos.
                    </p>
                    <Link to="/login" className="login-submit-btn" style={{ textDecoration: 'none' }}>
                        Ir al Login ahora
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-container auth-wrapper modern-login-wrapper">
            <div className="card modern-login-card">
                <div className="login-header">
                    <div className="login-icon-wrapper">
                        <Lock size={28} />
                    </div>
                    <h2>Nueva Contraseña</h2>
                    <p className="text-muted">
                        Por favor ingresa tu nueva contraseña segura abajo.
                    </p>
                </div>

                {error && (
                    <div className="login-error-alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group modern-input-group">
                        <label>Nueva Contraseña</label>
                        <div className="input-icon-wrapper">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                placeholder="Mínimo 6 caracteres"
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

                    <div className="input-group modern-input-group">
                        <label>Confirmar Contraseña</label>
                        <div className="input-icon-wrapper">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Repite tu nueva contraseña"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !password || !confirmPassword}
                        className="login-submit-btn"
                    >
                        {isLoading ? (
                            <span className="btn-loading">
                                <svg className="animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando...
                            </span>
                        ) : 'Guardar Nueva Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
