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
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
                <Link to="/login" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-muted)' }} title="Volver al inicio de sesión">
                    <ArrowLeft size={20} />
                </Link>

                <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                    <div style={{
                        background: 'var(--bg-input)',
                        width: '60px', height: '60px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'var(--primary)'
                    }}>
                        <Mail size={30} />
                    </div>
                    <h2>Recuperar Contraseña</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace seguro para restablecerla.
                    </p>
                </div>

                {message && (
                    <div style={{ background: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="tu@correo.com"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <button type="submit" disabled={isLoading || !email} style={{ opacity: isLoading ? 0.7 : 1, width: '100%', marginTop: '1rem' }}>
                            {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
