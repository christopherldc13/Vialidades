import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const res = await register(username, email, password);
        if (res.success) {
            setSuccess('¡Registro Exitoso! Redirigiendo al login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(res.msg);
        }
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2 className="text-center">Crear Cuenta</h2>
                <p className="text-center text-muted mb-4">Únete a nuestra comunidad hoy</p>
                {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
                {success && <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre de Usuario</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit">Registrarse</button>
                </form>
                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
