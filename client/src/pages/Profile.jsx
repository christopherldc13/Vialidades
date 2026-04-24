import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import { User, Trophy, ThumbsUp, Minus, AlertTriangle, Camera, Edit2, Check, X, Star, CheckCircle } from 'lucide-react';
import { FaPhoneAlt, FaUserEdit } from "react-icons/fa";
import { LiaIdCard, LiaBirthdayCakeSolid } from "react-icons/lia";
import { BsGenderFemale, BsGenderMale } from "react-icons/bs";
import { RiUserLocationLine } from "react-icons/ri";
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Skeleton, Box } from '@mui/material';

const calculateAge = (dobString) => {
    if (!dobString) return '';
    const today = new Date();
    const dob = new Date(dobString);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

const Profile = () => {
    const { user, setUser, loading } = useContext(AuthContext);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="auth-container profile-container">
                    <div className="card profile-card">
                        {/* Avatar Skeleton */}
                        <Box sx={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                            <Skeleton variant="circular" width={120} height={120} animation="wave" />
                        </Box>

                        {/* Name & Email Skeletons */}
                        <Box sx={{ mb: 4 }}>
                            <Skeleton variant="text" width="40%" height={40} sx={{ mx: 'auto', mb: 1 }} animation="wave" />
                            <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto' }} animation="wave" />
                        </Box>

                        {/* Info Grid Skeletons */}
                        <div className="profile-info-grid">
                            {Array.from(new Array(5)).map((_, i) => (
                                <Box key={i} className="profile-info-item">
                                    <Skeleton variant="text" width="40%" height={15} sx={{ mb: 1 }} animation="wave" />
                                    <Skeleton variant="text" width="80%" height={25} animation="wave" />
                                </Box>
                            ))}
                        </div>

                        {/* Stats Grid Skeletons */}
                        <div className="stats-grid" style={{ marginTop: '2rem' }}>
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius)' }} animation="wave" />
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius)' }} animation="wave" />
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius)' }} animation="wave" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Por favor inicia sesión para ver el perfil.</p>
            </div>
        );
    }

    const getReputationData = (score) => {
        const s = score || 0;
        if (s >= 90) return { icon: <Trophy size={32} />, label: 'Excelente', class: 'rep-excellent' };
        if (s >= 70) return { icon: <ThumbsUp size={32} />, label: 'Bueno', class: 'rep-good' };
        if (s >= 50) return { icon: <Minus size={32} />, label: 'Promedio', class: 'rep-average' };
        return { icon: <AlertTriangle size={32} />, label: 'Bajo', class: 'rep-bad' };
    };

    const repData = getReputationData(user.reputation);

    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        cedula: user?.cedula || '',
        gender: user?.gender || '',
        birthDate: user?.birthDate ? user.birthDate.split('T')[0] : '',
        birthProvince: user?.birthProvince || ''
    });

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await axios.patch('/api/auth/profile', editForm, {
                headers: {
                    'x-auth-token': token
                }
            });
            // Sync local state immediately
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));

            // Give user visual feedback
            setIsEditing(false);
            setSaving(false);
            toast.success('Perfil actualizado con éxito.');
        } catch (error) {
            setSaving(false);
            console.error('Error saving profile:', error);
            toast.error('Error al guardar el perfil: ' + (error.response?.data?.msg || error.message));
        }
    };

    // Helper to trigger file input
    const triggerFileInput = () => {
        document.getElementById('avatarInput').click();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        // Optional: Sending username/email again isn't strictly necessary if backend allows partial updates
        // but backend logic checks if(username) etc. so sending just avatar is fine.

        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const res = await axios.patch('/api/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token
                }
            });

            // Sync local state immediately
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));

            setUploading(false);
            Swal.fire({
                icon: 'success',
                title: '¡Foto Actualizada!',
                text: 'Tu imagen de perfil se ha cambiado con éxito.',
                confirmButtonText: 'Genial',
                confirmButtonColor: 'var(--primary)'
            });

            // Reload user data from context or update locally after delay or modal close
            // For now, we wait for user to close modal to reload
        } catch (err) {
            setUploading(false);
            console.error("Upload error", err);
            const msg = err.response?.data?.msg || err.message || "Error al subir la imagen";
            toast.error(`Error: ${msg}`);
        }
    };

    const provinces = ['Azua','Baoruco','Barahona','Dajabón','Distrito Nacional','Duarte','El Seibo','Elías Piña','Espaillat','Hato Mayor','Hermanas Mirabal','Independencia','La Altagracia','La Romana','La Vega','María Trinidad Sánchez','Monseñor Nouel','Monte Cristi','Monte Plata','Pedernales','Peravia','Puerto Plata','Samaná','San Cristóbal','San José de Ocoa','San Juan','San Pedro de Macorís','Sánchez Ramírez','Santiago','Santiago Rodríguez','Santo Domingo','Valverde'];

    const isFemale = user.gender === 'F' || user.gender === 'femenino';
    const genderLabel = user.gender === 'M' || user.gender === 'masculino' ? 'Masculino' : user.gender === 'F' || user.gender === 'femenino' ? 'Femenino' : user.gender || 'No especificado';

    const InfoRow = ({ icon, label, children }) => (
        <div className="pf-info-row">
            <div className="pf-info-icon">{icon}</div>
            <div className="pf-info-content">
                <span className="pf-info-label">{label}</span>
                <div className="pf-info-value">{children}</div>
            </div>
        </div>
    );

    return (
        <div className="pf-page">
            <Navbar />
            <style>{`@keyframes pf-spin { to { transform: rotate(360deg); } }`}</style>

            <div className="pf-body">

                {/* ── LEFT COLUMN ── */}
                <div className="pf-left">

                    {/* Avatar card */}
                    <div className="pf-card pf-avatar-card">
                        <div className="pf-avatar-wrap">
                            <div className="pf-avatar-ring">
                                {uploading && (
                                    <div className="pf-avatar-overlay">
                                        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pf-spin 0.8s linear infinite' }} />
                                    </div>
                                )}
                                {user.avatar
                                    ? <img src={user.avatar} alt="Avatar" className="pf-avatar-img" />
                                    : <User size={56} color="var(--text-muted)" />
                                }
                            </div>
                            <input type="file" id="avatarInput" className="avatar-input-hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            <button className="pf-cam-btn" onClick={triggerFileInput} disabled={uploading} style={{ background: uploading ? 'var(--text-muted)' : 'var(--primary)', cursor: uploading ? 'default' : 'pointer' }}>
                                <Camera size={16} color="#fff" />
                            </button>
                        </div>

                        {!isEditing ? (
                            <div className="pf-identity">
                                <div className="pf-identity-name">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                    <button onClick={() => setIsEditing(true)} className="pf-edit-icon-btn" title="Editar perfil">
                                        <Edit2 size={15} />
                                    </button>
                                </div>
                                <div className="pf-identity-user">@{user.username}</div>
                                <div className="pf-identity-email">{user.email}</div>
                                {user.role && user.role !== 'user' && (
                                    <span className="pf-role-badge">{user.role}</span>
                                )}
                            </div>
                        ) : (
                            <div className="pf-edit-name-block">
                                <input type="text" name="firstName" placeholder="Nombre(s)" value={editForm.firstName} onChange={handleEditChange} style={{ textAlign: 'center' }} />
                                <input type="text" name="lastName" placeholder="Apellido(s)" value={editForm.lastName} onChange={handleEditChange} style={{ textAlign: 'center' }} />
                                <div className="pf-edit-actions">
                                    <button onClick={handleSaveProfile} disabled={saving} className="pf-btn-save">
                                        <Check size={15} /> {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} disabled={saving} className="pf-btn-cancel">
                                        <X size={15} /> Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="pf-card pf-stats-card">
                        <div className="pf-stat" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.07)' }}>
                            <Star size={22} color="var(--success)" />
                            <div className="pf-stat-body">
                                <span className="pf-stat-label">Reputación</span>
                                <span className="pf-stat-value" style={{ color: 'var(--success)' }}>{user.reputation || 0}</span>
                            </div>
                        </div>
                        <div className="pf-stat" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)' }}>
                            <AlertTriangle size={22} color="var(--error)" />
                            <div className="pf-stat-body">
                                <span className="pf-stat-label">Sanciones</span>
                                <span className="pf-stat-value" style={{ color: 'var(--error)' }}>{user.sanctions || 0}</span>
                            </div>
                        </div>
                        <div className="pf-stat" style={{ borderColor: user.isVerified ? 'rgba(99,102,241,0.25)' : 'var(--border-color)', background: user.isVerified ? 'rgba(99,102,241,0.07)' : 'var(--bg-input)' }}>
                            <CheckCircle size={22} color={user.isVerified ? 'var(--primary)' : 'var(--text-muted)'} />
                            <div className="pf-stat-body">
                                <span className="pf-stat-label">Cuenta</span>
                                <span className="pf-stat-value" style={{ color: user.isVerified ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {user.isVerified ? 'Verificada' : 'Sin verificar'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="pf-right">
                    <div className="pf-card">
                        <div className="pf-card-header">
                            <div className="pf-card-title">
                                <FaUserEdit size={17} color="var(--primary)" />
                                Información Personal
                            </div>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="pf-edit-btn">
                                    <Edit2 size={14} /> Editar
                                </button>
                            )}
                        </div>

                        <div className="pf-info-list">
                            <InfoRow icon={<FaPhoneAlt size={14} color="var(--primary)" />} label="Teléfono">
                                {isEditing
                                    ? <input type="tel" name="phone" value={editForm.phone} onChange={handleEditChange} className="pf-field-input" />
                                    : <span>{user.phone || 'No especificado'}</span>
                                }
                            </InfoRow>

                            <InfoRow icon={<LiaIdCard size={18} color="var(--primary)" />} label="Cédula">
                                {isEditing
                                    ? <input type="text" value={user.cedula || ''} disabled className="pf-field-input" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                                    : <span>{user.cedula || 'No especificada'}</span>
                                }
                            </InfoRow>

                            <InfoRow icon={isFemale ? <BsGenderFemale size={17} color="#ec4899" /> : <BsGenderMale size={17} color="#3b82f6" />} label="Sexo">
                                {isEditing
                                    ? <select disabled className="pf-field-input" style={{ opacity: 0.5, cursor: 'not-allowed' }}><option>{genderLabel}</option></select>
                                    : <span>{genderLabel}</span>
                                }
                            </InfoRow>

                            <InfoRow icon={<LiaBirthdayCakeSolid size={17} color="var(--primary)" />} label="Fecha de Nacimiento">
                                {isEditing
                                    ? <input type="date" name="birthDate" value={editForm.birthDate} onChange={handleEditChange} className="pf-field-input" />
                                    : <span>
                                        {user.birthDate
                                            ? <>{new Date(user.birthDate).toLocaleDateString('es-DO')} <strong style={{ color: 'var(--primary)' }}>· {calculateAge(user.birthDate)} años</strong></>
                                            : 'No especificada'
                                        }
                                    </span>
                                }
                            </InfoRow>

                            <InfoRow icon={<RiUserLocationLine size={17} color="var(--primary)" />} label="Provincia">
                                {isEditing
                                    ? <select name="birthProvince" value={editForm.birthProvince} onChange={handleEditChange} className="pf-field-input">
                                        <option value="">Selecciona...</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    : <span>{user.birthProvince || 'No especificada'}</span>
                                }
                            </InfoRow>
                        </div>

                        {isEditing && (
                            <div className="pf-edit-footer">
                                <button onClick={handleSaveProfile} disabled={saving} className="pf-btn-save">
                                    <Check size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                                <button onClick={() => setIsEditing(false)} disabled={saving} className="pf-btn-cancel">
                                    <X size={15} /> Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
