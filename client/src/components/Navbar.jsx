import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { Bell, User, LogOut } from 'lucide-react';
import NotificationList from './NotificationList';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        window.location.href = '/';
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/dashboard" className="nav-brand">
                    Vialidades
                </Link>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
