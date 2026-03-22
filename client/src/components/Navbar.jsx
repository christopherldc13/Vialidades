import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { Bell, User, LogOut, ClipboardList, Moon, Sun } from 'lucide-react';
import NotificationList from './NotificationList';
import Swal from 'sweetalert2';

const Navbar = () => {
    const { logout, user } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const handleLogoutClick = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: '¿Estás seguro de que quieres salir?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--error)',
            confirmButtonText: 'Sí, Salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                navigate('/');
            }
        });
    };

    return (
        <>
            <nav className="navbar modern-navbar">
                <Link to="/dashboard" className="nav-brand modern-brand">
                    Vialidades
                </Link>
                <div className="nav-actions">
                    <button onClick={toggleTheme} className="modern-nav-btn" title="Cambiar Tema">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {user && (
                        <>
                            <button onClick={() => navigate('/dashboard?view=my')} className="modern-nav-btn" title="Mis Reportes">
                                <ClipboardList size={20} />
                            </button>
                            <button onClick={() => navigate('/profile')} className="modern-nav-btn" title="Mi Perfil">
                                <User size={20} />
                            </button>
                            <NotificationList className="modern-nav-btn" />
                            <button onClick={handleLogoutClick} className="modern-nav-btn" title="Cerrar Sesión">
                                <LogOut size={20} />
                            </button>
                        </>
                    )}
                </div>
            </nav>

        </>
    );
};

export default Navbar;
