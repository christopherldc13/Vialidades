import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { Bell, User, LogOut, Moon, Sun, UserPlus } from 'lucide-react';
import { TbReportSearch } from "react-icons/tb";
import { CiLocationOn } from "react-icons/ci";
import NotificationList from './NotificationList';
import CreateModeratorModal from './CreateModeratorModal';
import Swal from 'sweetalert2';

const Navbar = () => {
    const { logout, user } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isCreateModOpen, setIsCreateModOpen] = useState(false);
    const navigate = useNavigate();
    const handleLogoutClick = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: '¿Estás seguro de que quieres salir?',
            icon: 'warning',
            iconColor: 'var(--error)',
            showCancelButton: true,
            confirmButtonText: 'Sí, Salir',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'swal2-lumina-confirm',
                cancelButton: 'swal2-lumina-cancel',
                popup: 'swal2-lumina-popup',
                title: 'swal2-lumina-title',
                htmlContainer: 'swal2-lumina-html'
            },
            buttonsStyling: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Limpiar la sesión directamente y hacer un hard reload a '/'
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        });
    };

    return (
        <>
            <nav className="navbar modern-navbar">
                <Link to="/dashboard" className="nav-brand modern-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CiLocationOn size={26} color="var(--primary)" />
                    <span className="navbar-logo-text">Vialidades</span>
                </Link>
                <div className="nav-actions">
                    <button onClick={toggleTheme} className="modern-nav-btn" title="Cambiar Tema">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {user && (
                        <>
                            {['admin', 'moderator'].includes(user.role) && (
                                <button onClick={() => setIsCreateModOpen(true)} className="modern-nav-btn" title="Añadir Moderador">
                                    <UserPlus size={20} />
                                </button>
                            )}
                            <button onClick={() => navigate('/dashboard?view=my')} className="modern-nav-btn" title="Mis Reportes">
                                <TbReportSearch size={22} />
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
            <CreateModeratorModal isOpen={isCreateModOpen} onClose={() => setIsCreateModOpen(false)} />
        </>
    );
};

export default Navbar;
