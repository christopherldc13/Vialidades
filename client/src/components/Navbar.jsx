import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { User, LogOut, Moon, Sun, UserPlus, Menu, X } from 'lucide-react';
import { TbReportSearch } from "react-icons/tb";
import { CiLocationOn } from "react-icons/ci";
import NotificationList from './NotificationList';
import CreateModeratorModal from './CreateModeratorModal';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { user } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isCreateModOpen, setIsCreateModOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [mobileMenuOpen]);

    // Dynamic scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        });
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // If user is logged in, show the "Modern/Dashboard" version
    if (user) {
        return (
            <>
                <nav className="navbar modern-navbar">
                    <Link to="/dashboard" className="nav-brand modern-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <CiLocationOn size={26} color="var(--primary)" />
                        <span className="navbar-logo-text">Vialidades</span>
                    </Link>
                    <div className="nav-actions">
                        {/* Always visible */}
                        <button onClick={toggleTheme} className="modern-nav-btn" title="Cambiar Tema">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <NotificationList className="modern-nav-btn" />

                        {/* Desktop only */}
                        <div className="nav-desktop-btns">
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
                            <button onClick={handleLogoutClick} className="modern-nav-btn" title="Cerrar Sesión">
                                <LogOut size={20} />
                            </button>
                        </div>

                        {/* Mobile hamburger */}
                        <div className="nav-mobile-menu" ref={menuRef}>
                            <button
                                className="modern-nav-btn"
                                onClick={() => setMobileMenuOpen(p => !p)}
                                aria-label="Menú"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                            {mobileMenuOpen && (
                                <div className="mobile-dropdown">
                                    {['admin', 'moderator'].includes(user.role) && (
                                        <button className="mobile-dropdown-item" onClick={() => { setIsCreateModOpen(true); closeMobileMenu(); }}>
                                            <UserPlus size={16} /> Añadir Moderador
                                        </button>
                                    )}
                                    <button className="mobile-dropdown-item" onClick={() => { navigate('/dashboard?view=my'); closeMobileMenu(); }}>
                                        <TbReportSearch size={16} /> Mis Reportes
                                    </button>
                                    <button className="mobile-dropdown-item" onClick={() => { navigate('/profile'); closeMobileMenu(); }}>
                                        <User size={16} /> Mi Perfil
                                    </button>
                                    <div className="mobile-dropdown-divider" />
                                    <button className="mobile-dropdown-item mobile-dropdown-logout" onClick={() => { closeMobileMenu(); handleLogoutClick(); }}>
                                        <LogOut size={16} /> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
                <CreateModeratorModal isOpen={isCreateModOpen} onClose={() => setIsCreateModOpen(false)} />
            </>
        );
    }

    // If NO user (Landing/Auth flow), show the "Premium/Landing" version
    return (
        <motion.nav
            className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}
        >
            <div className="nav-gradient-overlay"></div>

            <div className="nav-brand">
                <CiLocationOn size={28} className="brand-icon" style={{ color: 'var(--primary)' }} />
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span>Vialidades</span>
                </Link>
            </div>

            <div className="nav-links">
                <button onClick={toggleTheme} className="secondary" style={{ padding: '0.5rem', width: 'auto', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Cambiar Tema">
                    {theme === 'dark' ? <Sun size={24} color="var(--text-main)" /> : <Moon size={24} color="var(--text-main)" />}
                </button>
                <Link to="/login" className="nav-btn login">Iniciar Sesión</Link>
                <Link to="/register" className="nav-btn register">Registrarme</Link>
            </div>
        </motion.nav>
    );
};

export default Navbar;
