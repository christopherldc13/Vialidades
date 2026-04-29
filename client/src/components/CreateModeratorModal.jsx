import { useState, useContext, useMemo } from 'react';
import { X, UserPlus, Eye, EyeOff, User, Phone, Mail, Lock, MapPin, Calendar, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import ThemeContext from '../context/ThemeContext';

dayjs.locale('es');

const DR_PROVINCES = [
    'Azua','Baoruco','Barahona','Dajabón','Distrito Nacional','Duarte',
    'El Seibo','Elías Piña','Espaillat','Hato Mayor','Hermanas Mirabal',
    'Independencia','La Altagracia','La Romana','La Vega',
    'María Trinidad Sánchez','Monseñor Nouel','Monte Cristi','Monte Plata',
    'Pedernales','Peravia','Puerto Plata','Samaná','San Cristóbal',
    'San José de Ocoa','San Juan','San Pedro de Macorís','Sánchez Ramírez',
    'Santiago','Santiago Rodríguez','Santo Domingo','Valverde',
];

const FIELD_STYLE = {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

const SectionLabel = ({ icon: Icon, label }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)',
        marginBottom: '0.1rem',
    }}>
        <Icon size={13} />
        {label}
    </div>
);

const Field = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{label}</label>
        {children}
    </div>
);

const CreateModeratorModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', firstName: '', lastName: '',
        birthDate: '', gender: '', phone: '', cedula: '', birthProvince: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { theme } = useContext(ThemeContext);

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: theme === 'dark' ? 'dark' : 'light',
            primary: { main: '#6366f1' },
            background: {
                default: theme === 'dark' ? '#171717' : '#ffffff',
                paper: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            },
            text: {
                primary: theme === 'dark' ? '#f5f5f5' : '#1e293b',
                secondary: theme === 'dark' ? '#a3a3a3' : '#64748b',
            }
        },
        typography: { fontFamily: '"Outfit", sans-serif' },
        components: {
            MuiPaper: { styleOverrides: { root: { borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)' } } },
            MuiIconButton: { styleOverrides: { root: { backgroundColor: 'transparent !important', boxShadow: 'none !important', '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' } } } },
            MuiButtonBase: { defaultProps: { disableRipple: false }, styleOverrides: { root: { backgroundColor: 'transparent !important', boxShadow: 'none !important', '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08) !important' : 'rgba(0,0,0,0.04) !important' } } } },
            MuiPickersDay: { styleOverrides: { root: { backgroundColor: 'transparent !important', '&.Mui-selected': { backgroundColor: 'var(--primary) !important', color: 'white !important' }, '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' } } } },
            MuiPickersYear: { styleOverrides: { yearButton: { backgroundColor: 'transparent !important', boxShadow: 'none !important', color: 'inherit', width: '72px !important', height: '32px !important', borderRadius: '16px !important', margin: '0 auto !important', display: 'flex !important', alignItems: 'center !important', justifyContent: 'center !important', fontSize: '0.9rem', lineHeight: '1 !important', paddingTop: '0 !important', paddingBottom: '12px !important', paddingLeft: '0 !important', paddingRight: '0 !important', '&.Mui-selected': { backgroundColor: 'var(--primary) !important', color: 'white !important' }, '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' } } } },
            MuiPickersMonth: { styleOverrides: { monthButton: { backgroundColor: 'transparent !important', boxShadow: 'none !important', color: 'inherit', '&.Mui-selected': { backgroundColor: 'var(--primary) !important', color: 'white !important' }, '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' } } } }
        }
    }), [theme]);

    if (!isOpen) return null;

    const formatPhone = (val) => {
        const cleaned = ('' + val).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? '-' + match[3] : ''}`;
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
        if (name === 'firstName' || name === 'lastName') value = value.replace(/\b\w/g, c => c.toUpperCase());
        setFormData({ ...formData, [name]: value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, birthDate: date ? date.format('YYYY-MM-DD') : '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        for (const key in formData) {
            if (!formData[key]) { toast.error('Todos los campos son obligatorios.'); return; }
        }
        setIsLoading(true);
        try {
            const response = await axios.post('/api/users/moderator', formData);
            toast.success(response.data.msg || '¡Moderador Creado!');
            setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', birthDate: '', gender: '', phone: '', cedula: '', birthProvince: '' });
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al intentar crear al moderador');
        } finally {
            setIsLoading(false);
        }
    };

    const datepickerSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-input)',
            color: 'var(--text-main)', fontFamily: 'inherit', transition: 'all 0.2s',
            '& fieldset': { border: 'none' },
            '&:hover': { borderColor: 'var(--primary)' },
            '&.Mui-focused': { borderColor: 'var(--primary)', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' },
        },
        '& .MuiInputBase-input': { padding: '0.7rem 1rem', fontSize: '0.9rem', color: 'var(--text-main)', height: 'auto' },
        '& .MuiInputAdornment-root button': {
            width: 'auto !important', minWidth: 'unset !important', padding: '8px !important', margin: '0 !important',
            background: 'transparent !important', boxShadow: 'none !important', borderRadius: '50% !important',
            color: 'var(--primary) !important',
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-overlay-modern"
                onClick={onClose}
                style={{ zIndex: 9999 }}
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 24 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="modal-container-modern create-mod-modal custom-scrollbar"
                    onClick={e => e.stopPropagation()}
                >
                    {/* ── Header ── */}
                    <div className="create-mod-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                                color: 'white', padding: '10px', borderRadius: '14px',
                                display: 'flex', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', flexShrink: 0,
                            }}>
                                <UserPlus size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                                    Registrar Moderador
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '1px' }}>
                                    Completa todos los campos para crear el acceso
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="modal-close-btn" disabled={isLoading} style={{ flexShrink: 0 }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-mod-form">

                        {/* ── Sección 1: Datos Personales ── */}
                        <div className="create-mod-section">
                            <SectionLabel icon={User} label="Datos Personales" />
                            <div className="create-mod-grid">
                                <Field label="Nombre">
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Ej: Juan" style={FIELD_STYLE} />
                                </Field>
                                <Field label="Apellido">
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Ej: Pérez" style={FIELD_STYLE} />
                                </Field>
                                <Field label="Cédula">
                                    <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required placeholder="000-0000000-0" maxLength="13" style={FIELD_STYLE} />
                                </Field>
                                <Field label="Teléfono">
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="809-555-5555" maxLength="12" style={{ ...FIELD_STYLE, paddingLeft: '2.2rem' }} />
                                    </div>
                                </Field>
                            </div>
                        </div>

                        {/* ── Sección 2: Perfil y Ubicación ── */}
                        <div className="create-mod-section">
                            <SectionLabel icon={MapPin} label="Perfil y Ubicación" />
                            <div className="create-mod-grid">
                                <Field label="Fecha de Nacimiento">
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                        <MUIThemeProvider theme={muiTheme}>
                                            <DatePicker
                                                value={formData.birthDate ? dayjs(formData.birthDate) : null}
                                                onChange={handleDateChange}
                                                maxDate={dayjs()}
                                                slotProps={{
                                                    textField: { fullWidth: true, required: true, placeholder: 'DD/MM/YYYY', sx: datepickerSx },
                                                    popper: {
                                                        modifiers: [{ name: 'offset', options: { offset: [0, -8] } }],
                                                        sx: {
                                                            zIndex: 99999,
                                                            '& .MuiPaper-root': { backgroundImage: 'none', backdropFilter: 'blur(25px)', backgroundColor: theme === 'dark' ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.95)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', borderRadius: '16px', minWidth: '320px !important' },
                                                            '& .MuiYearCalendar-root': { width: '100% !important', display: 'flex !important', flexWrap: 'wrap !important', justifyContent: 'center !important', alignContent: 'center !important', padding: '8px !important' },
                                                            '& .MuiPickersYear-root': { flexBasis: '25% !important', maxWidth: '25% !important', display: 'flex !important', justifyContent: 'center !important', padding: '4px 0 !important' }
                                                        }
                                                    }
                                                }}
                                            />
                                        </MUIThemeProvider>
                                    </LocalizationProvider>
                                </Field>
                                <Field label="Género">
                                    <select name="gender" value={formData.gender} onChange={handleChange} required style={{ ...FIELD_STYLE, appearance: 'none' }}>
                                        <option value="">Selecciona género...</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </Field>
                                <Field label="Provincia de Nacimiento">
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <select name="birthProvince" value={formData.birthProvince} onChange={handleChange} required style={{ ...FIELD_STYLE, paddingLeft: '2.2rem', appearance: 'none' }}>
                                            <option value="">Selecciona provincia...</option>
                                            {DR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </Field>
                            </div>
                        </div>

                        {/* ── Sección 3: Credenciales ── */}
                        <div className="create-mod-section">
                            <SectionLabel icon={Shield} label="Credenciales de Acceso" />
                            <div className="create-mod-grid">
                                <Field label="Usuario">
                                    <div style={{ position: 'relative' }}>
                                        <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="nombre_usuario" style={{ ...FIELD_STYLE, paddingLeft: '2.2rem' }} />
                                    </div>
                                </Field>
                                <Field label="Correo Electrónico">
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="moderador@ejemplo.com" style={{ ...FIELD_STYLE, paddingLeft: '2.2rem' }} />
                                    </div>
                                </Field>
                                <Field label="Contraseña Temporal">
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required placeholder="Contraseña segura" style={{ ...FIELD_STYLE, paddingLeft: '2.2rem', paddingRight: '2.75rem' }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: '4px', margin: 0, width: 'auto', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: 'none', zIndex: 10 }}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </Field>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="create-mod-footer">
                            <button type="button" onClick={onClose} disabled={isLoading} className="create-mod-btn-cancel">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isLoading} className="create-mod-btn-submit">
                                {isLoading ? 'Creando...' : 'Crear Moderador'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreateModeratorModal;
