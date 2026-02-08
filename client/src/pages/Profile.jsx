import { useContext } from 'react';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import { User, Trophy, ThumbsUp, Minus, AlertTriangle, Camera } from 'lucide-react';

const Profile = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Cargando Perfil...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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

    return (
        <div>
            <Navbar />
            <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: '#e2e8f0', // Darker gray for visibility
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid white',
                            boxShadow: '0 0 0 2px #cbd5e1', // Outer ring for better definition
                            overflow: 'hidden'
                        }}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={64} color="var(--text-secondary)" />
                            )}
                        </div>
                        <button style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            border: '3px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            marginTop: 0,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                            <Camera size={20} color="white" />
                        </button>
                    </div>

                    <h2>{user.username}</h2>
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>{user.email}</p>

                    <div className="stats-grid">
                        <div className={`rep-badge ${repData.class}`}>
                            <div style={{ marginBottom: '0.5rem' }}>{repData.icon}</div>
                            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800' }}>{user.reputation || 0}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{repData.label}</span>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '700', textTransform: 'capitalize', color: 'var(--text-main)' }}>{user.role}</span>
                            <span className="text-sm text-muted">Tipo Cuenta</span>
                        </div>
                        <div style={{ padding: '1rem', background: user.sanctions >= 3 ? '#fee2e2' : 'var(--bg-input)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: user.sanctions >= 3 ? '1px solid var(--error)' : 'none' }}>
                            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: user.sanctions >= 3 ? 'var(--error)' : 'var(--text-main)' }}>{user.sanctions || 0}</span>
                            <span className="text-sm text-muted" style={{ color: user.sanctions >= 3 ? 'var(--error)' : 'var(--text-light)' }}>Sanciones</span>
                        </div>
                    </div>

                    <button className="secondary" style={{ marginTop: '2rem' }}>
                        Editar Información
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
