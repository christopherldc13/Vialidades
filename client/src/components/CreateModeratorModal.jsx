import { useState, useContext, useMemo } from 'react';
import { X, UserPlus, Eye, EyeOff } from 'lucide-react';
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

// Set dayjs locale to Spanish
dayjs.locale('es');

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
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)',
                    }
                }
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent !important', boxShadow: 'none !important',
                        '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' }
                    }
                }
            },
            MuiButtonBase: {
                defaultProps: { disableRipple: false },
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent !important', boxShadow: 'none !important',
                        '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08) !important' : 'rgba(0,0,0,0.04) !important' }
                    }
                }
            },
            MuiPickersDay: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent !important',
                        '&.Mui-selected': { backgroundColor: 'var(--primary) !important', color: 'white !important' },
                        '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' }
                    }
                }
            },
            MuiPickersYear: {
                styleOverrides: {
                    yearButton: {
                        backgroundColor: 'transparent !important', boxShadow: 'none !important', color: 'inherit',
                        width: '72px !important', height: '32px !important', borderRadius: '16px !important', margin: '0 auto !important',
                        display: 'flex !important', alignItems: 'center !important', justifyContent: 'center !important',
                        fontSize: '0.9rem', lineHeight: '1 !important',
                        paddingTop: '0 !important', paddingBottom: '12px !important', paddingLeft: '0 !important', paddingRight: '0 !important',
                        '&.Mui-selected': { backgroundColor: 'var(--primary) !important', color: 'white !important' },
                        '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' }
                    }
                }
            },
            MuiPickersMonth: {
                styleOverrides: {
                    monthButton: {
                        backgroundColor: 'transparent !important', boxShadow: 'none !important', color: 'inherit',
                        '&.Mui-selected': { backgroundColor: 'var(--primary) !important', color: 'white !important' },
                        '&:hover': { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important' }
                    }
                }
            }
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
        if (name === 'firstName' || name === 'lastName') value = value.replace(/\b\w/g, char => char.toUpperCase());
        setFormData({ ...formData, [name]: value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, birthDate: date ? date.format('YYYY-MM-DD') : '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        for (const key in formData) {
            if (!formData[key]) {
                toast.error('Todos los campos son obligatorios.');
                return;
            }
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/users/moderator', formData);
            toast.success(response.data.msg || '¡Moderador Creado!');

            // Reset and close
            setFormData({
                username: '', email: '', password: '', firstName: '', lastName: '',
                birthDate: '', gender: '', phone: '', cedula: '', birthProvince: ''
            });
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al intentar crear al moderador');
        } finally {
            setIsLoading(false);
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
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="modal-container-modern custom-scrollbar"
                    onClick={e => e.stopPropagation()}
                    style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}
                >
                    <div className="modal-header-modern" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}>
                                <UserPlus size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Registrar Moderador</h2>
                        </div>
                        <button onClick={onClose} className="modal-close-btn" disabled={isLoading}><X size={24} /></button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem' }}>
                        <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                            Comienza a expandir tu equipo de moderación local. Introduce los datos del nuevo moderador a continuación:
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(0.75rem, 2vh, 1.25rem)' }}>
                            {/* Nombres y Apellidos */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Nombre</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Ej: Juan" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Apellido</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Ej: Pérez" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>

                            {/* Cédula y Teléfono */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Cédula</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required placeholder="Ej: 000-0000000-0" maxLength="13" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Teléfono</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Ej: 809-555-5555" maxLength="12" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>

                            {/* Usuario y Correo */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Usuario</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Nombre de usuario" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Correo Electrónico</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="moderador@ejemplo.com" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>

                            {/* Contraseña Temporal */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Contraseña Temporal</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required placeholder="Contraseña segura" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem', paddingRight: '3rem' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: '4px', margin: 0, width: 'auto', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none', zIndex: 10 }}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* MUI DatePicker for BirthDate */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Fecha de Nacimiento</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                    <MUIThemeProvider theme={muiTheme}>
                                        <DatePicker
                                            value={formData.birthDate ? dayjs(formData.birthDate) : null}
                                            onChange={handleDateChange}
                                            maxDate={dayjs()}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true, required: true, placeholder: "DD/MM/YYYY",
                                                    sx: {
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)',
                                                            color: 'var(--text-main)', fontFamily: 'inherit', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '& fieldset': { border: 'none' },
                                                            '&:hover': { borderColor: 'var(--primary)', transform: 'translateY(-1px)' },
                                                            '&.Mui-focused': { borderColor: 'var(--primary)', background: 'var(--bg-input-focus)', boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15)' },
                                                            '& .MuiInputBase-input::placeholder': { color: 'var(--text-muted)', opacity: 1 }
                                                        },
                                                        '& .MuiInputBase-input': { padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', height: 'auto' },
                                                        '& .MuiInputAdornment-root button': {
                                                            width: 'auto !important', minWidth: 'unset !important', padding: '8px !important', margin: '0 !important',
                                                            background: 'transparent !important', boxShadow: 'none !important', borderRadius: '50% !important', transform: 'none !important',
                                                            color: 'var(--primary) !important',
                                                            '&:hover': { background: theme === 'dark' ? 'rgba(255,255,255,0.05) !important' : 'rgba(0,0,0,0.05) !important' }
                                                        }
                                                    }
                                                },
                                                popper: {
                                                    modifiers: [{ name: 'offset', options: { offset: [0, -8] } }],
                                                    sx: {
                                                        zIndex: 99999,
                                                        '& .MuiPaper-root': {
                                                            backgroundImage: 'none', backdropFilter: 'blur(25px)',
                                                            backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                                            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', borderRadius: '16px',
                                                            minWidth: '320px !important'
                                                        },
                                                        '& .MuiYearCalendar-root': {
                                                            width: '100% !important',
                                                            display: 'flex !important',
                                                            flexWrap: 'wrap !important',
                                                            justifyContent: 'center !important',
                                                            alignContent: 'center !important',
                                                            padding: '8px !important',
                                                        },
                                                        '& .MuiPickersYear-root': {
                                                            flexBasis: '25% !important',
                                                            maxWidth: '25% !important',
                                                            display: 'flex !important',
                                                            justifyContent: 'center !important',
                                                            padding: '4px 0 !important',
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </MUIThemeProvider>
                                </LocalizationProvider>
                            </div>

                            {/* Gender y Provincia */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Género</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required style={{ width: '100%', padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', appearance: 'none', fontSize: '0.9rem' }}>
                                    <option value="">Selecciona género...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Provincia</label>
                                <select name="birthProvince" value={formData.birthProvince} onChange={handleChange} required style={{ width: '100%', padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', appearance: 'none', fontSize: '0.9rem' }}>
                                    <option value="">Selecciona provincia...</option>
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

                        <div className="modal-footer-modern" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <button type="button" onClick={onClose} disabled={isLoading} className="mod-btn-cancel" style={{ margin: 0, width: 'auto', background: 'transparent', color: 'var(--text-light)', border: '2px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={isLoading} className="mod-btn-submit" style={{ margin: 0, width: 'auto', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: isLoading ? 'default' : 'pointer', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1, fontSize: '0.95rem' }}>
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
