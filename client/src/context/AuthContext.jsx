import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Interceptor global para detectar si se inició sesión en otro dispositivo
        const interceptorId = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401 && error.response.data?.sessionOverwritten) {
                    // Forzar cierre de sesión
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete axios.defaults.headers.common['x-auth-token'];
                    setUser(null);

                    Swal.fire({
                        title: 'Sesión Cerrada',
                        text: 'Iniciaste sesión en otro dispositivo. Por seguridad, hemos cerrado tu sesión actual.',
                        icon: 'warning',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: 'var(--primary)',
                        allowOutsideClick: false,
                        willClose: () => {
                            window.location.href = '/';
                        }
                    });
                }
                return Promise.reject(error);
            }
        );

        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['x-auth-token'] = token;
                try {
                    const res = await axios.get('/api/auth/me');
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                } catch (err) {
                    console.error("Auth Load Error:", err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();

        return () => {
            axios.interceptors.response.eject(interceptorId);
        };
    }, []);

    const login = async (email, password) => {
        try {
            // Artificial delay for UX (3 seconds)
            await new Promise(resolve => setTimeout(resolve, 3000));

            const res = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            axios.defaults.headers.common['x-auth-token'] = res.data.token;
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.error("Login Error:", err);
            return {
                success: false,
                msg: err.response?.data?.msg || 'Login failed',
                sanctionExpiresAt: err.response?.data?.sanctionExpiresAt
            };
        }
    };

    const loginWithGoogle = async (credential) => {
        try {
            const res = await axios.post('/api/auth/google', { credential });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            axios.defaults.headers.common['x-auth-token'] = res.data.token;
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.error("Google Login Error:", err);
            return {
                success: false,
                msg: err.response?.data?.msg || 'Error al autenticar con Google',
                sanctionExpiresAt: err.response?.data?.sanctionExpiresAt
            };
        }
    };

    const register = async (userData) => {
        try {
            await axios.post('/api/auth/register', userData);
            // Do NOT log in automatically. Just return success.
            return { success: true };
        } catch (err) {
            console.error("Register Error:", err);
            return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
        }
    };

    const verifyEmail = async (email, code) => {
        try {
            const res = await axios.post('/api/auth/verify', { email, code });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            axios.defaults.headers.common['x-auth-token'] = res.data.token;
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.error("Verify Error:", err);
            return { success: false, msg: err.response?.data?.msg || 'Verification failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
    };

    const checkRegistrationDuplicates = async (userData) => {
        try {
            const res = await axios.post('/api/auth/check-duplicates', userData);
            return { success: true };
        } catch (err) {
            console.error("Duplicate Check Error:", err);
            return { success: false, msg: err.response?.data?.msg || 'Error al validar datos' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, register, verifyEmail, logout, loading, checkRegistrationDuplicates }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
