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

    return (
        <div>
            <Navbar />
            <div className="auth-container profile-container">
                <div className="card profile-card">
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: '#e2e8f0', // Darker gray for visibility
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid var(--surface)',
                            boxShadow: '0 0 0 2px var(--border-color)', // Outer ring for better definition
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {uploading && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 10
                                }}>
                                    <div style={{
                                        width: '30px',
                                        height: '30px',
                                        border: '3px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'var(--text-main)',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                </div>
                            )}

                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={64} color="var(--text-secondary)" />
                            )}
                        </div>

                        <input
                            type="file"
                            id="avatarInput"
                            className="avatar-input-hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />

                        <button
                            className="avatar-upload-btn"
                            onClick={triggerFileInput}
                            disabled={uploading}
                            style={{
                                background: uploading ? 'var(--text-muted)' : 'var(--primary)',
                                cursor: uploading ? 'default' : 'pointer',
                            }}>
                            <Camera size={20} color="var(--bg-page)" />
                        </button>
                    </div>

                    {!isEditing ? (
                        <>
                            <h2 style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', padding: 0, width: 'auto', margin: 0, color: 'var(--text-muted)', cursor: 'pointer', boxShadow: 'none' }}>
                                    <Edit2 size={18} />
                                </button>
                            </h2>
                            <p className="text-muted" style={{ marginBottom: '1rem', fontWeight: '500' }}>@{user.username} • {user.email}</p>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Nombre(s)"
                                value={editForm.firstName}
                                onChange={handleEditChange}
                                style={{ textAlign: 'center' }}
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Apellido(s)"
                                value={editForm.lastName}
                                onChange={handleEditChange}
                                style={{ textAlign: 'center' }}
                            />
                        </div>
                    )}

                    <div className="profile-info-grid">
                        <div className="profile-info-item">
                            <span className="profile-info-label">Teléfono</span>
                            {isEditing ? (
                                <input type="tel" name="phone" value={editForm.phone} onChange={handleEditChange} className="profile-info-value" style={{ padding: '0.5rem' }} />
                            ) : (
                                <div className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaPhoneAlt size={14} color="var(--primary)" />
                                    {user.phone || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label">Cédula</span>
                            {isEditing ? (
                                <input type="text" value={user.cedula || 'No especificada'} disabled className="profile-info-value" style={{ padding: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }} />
                            ) : (
                                <div className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <LiaIdCard size={18} color="var(--primary)" />
                                    {user.cedula || 'No especificada'}
                                </div>
                            )}
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label">Sexo</span>
                            {isEditing ? (
                                <select disabled className="profile-info-value" style={{ padding: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}>
                                    <option>{user.gender === 'M' ? 'Masculino' : user.gender === 'F' ? 'Femenino' : user.gender || 'No especificado'}</option>
                                </select>
                            ) : (
                                <div className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {user.gender === 'F' || user.gender === 'femenino' ? (
                                        <BsGenderFemale size={18} color="#ec4899" />
                                    ) : (
                                        <BsGenderMale size={18} color="#3b82f6" />
                                    )}
                                    {user.gender === 'M' || user.gender === 'masculino' ? 'Masculino' : user.gender === 'F' || user.gender === 'femenino' ? 'Femenino' : user.gender || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label">Nacimiento</span>
                            {isEditing ? (
                                <input type="date" name="birthDate" value={editForm.birthDate} onChange={handleEditChange} className="profile-info-value" style={{ padding: '0.5rem' }} />
                            ) : (
                                <div className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <LiaBirthdayCakeSolid size={18} color="var(--primary)" />
                                    {user.birthDate ? (
                                        <>
                                            {new Date(user.birthDate).toLocaleDateString()}{' '}
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9em' }}>
                                                ({calculateAge(user.birthDate)} años)
                                            </span>
                                        </>
                                    ) : (
                                        'No especificada'
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="profile-info-item full-width">
                            <span className="profile-info-label">Provincia</span>
                            {isEditing ? (
                                <select
                                    name="birthProvince"
                                    value={editForm.birthProvince}
                                    onChange={handleEditChange}
                                    className="profile-info-value"
                                    style={{ padding: '0.5rem', width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                                >
                                    <option value="">Selecciona una provincia...</option>
                                    <option value="Azua">Azua</option>
                                    <option value="Baoruco">Baoruco</option>
                                    <option value="Barahona">Barahona</option>
                                    <option value="Dajabón">Dajabón</option>
                                    <option value="Distrito Nacional">Distrito Nacional</option>
                                    <option value="Duarte">Duarte</option>
                                    <option value="El Seibo">El Seibo</option>
                                    <option value="Elías Piña">Elías Piña</option>
                                    <option value="Espaillat">Espaillat</option>
                                    <option value="Hato Mayor">Hato Mayor</option>
                                    <option value="Hermanas Mirabal">Hermanas Mirabal</option>
                                    <option value="Independencia">Independencia</option>
                                    <option value="La Altagracia">La Altagracia</option>
                                    <option value="La Romana">La Romana</option>
                                    <option value="La Vega">La Vega</option>
                                    <option value="María Trinidad Sánchez">María Trinidad Sánchez</option>
                                    <option value="Monseñor Nouel">Monseñor Nouel</option>
                                    <option value="Monte Cristi">Monte Cristi</option>
                                    <option value="Monte Plata">Monte Plata</option>
                                    <option value="Pedernales">Pedernales</option>
                                    <option value="Peravia">Peravia</option>
                                    <option value="Puerto Plata">Puerto Plata</option>
                                    <option value="Samaná">Samaná</option>
                                    <option value="San Cristóbal">San Cristóbal</option>
                                    <option value="San José de Ocoa">San José de Ocoa</option>
                                    <option value="San Juan">San Juan</option>
                                    <option value="San Pedro de Macorís">San Pedro de Macorís</option>
                                    <option value="Sánchez Ramírez">Sánchez Ramírez</option>
                                    <option value="Santiago">Santiago</option>
                                    <option value="Santiago Rodríguez">Santiago Rodríguez</option>
                                    <option value="Santo Domingo">Santo Domingo</option>
                                    <option value="Valverde">Valverde</option>
                                </select>
                            ) : (
                                <div className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RiUserLocationLine size={18} color="var(--primary)" />
                                    {user.birthProvince || 'No especificada'}
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                            <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: 'auto', background: 'var(--success)', marginTop: 0, padding: '0.8rem 1.5rem' }}>
                                <Check size={18} /> {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={() => setIsEditing(false)} disabled={saving} className="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: 'auto', marginTop: 0, padding: '0.8rem 1.5rem' }}>
                                <X size={18} /> Cancelar
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                        <div style={{
                            padding: '2rem 1.5rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '20px',
                            border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            <Star size={32} color="var(--success)" />
                            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reputación</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--success)', lineHeight: '1' }}>{user.reputation || 0}</div>
                        </div>

                        <div style={{
                            padding: '2rem 1.5rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '20px',
                            border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            <AlertTriangle size={32} color="var(--error)" />
                            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sanciones</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--error)', lineHeight: '1' }}>{user.sanctions || 0}</div>
                        </div>

                        <div style={{
                            padding: '2rem 1.5rem', background: 'var(--bg-input)', borderRadius: '20px',
                            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--shadow-sm)',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            <CheckCircle size={32} color={user.isVerified ? "var(--primary)" : "var(--text-light)"} />
                            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verificado</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: user.isVerified ? "var(--primary)" : "var(--text-light)", lineHeight: '1' }}>
                                {user.isVerified ? 'Sí' : 'No'}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
