import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function Register() {
    const { register, verifyEmail } = useContext(AuthContext);
    const navigate = useNavigate();

    // Step state
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        phone: '',
        cedula: '',
        birthProvince: ''
    });

    const [verificationCode, setVerificationCode] = useState('');

    const formatPhone = (val) => {
        const cleaned = ('' + val).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? '-' + match[3] : ''}`;
        }
        return val;
    };

    const formatCedula = (val) => {
        const cleaned = ('' + val).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,7})(\d{0,1})$/);
        if (match) {
            let res = match[1];
            if (match[2]) res += '-' + match[2];
            if (match[3]) res += '-' + match[3];
            return res;
        }
        return val;
    };

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'phone') value = formatPhone(value);
        if (name === 'cedula') value = formatCedula(value);

        // Auto-capitalize first letter of each word for names
        if (name === 'firstName' || name === 'lastName') {
            value = value.replace(/\b\w/g, char => char.toUpperCase());
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const res = await register(formData);
        setIsLoading(false);

        if (res.success) {
            setSuccess('¡Registro Paso 1 Exitoso! Revisa tu correo por el código de verificación.');
            setStep(2); // Move to verification step
        } else {
            setError(res.msg);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const res = await verifyEmail(formData.email, verificationCode);
        setIsLoading(false);

        if (res.success) {
            setSuccess('¡Cuenta verificada exitosamente! Redirigiendo...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            setError(res.msg);
        }
    };

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
                <h2 className="text-center">{step === 1 ? 'Crear Cuenta' : 'Verificar Cuenta'}</h2>
                <p className="text-center text-muted mb-4">
                    {step === 1 ? 'Únete a nuestra comunidad hoy' : 'Ingresa el código enviado a tu correo'}
                </p>

                {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
                {success && <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{success}</div>}

                {step === 1 ? (
                    <form onSubmit={handleRegisterSubmit}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Datos Personales</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '1.5rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Nombre</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Ej: Juan" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Apellido</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Ej: Pérez" />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Fecha de Nacimiento</label>
                                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required max={new Date().toISOString().split("T")[0]} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Sexo</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required style={{ width: '100%', padding: 'clamp(0.75rem, 2vw, 1rem) 1.25rem', borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', appearance: 'none' }}>
                                    <option value="">Selecciona...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Teléfono</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Ej: 809-555-5555" maxLength="12" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Cédula</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required placeholder="Ej: 000-0000000-0" maxLength="13" />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label>Provincia de Nacimiento</label>
                                <select name="birthProvince" value={formData.birthProvince} onChange={handleChange} required style={{ width: '100%', padding: 'clamp(0.75rem, 2vw, 1rem) 1.25rem', borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', appearance: 'none' }}>
                                    <option value="">Selecciona una provincia...</option>
                                    <option value="Azua">Azua</option>
                                    <option value="Baoruco">Baoruco</option>
                                    <option value="Barahona">Barahona</option>
                                    <option value="Dajabón">Dajabón</option>
                                    <option value="Distrito Nacional">Distrito Nacional</option>
                                    <option value="Duarte">Duarte</option>
                                    <option value="El Seibo">El Seibo</option>
                                    <option value="Elías Piña">Elías Piña</option>
                                    <option value="Espaillat">Espaillat</option>
                                    <option value="Hato Mayor">Hato Mayor</option>
                                    <option value="Hermanas Mirabal">Hermanas Mirabal</option>
                                    <option value="Independencia">Independencia</option>
                                    <option value="La Altagracia">La Altagracia</option>
                                    <option value="La Romana">La Romana</option>
                                    <option value="La Vega">La Vega</option>
                                    <option value="María Trinidad Sánchez">María Trinidad Sánchez</option>
                                    <option value="Monseñor Nouel">Monseñor Nouel</option>
                                    <option value="Monte Cristi">Monte Cristi</option>
                                    <option value="Monte Plata">Monte Plata</option>
                                    <option value="Pedernales">Pedernales</option>
                                    <option value="Peravia">Peravia</option>
                                    <option value="Puerto Plata">Puerto Plata</option>
                                    <option value="Samaná">Samaná</option>
                                    <option value="San Cristóbal">San Cristóbal</option>
                                    <option value="San José de Ocoa">San José de Ocoa</option>
                                    <option value="San Juan">San Juan</option>
                                    <option value="San Pedro de Macorís">San Pedro de Macorís</option>
                                    <option value="Sánchez Ramírez">Sánchez Ramírez</option>
                                    <option value="Santiago">Santiago</option>
                                    <option value="Santiago Rodríguez">Santiago Rodríguez</option>
                                    <option value="Santo Domingo">Santo Domingo</option>
                                    <option value="Valverde">Valverde</option>
                                </select>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Datos de la Cuenta</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Nombre de Usuario</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Tu alias en el sistema" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Correo Electrónico</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="tucorreo@ejemplo.com" />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label>Contraseña</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" placeholder="Mínimo 6 caracteres" />
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} style={{ width: '100%', marginTop: '2rem', opacity: isLoading ? 0.7 : 1 }}>
                            {isLoading ? 'Procesando...' : 'Siguiente'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifySubmit}>
                        <div className="input-group">
                            <label>Código de Confirmación (6 dígitos)</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                maxLength="6"
                                placeholder="Ej: 123456"
                                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                            />
                        </div>
                        <button type="submit" disabled={isLoading || verificationCode.length !== 6} style={{ width: '100%', opacity: (isLoading || verificationCode.length !== 6) ? 0.7 : 1 }}>
                            {isLoading ? 'Verificando...' : 'Confirmar y Entrar'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <button type="button" onClick={() => setStep(1)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
                                Volver al registro
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
                    </p>
                )}
            </div>
        </div>
    );
}

export default Register;
