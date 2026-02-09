import { useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Camera } from 'lucide-react';
import DraggableMap from '../components/DraggableMap';

const CreateReport = () => {
    const [type, setType] = useState('Traffic');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState(null);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const fileArray = Array.from(e.target.files);

            // Validate Files
            const validFiles = [];
            const newPreviews = [];

            fileArray.forEach(file => {
                const isVideo = file.type.startsWith('video');
                const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB video, 10MB image

                if (file.size > maxSize) {
                    alert(`El archivo ${file.name} es demasiado grande. Máximo ${isVideo ? '100MB' : '10MB'}.`);
                    return;
                }
                validFiles.push(file);
                newPreviews.push(URL.createObjectURL(file));
            });

            if (validFiles.length > 0) {
                setFiles(prevFiles => [...prevFiles, ...validFiles]);
                setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
            }
        }
    };

    const removeFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));

        // Revoke the URL to avoid memory leaks
        URL.revokeObjectURL(previews[index]);
        setPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [address, setAddress] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) return alert('Debes iniciar sesión para reportar.');
        if (!location) return alert('Por favor selecciona la ubicación.');

        const formData = new FormData();
        // userId is handled by backend from token
        formData.append('type', type);
        formData.append('description', description);
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
        formData.append('address', address); // Send the address

        files.forEach(file => {
            formData.append('media', file);
        });

        try {
            setLoading(true);
            await axios.post('/api/reports', formData);
            setLoading(false);
            setShowSuccessModal(true); // Show modal instead of navigating immediately
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert('Error al crear reporte: ' + (err.response?.data?.msg || err.message));
        }
    };

    if (authLoading) {
        return <div className="auth-container">Cargando...</div>;
    }

    if (!user) {
        return <div className="auth-container">Por favor inicia sesión para reportar.</div>;
    }

    return (
        <div>
            <Navbar />
            <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
                <div className="card" style={{ maxWidth: '600px', position: 'relative' }}>
                    <h2 className="text-center">Nuevo Reporte</h2>
                    <form onSubmit={handleSubmit}>
                        {/* Read-Only User Field */}
                        <div className="input-group">
                            <label>Reportando como</label>
                            <div style={{
                                background: '#f8fafc',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid #e2e8f0',
                                color: 'var(--text-main)',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                {user.username}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Tipo de Incidente</label>
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="Traffic">🚗 Tráfico Pesado</option>
                                <option value="Accident">💥 Accidente</option>
                                <option value="Violation">🚫 Infracción</option>
                                <option value="Hazard">⚠️ Peligro en la vía</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                placeholder="Describe qué está pasando..."
                            />
                        </div>

                        <div className="input-group">
                            <label>Ubicación</label>
                            <p className="text-sm text-muted" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
                                Arrastra el marcador 📍 a la ubicación exacta del incidente.
                            </p>
                            <DraggableMap location={location} setLocation={setLocation} setAddress={setAddress} />

                            {/* Address Display */}
                            {address && (
                                <div style={{
                                    background: '#f1f5f9',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    marginBottom: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>📍</span>
                                    <strong>{address}</strong>
                                </div>
                            )}

                            {location && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={`Lat: ${location.lat.toFixed(6)}`}
                                        disabled
                                        style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '0.8rem', flex: 1 }}
                                    />
                                    <input
                                        type="text"
                                        value={`Lng: ${location.lng.toFixed(6)}`}
                                        disabled
                                        style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '0.8rem', flex: 1 }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label>Fotos / Videos</label>
                            <div className="file-upload-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: 'none', background: 'transparent', padding: 0 }}>
                                {/* Camera Option */}
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    capture="environment"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="camera-upload"
                                />
                                <label htmlFor="camera-upload" style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1.5rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 'var(--radius)',
                                    background: '#f8fafc',
                                    height: '100%'
                                }}>
                                    <Camera size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Cámara</span>
                                </label>

                                {/* Gallery Option */}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="gallery-upload"
                                />
                                <label htmlFor="gallery-upload" style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1.5rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 'var(--radius)',
                                    background: '#f8fafc',
                                    height: '100%'
                                }}>
                                    <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>🖼️</div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Galería</span>
                                </label>
                            </div>

                            {files.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                    {files.map((file, index) => (
                                        <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000' }}>
                                            {file.type.startsWith('video') ? (
                                                <video
                                                    src={previews[index]}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <img
                                                    src={previews[index]}
                                                    alt={`Preview ${index}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: 'rgba(0,0,0,0.5)',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    marginTop: 0
                                                }}
                                            >
                                                ✕
                                            </button>

                                            {file.type.startsWith('video') && (
                                                <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem' }}>
                                                    VIDEO
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {files.length > 0 && (
                                <p className="text-center" style={{ color: 'var(--success)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    ✓ {files.length} archivos seleccionados
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Enviando Reporte...' : 'Enviar Reporte'}
                        </button>
                    </form>

                    {/* Success Modal Overlay */}
                    {showSuccessModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                                <h3>¡Reporte Enviado!</h3>
                                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                                    Gracias por ayudar a la comunidad. Tu reporte será revisado pronto.
                                </p>
                                <div className="modal-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                                    <button onClick={() => navigate('/dashboard')} className="primary">
                                        Ir al Panel Principal
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="secondary"
                                        style={{ width: '100%' }}
                                    >
                                        Crear Otro Reporte
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateReport;
