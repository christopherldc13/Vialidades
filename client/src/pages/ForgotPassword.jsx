import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import axios from 'axios';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/auth/forgot-password', { email });

            setMessage('Se ha enviado un correo con las instrucciones para restablecer tu contraseña.');
            setEmail('');
        } catch (err) {
            console.error("Forgot Password Error:", err);
            setError(err.response?.data?.msg || err.message || 'Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="landing-container auth-wrapper modern-login-wrapper">
            <div className="card modern-login-card">
                <Link to="/login" className="back-link" title="Volver al inicio de sesión">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="login-header">
                    <div className="login-icon-wrapper">
                        <Mail size={28} />
                    </div>
                    <h2>Recuperar Contraseña</h2>
                    <p className="text-muted">
                        Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace seguro para restablecerla.
                    </p>
                </div>

                {message && (
                    <>
                        <div style={{ background: '#dcfce7', borderLeft: '4px solid #10b981', color: '#15803d', padding: 'clamp(0.75rem, 2vh, 1rem)', borderRadius: '0.5rem', marginBottom: 'clamp(1rem, 2vh, 1.5rem)', fontSize: '0.85rem', fontWeight: 500 }}>
                            {message}
                        </div>
                        <Link to="/login" className="login-submit-btn premium-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: '1.5rem' }}>
                            Volver al Inicio de Sesión
                        </Link>
                    </>
                )}

                {error && (
                    <div className="login-error-alert">
                        {error}
                    </div>
                )}

                {!message && (
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
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="login-submit-btn"
                        >
                            {isLoading ? (
                                <span className="btn-loading">
                                    <svg className="animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </span>
                            ) : 'Enviar Enlace de Recuperación'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
