import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { Bell, User, LogOut, ClipboardList, Moon, Sun } from 'lucide-react';
import NotificationList from './NotificationList';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        navigate('/');
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/dashboard" className="nav-brand">
                    Vialidades
                </Link>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button onClick={toggleTheme} className="secondary" style={{ padding: '0.5rem', width: 'auto', border: 'none', background: 'var(--bg-input)', borderRadius: '50%' }} title="Cambiar Tema">
                        {theme === 'dark' ? <Sun size={20} color="var(--text-main)" /> : <Moon size={20} color="var(--text-main)" />}
                    </button>
                    <Link to="/dashboard?view=my" title="Mis Reportes" style={{ color: 'var(--text-main)', padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-input)' }}>
                        <ClipboardList size={20} />
                    </Link>
                    <Link to="/profile" style={{ color: 'var(--text-main)', padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-input)' }}>
                        <User size={20} />
                    </Link>
                    <NotificationList />
                    <button onClick={handleLogoutClick} className="secondary" style={{ padding: '0.5rem', width: 'auto', border: 'none' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>¿Cerrar Sesión?</h3>
                        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                            ¿Estás seguro de que quieres salir?
                        </p>
                        <div className="modal-actions">
                            <button className="secondary" onClick={() => setShowLogoutModal(false)}>
                                Cancelar
                            </button>
                            <button className="danger" onClick={confirmLogout}>
                                Sí, Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
