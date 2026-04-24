import { useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Camera, Video, Sparkles, X } from 'lucide-react';
import DraggableMap from '../components/DraggableMap';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Box, LinearProgress, Typography } from '@mui/material';
import { CiLocationOn } from "react-icons/ci";
import { GrGallery } from "react-icons/gr";
import { FaCar, FaCarCrash } from "react-icons/fa";
import { BsSignStopFill } from "react-icons/bs";
import { LuTriangleAlert } from "react-icons/lu";
import { IoIosSend } from "react-icons/io";
import { IoMdHelpCircle } from "react-icons/io";

function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    Subiendo archivos...
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="body2" sx={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
            <Box sx={{ width: '100%' }}>
                <LinearProgress
                    variant="determinate"
                    {...props}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-input)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: 'var(--primary)',
                        }
                    }}
                />
            </Box>
        </Box>
    );
}

const CreateReport = () => {
    const [type, setType] = useState('');
    const [customType, setCustomType] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('');


    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [refreshLocationTrigger, setRefreshLocationTrigger] = useState(0); // Trigger for map refresh
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // New Car Fields
    const [carBrand, setCarBrand] = useState('');
    const [carModel, setCarModel] = useState('');
    const [carYear, setCarYear] = useState('');
    const [carColor, setCarColor] = useState('');
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                    toast.error(`El archivo ${file.name} es demasiado grande. Máximo ${isVideo ? '100MB' : '10MB'}.`);
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

    const handleAIIdentify = async () => {
        const imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) {
            toast.error('Por favor, selecciona una imagen primero.');
            return;
        }

        try {
            setIsAnalyzing(true);
            // Clear current car info when starting new analysis
            setCarBrand('');
            setCarModel('');
            setCarYear('');
            setCarColor('');

            const formData = new FormData();
            formData.append('image', imageFile);

            const token = localStorage.getItem('token');
            const startTime = Date.now();

            const res = await axios.post('/api/ai/identify-vehicle', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token
                }
            });

            // Añadir un retraso artificial (visual de "búsqueda profunda" de ~20s como pidió el usuario)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 20000) {
                await new Promise(resolve => setTimeout(resolve, 20000 - elapsedTime));
            }

            if (res.data) {
                setCarBrand(res.data.brand || '');
                setCarModel(res.data.model || '');
                setCarYear(res.data.year || '');
                setCarColor(res.data.color || '');
                toast.success('Vehículo identificado con éxito.');
            }
        } catch (err) {
            console.error('AI Identification Error:', err);
            const errorMsg = err.response?.data?.msg || 'Error al identificar el vehículo.';
            toast.error(errorMsg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) { toast.error('Debes iniciar sesión para reportar.'); return; }
        if (!location) { toast.error('Por favor selecciona la ubicación.'); return; }

        const finalType = type === 'Other' ? customType : type;
        if (!finalType.trim()) { toast.error('Por favor especifica el tipo de incidente.'); return; }

        const formData = new FormData();
        // userId is handled by backend from token
        formData.append('type', finalType);
        formData.append('description', description);
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
        formData.append('address', address); // Send the address
        formData.append('carBrand', carBrand);
        formData.append('carModel', carModel);
        formData.append('carYear', carYear);
        formData.append('carColor', carColor);

        files.forEach(file => {
            formData.append('media', file);
        });

        try {
            setLoading(true);
            setUploadProgress(0);

            await axios.post('/api/reports', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            setLoading(false);

            Swal.fire({
                icon: 'success',
                title: '¡Reporte Enviado!',
                text: 'Gracias por ayudar a la comunidad. Tu reporte será revisado pronto.',
                showCancelButton: true,
                confirmButtonText: 'Ir al Panel Principal',
                cancelButtonText: 'Crear Otro Reporte',
                confirmButtonColor: 'var(--primary)'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/dashboard');
                } else {
                    setType('');
                    setCustomType('');
                    setDescription('');
                    setLocation(null);
                    setAddress('');
                    setCarBrand('');
                    setCarModel('');
                    setCarYear('');
                    setCarColor('');
                    setFiles([]);
                    previews.forEach(url => URL.revokeObjectURL(url));
                    setPreviews([]);
                }
            });
        } catch (err) {
            console.error(err);
            setLoading(false);
            toast.error('Error al crear reporte: ' + (err.response?.data?.msg || err.message));
        }
    };

    if (authLoading) {
        return <div className="auth-container">Cargando...</div>;
    }

    if (!user) {
        return <div className="auth-container">Por favor inicia sesión para reportar.</div>;
    }

    const incidentTypes = [
        { id: 'Traffic',   label: 'Tráfico Pesado',   icon: <FaCar />,          color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
        { id: 'Accident',  label: 'Accidente',         icon: <FaCarCrash />,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
        { id: 'Violation', label: 'Infracción',        icon: <BsSignStopFill />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
        { id: 'Hazard',    label: 'Peligro en la vía', icon: <LuTriangleAlert />,color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
        { id: 'Other',     label: 'Otro',              icon: <IoMdHelpCircle />, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    ];

    const SectionLabel = ({ number, text }) => (
        <div className="cr-section-label">
            <div className="cr-section-num">{number}</div>
            <span className="cr-section-text">{text}</span>
            <div className="cr-section-line" />
        </div>
    );

    return (
        <div className="cr-page">
            <Navbar />

            {/* Page header */}
            <div className="cr-header">
                <div className="cr-header-inner">
                    <div>
                        <h1 className="cr-header-title">Nuevo Reporte</h1>
                        <p className="cr-header-sub">Reporta un incidente vial para ayudar a tu comunidad</p>
                    </div>
                    <div className="cr-user-pill">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="cr-user-avatar" />
                        ) : (
                            <div className="cr-user-avatar-fallback">{user.username.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                            <div className="cr-user-label">Reportando como</div>
                            <div className="cr-user-name">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="cr-body">
                <form onSubmit={handleSubmit}>
                    <div className="cr-grid">

                        {/* LEFT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Incident Type */}
                            <div className="cr-section">
                                <SectionLabel number="1" text="Tipo de Incidente" />
                                <div className="cr-type-grid">
                                    {incidentTypes.map((t) => {
                                        const selected = type === t.id;
                                        return (
                                            <div
                                                key={t.id}
                                                onClick={() => setType(t.id)}
                                                className="cr-type-card"
                                                style={{
                                                    background: selected ? t.bg : 'var(--bg-page)',
                                                    borderColor: selected ? t.color : 'var(--border-color)',
                                                    transform: selected ? 'translateY(-2px)' : 'none',
                                                    boxShadow: selected ? `0 6px 16px ${t.color}30` : 'none',
                                                    color: selected ? t.color : 'var(--text-main)',
                                                    fontWeight: selected ? 800 : 600,
                                                }}
                                            >
                                                <div className="cr-type-icon" style={{ color: selected ? t.color : 'var(--text-muted)' }}>
                                                    {t.icon}
                                                </div>
                                                {t.label}
                                            </div>
                                        );
                                    })}
                                </div>
                                {type === 'Other' && (
                                    <input
                                        type="text"
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        placeholder="Especifique el tipo de incidente"
                                        required
                                        style={{ marginTop: '1rem', width: '100%' }}
                                    />
                                )}
                            </div>

                            {/* Description */}
                            <div className="cr-section">
                                <SectionLabel number="2" text="Descripción" />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    placeholder="Describe con detalle qué está pasando: cantidad de vehículos, estado de la vía, heridos, etc."
                                    style={{ width: '100%', height: '130px', resize: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Vehicle */}
                            <div className="cr-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>3</div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vehículo Involucrado</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>(opcional)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAIIdentify}
                                        disabled={isAnalyzing || !files.some(f => f.type.startsWith('image/'))}
                                        title={!files.some(f => f.type.startsWith('image/')) ? 'Sube una foto primero' : 'Identificar con IA'}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.45rem 0.9rem', borderRadius: '0.6rem',
                                            background: 'transparent',
                                            border: '1.5px solid var(--primary)',
                                            color: 'var(--primary)',
                                            fontSize: '0.8rem', fontWeight: 700,
                                            cursor: (isAnalyzing || !files.some(f => f.type.startsWith('image/'))) ? 'not-allowed' : 'pointer',
                                            opacity: (isAnalyzing || !files.some(f => f.type.startsWith('image/'))) ? 0.5 : 1,
                                            width: 'auto', margin: 0, boxShadow: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Sparkles size={14} />
                                        {isAnalyzing ? 'Detectando...' : 'Identificar con IA'}
                                    </button>
                                </div>

                                {isAnalyzing ? (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        padding: '2rem 1rem', background: 'var(--bg-page)',
                                        borderRadius: '0.75rem', border: '2px dashed var(--primary)',
                                        color: 'var(--primary)', textAlign: 'center', position: 'relative', overflow: 'hidden'
                                    }}>
                                        <style>{`
                                            @keyframes aiFloat { 0%,100%{transform:translateY(0);filter:drop-shadow(0 0 2px var(--primary))} 50%{transform:translateY(-8px);filter:drop-shadow(0 0 12px var(--primary))} }
                                            @keyframes aiPulseText { 0%,100%{opacity:0.7} 50%{opacity:1} }
                                            @keyframes aiScanLine { 0%{top:-10%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:110%;opacity:0} }
                                        `}</style>
                                        <div style={{ position: 'relative', marginBottom: '1rem', animation: 'aiFloat 2.5s ease-in-out infinite' }}>
                                            <FaCar size={42} />
                                            <Sparkles size={16} style={{ position: 'absolute', top: -8, right: -12, color: '#FFD700', animation: 'aiPulseText 1s ease-in-out infinite' }} />
                                            <div style={{ position: 'absolute', left: '-20%', width: '140%', height: '2px', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)', animation: 'aiScanLine 2s linear infinite' }} />
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem', animation: 'aiPulseText 2s infinite' }}>Escaneando base de datos...</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>Extrayendo fabricante, año, modelo y color</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        {[
                                            { label: 'Marca', val: carBrand, set: setCarBrand, placeholder: 'Ej: Toyota' },
                                            { label: 'Modelo', val: carModel, set: setCarModel, placeholder: 'Ej: Corolla' },
                                            { label: 'Año', val: carYear, set: setCarYear, placeholder: 'Ej: 2022' },
                                            { label: 'Color', val: carColor, set: setCarColor, placeholder: 'Ej: Blanco' },
                                        ].map(({ label, val, set, placeholder }) => (
                                            <div className="input-group" key={label} style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.78rem' }}>{label}</label>
                                                <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={placeholder} style={{ padding: '0.6rem 0.9rem', fontSize: '0.875rem' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Map */}
                            <div className="cr-section">
                                <SectionLabel number="4" text="Ubicación del Incidente" />
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                                    Arrastra el marcador <CiLocationOn size={15} style={{ color: 'var(--primary)', verticalAlign: 'text-bottom', display: 'inline' }} /> a la ubicación exacta del incidente o usa el buscador.
                                </p>
                                <DraggableMap location={location} setLocation={setLocation} setAddress={setAddress} refreshLocation={refreshLocationTrigger} />

                                {address && (
                                    <div style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                                        marginTop: '0.75rem', padding: '0.75rem 1rem',
                                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                                        borderRadius: '0.75rem', fontSize: '0.85rem', color: 'var(--text-main)',
                                    }}>
                                        <CiLocationOn size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }} />
                                        <span>{address}</span>
                                    </div>
                                )}

                                {location && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                                        <div style={{ flex: 1, padding: '0.45rem 0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                                            Lat: {location.lat.toFixed(6)}
                                        </div>
                                        <div style={{ flex: 1, padding: '0.45rem 0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                                            Lng: {location.lng.toFixed(6)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Media upload */}
                            <div className="cr-section">
                                <SectionLabel number="5" text="Fotos y Videos" />

                                <div className="cr-media-grid" style={{ marginBottom: files.length > 0 ? '1rem' : 0 }}>
                                    {[
                                        { id: 'camera-photo-upload', accept: 'image/*', capture: 'environment', icon: <Camera size={22} />, label: 'Foto' },
                                        { id: 'camera-video-upload', accept: 'video/*', capture: 'environment', icon: <Video size={22} />, label: 'Video' },
                                        { id: 'gallery-upload', accept: 'image/*,video/*', multiple: true, icon: <GrGallery size={20} />, label: 'Galería' },
                                    ].map(({ id, accept, capture, multiple, icon, label }) => (
                                        <div key={id}>
                                            <input type="file" accept={accept} capture={capture} multiple={multiple} onChange={handleFileChange} style={{ display: 'none' }} id={id} />
                                            <label
                                                htmlFor={id}
                                                onClick={() => setRefreshLocationTrigger(p => p + 1)}
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    gap: '0.4rem', padding: '1.1rem 0.5rem',
                                                    border: '1.5px dashed var(--border-color)',
                                                    borderRadius: '0.875rem', background: 'var(--bg-page)',
                                                    cursor: 'pointer', transition: 'all 0.18s ease',
                                                    color: 'var(--primary)',
                                                }}
                                            >
                                                {icon}
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {files.length > 0 && (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
                                            {files.map((file, index) => (
                                                <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.625rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
                                                    {file.type.startsWith('video') ? (
                                                        <video src={previews[index]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img src={previews[index]} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                    <div role="button" tabIndex={0} className="preview-remove-btn" onClick={() => removeFile(index)} onKeyDown={e => e.key === 'Enter' && removeFile(index)}>
                                                        <X size={13} strokeWidth={2.5} />
                                                    </div>
                                                    {file.type.startsWith('video') && (
                                                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.65)', color: 'white', padding: '2px 5px', borderRadius: '3px', fontSize: '0.58rem', fontWeight: 700 }}>VIDEO</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>
                                            <span style={{ fontSize: '1rem' }}>✓</span> {files.length} {files.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit area */}
                    <div className="cr-submit-bar">
                        <p className="cr-submit-disclaimer">
                            Al enviar este reporte confirmas que la información es veraz y corresponde a un incidente real.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '280px' }}>
                            {loading && <LinearProgressWithLabel value={uploadProgress} />}
                            <button type="submit" disabled={loading} className="cr-submit-btn">
                                <IoIosSend size={20} />
                                {loading ? (uploadProgress < 100 ? 'Subiendo...' : 'Procesando...') : 'Enviar Reporte'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateReport;
