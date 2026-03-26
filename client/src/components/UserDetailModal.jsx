import React from 'react';
import { X, User, Mail, Shield, Calendar, AlertTriangle, Star, CheckCircle } from 'lucide-react';
import { FaPhoneAlt } from "react-icons/fa";
import { LiaIdCard, LiaBirthdayCakeSolid } from "react-icons/lia";
import { BsGenderFemale, BsGenderMale } from "react-icons/bs";
import { RiUserLocationLine } from "react-icons/ri";
import { motion, AnimatePresence } from 'framer-motion';

const UserDetailModal = ({ user, isOpen, onClose }) => {
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
