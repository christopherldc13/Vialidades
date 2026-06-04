import { useEffect, useState } from 'react';
import { X, User, Mail, Shield, Calendar, AlertTriangle, Star, CheckCircle, MinusCircle, Trash2, Plus, ShieldOff, Ban } from 'lucide-react';
import { FaPhoneAlt } from "react-icons/fa";
import { LiaIdCard, LiaBirthdayCakeSolid } from "react-icons/lia";
import { BsGenderFemale, BsGenderMale } from "react-icons/bs";
import { RiUserLocationLine } from "react-icons/ri";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Swal from 'sweetalert2';

const UserDetailModal = ({ user: initialUser, isOpen, onClose, onSanctionUpdate }) => {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(null);

    useEffect(() => { setUser(initialUser); }, [initialUser]);
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleBlockUser = async () => {
        const { value: duration, isConfirmed } = await Swal.fire({
            title: 'Bloquear usuario',
            html: `
                <style>#block-opts label { color: var(--text-main) !important; }</style>
                <p style="color:var(--text-muted);font-size:0.88rem;margin:0 0 1rem 0;">Selecciona la duración del bloqueo:</p>
                <div id="block-opts" style="display:flex;flex-direction:column;gap:0.5rem;text-align:left;">
                    ${[['24h','🕐 24 horas'],['48h','🕑 48 horas'],['7d','📅 7 días'],['permanent','⛔ Bloqueo permanente']].map(([v,l]) => `
                        <label style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0.9rem;border-radius:10px;border:1.5px solid rgba(100,100,100,0.18);cursor:pointer;font-size:0.9rem;font-weight:500;transition:all 0.15s;"
                               onmouseover="this.style.borderColor='rgba(239,68,68,0.5)';this.style.background='rgba(239,68,68,0.07)'"
                               onmouseout="if(!this.querySelector('input').checked){this.style.borderColor='rgba(100,100,100,0.18)';this.style.background='transparent'}">
                            <input type="radio" name="block-dur" value="${v}" style="accent-color:#ef4444;width:16px;height:16px;flex-shrink:0;"
                                   onchange="document.querySelectorAll('#block-opts label').forEach(l=>{l.style.borderColor='rgba(100,100,100,0.18)';l.style.background='transparent'});this.parentElement.style.borderColor='rgba(239,68,68,0.6)';this.parentElement.style.background='rgba(239,68,68,0.09)'">
                            <span>${l}</span>
                        </label>
                    `).join('')}
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Bloquear',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'swal2-lumina-popup', title: 'swal2-lumina-title', confirmButton: 'swal2-lumina-confirm', cancelButton: 'swal2-lumina-cancel' },
            preConfirm: () => {
                const checked = document.querySelector('input[name="block-dur"]:checked');
                if (!checked) { Swal.showValidationMessage('Selecciona una duración'); return false; }
                return checked.value;
            }
        });
        if (!isConfirmed) return;
        setLoading(duration);
        try {
            const { data } = await axios.patch(`/api/users/${user._id}/block`, { duration });
            setUser(data);
            onSanctionUpdate?.(data);
            Swal.fire({ icon: 'success', title: 'Usuario bloqueado', timer: 2000, showConfirmButton: false, customClass: { popup: 'swal2-lumina-popup' } });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.msg || 'No se pudo bloquear.', customClass: { popup: 'swal2-lumina-popup' } });
        } finally { setLoading(null); }
    };

    const handleSanction = async (action) => {
        const labels = {
            reduce:  { title: 'Reducir sanción', text: '¿Quitar 1 sanción y restaurar 25 pts de reputación?', confirm: 'Sí, reducir' },
            clear:   { title: 'Eliminar todas las sanciones', text: '¿Eliminar todas las sanciones, restaurar reputación a 100 y levantar el bloqueo?', confirm: 'Sí, limpiar' },
            add:     { title: 'Añadir sanción manual', text: '¿Aplicar 1 sanción y reducir 25 pts de reputación?', confirm: 'Sí, sancionar' },
            unblock: { title: 'Levantar bloqueo', text: 'El usuario podrá iniciar sesión de nuevo. Las sanciones acumuladas se mantienen.', confirm: 'Sí, levantar bloqueo' },
        };
        const { title, text, confirm } = labels[action];
        const confirmClass = action === 'add' ? 'swal2-lumina-confirm' : (action === 'clear' || action === 'unblock') ? 'swal2-lumina-confirm-green' : 'swal2-lumina-confirm-amber';
        const result = await Swal.fire({
            title, text, icon: 'warning', showCancelButton: true,
            confirmButtonText: confirm, cancelButtonText: 'Cancelar',
            buttonsStyling: false, reverseButtons: true,
            customClass: {
                popup: 'swal2-lumina-popup',
                title: 'swal2-lumina-title',
                htmlContainer: 'swal2-lumina-html',
                confirmButton: confirmClass,
                cancelButton: 'swal2-lumina-cancel',
            }
        });
        if (!result.isConfirmed) return;
        setLoading(action);
        try {
            const url = action === 'unblock' ? `/api/users/${user._id}/unblock`
                      : action === 'block' ? `/api/users/${user._id}/block`
                      : `/api/users/${user._id}/sanctions/${action}`;
            const { data } = await axios.patch(url, action === 'block' ? { duration: loading } : {});
            setUser(data);
            onSanctionUpdate?.(data);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.msg || 'No se pudo actualizar la sanción.', customClass: { popup: 'swal2-lumina-popup' } });
        } finally {
            setLoading(null);
        }
    };

    if (!isOpen || !user) return null;

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) return avatarPath;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
    };

    const avatarUrl = getAvatarUrl(user.avatar);

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
                    className="modal-container-modern"
                    onClick={e => e.stopPropagation()}
                    style={{ maxWidth: '600px' }}
                >
                    {/* Header */}
                    <div className="modal-header-modern" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)' }} />
                                ) : (
                                    <User size={28} color="var(--primary)" />
                                )}
                                Detalles del Usuario
                            </h2>
                            <span style={{
                                display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.75rem',
                                borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800',
                                background: user.role === 'admin' ? '#9333ea' : user.role === 'moderator' ? 'var(--primary)' : 'var(--bg-input)',
                                color: user.role === 'user' ? 'var(--text-main)' : 'white', textTransform: 'uppercase',
                                border: user.role === 'user' ? '1px solid var(--border-color)' : 'none'
                            }}>
                                Rol: {user.role}
                            </span>
                        </div>
                        <button onClick={onClose} className="modal-close-btn">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="modal-body-modern custom-scrollbar" style={{ padding: '0 1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1.5rem' }}>
                            {/* General Info Card */}
                            <div style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontWeight: '700' }}>
                                    Información Personal
                                </h3>
                                <div className="user-detail-grid">
                                    <div className="user-detail-label">Usuario:</div>
                                    <div className="user-detail-value">@{user.username}</div>

                                    <div className="user-detail-label">Nombre Completo:</div>
                                    <div className="user-detail-value">{user.firstName} {user.lastName}</div>

                                    <div className="user-detail-label">Cédula:</div>
                                    <div className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <LiaIdCard size={16} /> {user.cedula || 'N/A'}
                                    </div>

                                    <div className="user-detail-label">Correo:</div>
                                    <div className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={16} /> {user.email}
                                    </div>
                                    
                                    <div className="user-detail-label">Género:</div>
                                    <div className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {user.gender === 'F' || user.gender === 'female' || user.gender === 'femenino' ? (
                                            <BsGenderFemale size={16} color="#ec4899" />
                                        ) : (
                                            <BsGenderMale size={16} color="#3b82f6" />
                                        )}
                                        {user.gender === 'M' || user.gender === 'male' || user.gender === 'masculino' ? 'Masculino' : user.gender === 'F' || user.gender === 'female' || user.gender === 'femenino' ? 'Femenino' : user.gender || 'Otro'}
                                    </div>
                                    
                                    <div className="user-detail-label">Fecha Nac.:</div>
                                    <div className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <LiaBirthdayCakeSolid size={16} /> {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'N/A'}
                                    </div>

                                    <div className="user-detail-label">Teléfono:</div>
                                    <div className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaPhoneAlt size={14} /> {user.phone || 'N/A'}
                                    </div>

                                    <div className="user-detail-label">Provincia Nac.:</div>
                                    <div className="user-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <RiUserLocationLine size={16} /> {user.birthProvince || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontWeight: '700' }}>
                                    Estadísticas en Plataforma
                                </h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                    
                                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <Star size={24} color="var(--success)" />
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Reputación</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>{user.reputation || 0}</div>
                                    </div>

                                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertTriangle size={24} color="var(--error)" />
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sanciones</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--error)' }}>{user.sanctions || 0}</div>
                                    </div>
                                    
                                    <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={24} color={user.isVerified ? "var(--primary)" : "var(--text-light)"} />
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Verificado</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: user.isVerified ? "var(--primary)" : "var(--text-light)" }}>
                                            {user.isVerified ? 'Sí' : 'No'}
                                        </div>
                                    </div>

                                </div>
                                
                                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                                    <Calendar size={16} /> <strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Sanction Management — only for regular users */}
                            {user.role === 'user' && (
                                <>
                                    {/* Sanciones */}
                                    <div style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={18} color="#f59e0b" /> Gestión de Sanciones
                                        </h3>

                                        {/* Progress bar */}
                                        <div style={{ marginBottom: '1.2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sanciones acumuladas</span>
                                                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: (user.sanctions || 0) >= 3 ? '#ef4444' : (user.sanctions || 0) >= 2 ? '#f59e0b' : 'var(--text-main)' }}>
                                                    {user.sanctions || 0} / 3
                                                </span>
                                            </div>
                                            <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${((user.sanctions || 0) / 3) * 100}%`, background: (user.sanctions || 0) >= 3 ? '#ef4444' : (user.sanctions || 0) >= 2 ? '#f59e0b' : '#10b981', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                                            </div>
                                            {(user.sanctions || 0) >= 3 && (
                                                <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.4rem', fontWeight: '600' }}>⛔ Cuenta suspendida permanentemente</p>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            {/* Reducir */}
                                            <button
                                                onClick={() => handleSanction('reduce')}
                                                disabled={!user.sanctions || loading === 'reduce'}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontWeight: '600', fontSize: '0.88rem', cursor: (!user.sanctions || loading) ? 'not-allowed' : 'pointer', opacity: (!user.sanctions || loading) ? 0.5 : 1, transition: 'all 0.15s', width: '100%' }}
                                                onMouseEnter={e => { if (user.sanctions && !loading) e.currentTarget.style.background = 'rgba(245,158,11,0.18)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
                                            >
                                                <MinusCircle size={16} /> {loading === 'reduce' ? 'Procesando...' : 'Reducir 1 sanción (+25 reputación)'}
                                            </button>

                                            {/* Aplicar sanción */}
                                            <button
                                                onClick={() => handleSanction('add')}
                                                disabled={!!loading}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: '600', fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.15s', width: '100%' }}
                                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                            >
                                                <Plus size={16} /> {loading === 'add' ? 'Procesando...' : 'Aplicar sanción manual (-25 reputación)'}
                                            </button>

                                            {/* Eliminar todas */}
                                            <button
                                                onClick={() => handleSanction('clear')}
                                                disabled={!user.sanctions || loading === 'clear'}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: '600', fontSize: '0.88rem', cursor: (!user.sanctions || loading) ? 'not-allowed' : 'pointer', opacity: (!user.sanctions || loading) ? 0.5 : 1, transition: 'all 0.15s', width: '100%' }}
                                                onMouseEnter={e => { if (user.sanctions && !loading) e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                                            >
                                                <Trash2 size={16} /> {loading === 'clear' ? 'Procesando...' : 'Eliminar todas las sanciones'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Control de Acceso */}
                                    <div style={{ background: 'var(--surface-solid)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Ban size={18} color="#ef4444" /> Control de Acceso
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            {/* Levantar bloqueo (si aplica) */}
                                            {user.blockedUntil && new Date(user.blockedUntil) > new Date() && (
                                                <button
                                                    onClick={() => handleSanction('unblock')}
                                                    disabled={!!loading}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: '600', fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.15s', width: '100%' }}
                                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                                                >
                                                    <ShieldOff size={16} /> {loading === 'unblock' ? 'Procesando...' : `Levantar bloqueo (hasta ${new Date(user.blockedUntil).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})`}
                                                </button>
                                            )}

                                            {/* Bloquear */}
                                            <button
                                                onClick={handleBlockUser}
                                                disabled={!!loading || user.sanctions >= 3}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: '700', fontSize: '0.88rem', cursor: (loading || user.sanctions >= 3) ? 'not-allowed' : 'pointer', opacity: (loading || user.sanctions >= 3) ? 0.5 : 1, transition: 'all 0.15s', width: '100%' }}
                                                onMouseEnter={e => { if (!loading && user.sanctions < 3) e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                                            >
                                                <Ban size={16} /> {loading ? 'Procesando...' : 'Bloquear acceso al sistema'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>

                    <div className="modal-footer-modern" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button onClick={onClose} className="modal-action-btn" style={{ fontWeight: '600' }}>
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserDetailModal;
