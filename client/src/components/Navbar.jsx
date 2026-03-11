import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { Bell, User, LogOut, ClipboardList, Moon, Sun } from 'lucide-react';
import NotificationList from './NotificationList';
import Swal from 'sweetalert2';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
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

        </>
    );
};

export default Navbar;
