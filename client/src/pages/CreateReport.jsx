import { useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Camera, Video, Sparkles } from 'lucide-react';
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

    // Load Draft from LocalStorage
    useEffect(() => {
        const savedDraft = localStorage.getItem('report_draft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.type) {
                    if (['Traffic', 'Accident', 'Violation', 'Hazard'].includes(draft.type)) {
                        setType(draft.type);
                    } else {
                        setType('Other');
                        setCustomType(draft.type);
                    }
                }
                if (draft.description) setDescription(draft.description);
                // Validate location structure before setting
                if (draft.location && typeof draft.location.lat === 'number' && typeof draft.location.lng === 'number') {
                    setLocation(draft.location);
                }
                if (draft.address) setAddress(draft.address);
                if (draft.carBrand) setCarBrand(draft.carBrand);
                if (draft.carModel) setCarModel(draft.carModel);
                if (draft.carYear) setCarYear(draft.carYear);
                if (draft.carColor) setCarColor(draft.carColor);
            } catch (e) {
                console.error("Error loading draft", e);
                // If draft is corrupted, clear it
                localStorage.removeItem('report_draft');
            }
        }
    }, []);

    // Save Draft to LocalStorage
    useEffect(() => {
        const typeToSave = type === 'Other' ? customType : type;
        const draft = { type: typeToSave, description, location, address, carBrand, carModel, carYear, carColor };
        localStorage.setItem('report_draft', JSON.stringify(draft));
    }, [type, customType, description, location, address, carBrand, carModel, carYear, carColor]);

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
            localStorage.removeItem('report_draft'); // Clear draft on success

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

    return (
        <div>
            <Navbar />
            <div className="auth-container profile-container">
                <div className="card profile-card" style={{ position: 'relative' }}>
                    <h2 className="text-center">Nuevo Reporte</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-split-grid">
                            <div className="form-column">
                                {/* Read-Only User Field */}
                                <div className="input-group">
                                    <label>Reportando como</label>
                                    <div style={{
                                        background: 'var(--bg-input)',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-main)',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt="Avatar"
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {user.firstName && user.lastName
                                            ? `${user.firstName} ${user.lastName}`
                                            : user.username}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Tipo de Incidente</label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                        gap: '0.75rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        {[
                                            { id: 'Traffic', label: 'Tráfico Pesado', icon: <FaCar />, color: '#f59e0b' },
                                            { id: 'Accident', label: 'Accidente', icon: <FaCarCrash />, color: '#ef4444' },
                                            { id: 'Violation', label: 'Infracción', icon: <BsSignStopFill />, color: '#6366f1' },
                                            { id: 'Hazard', label: 'Peligro en la vía', icon: <LuTriangleAlert />, color: '#ef4444' },
                                            { id: 'Other', label: 'Otro', icon: <IoMdHelpCircle />, color: '#64748b' }
                                        ].map((t) => (
                                            <div
                                                key={t.id}
                                                onClick={() => setType(t.id)}
                                                style={{
                                                    background: type === t.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input)',
                                                    border: `2px solid ${type === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                                                    borderRadius: '16px',
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: type === t.id ? '0 8px 20px rgba(99, 102, 241, 0.15)' : 'none',
                                                    transform: type === t.id ? 'translateY(-2px)' : 'none',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    color: type === t.id ? 'var(--primary)' : 'var(--text-light)',
                                                    transition: 'color 0.2s'
                                                }}>
                                                    {t.icon}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: type === t.id ? '800' : '600',
                                                    color: type === t.id ? 'var(--primary)' : 'var(--text-main)',
                                                    transition: 'color 0.2s'
                                                }}>
                                                    {t.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {type === 'Other' && (
                                        <input
                                            type="text"
                                            value={customType}
                                            onChange={(e) => setCustomType(e.target.value)}
                                            placeholder="Especifique el tipo de incidente"
                                            required
                                            style={{ marginTop: '1rem' }}
                                        />
                                    )}
                                </div>

                                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <label>Descripción</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        placeholder="Describe qué está pasando..."
                                        style={{ height: '120px', resize: 'none' }}
                                    />
                                </div>

                                {/* Vehicle Information Section */}
                                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <FaCar size={18} />
                                            </div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Detalles del Vehículo (Opcional)</h3>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAIIdentify}
                                            disabled={isAnalyzing || !files.some(f => f.type.startsWith('image/'))}
                                            style={{
                                                background: 'var(--surface)',
                                                border: '1px solid var(--primary)',
                                                color: 'var(--primary)',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                cursor: (isAnalyzing || !files.some(f => f.type.startsWith('image/'))) ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                opacity: (isAnalyzing || !files.some(f => f.type.startsWith('image/'))) ? 0.6 : 1,
                                                width: 'auto',
                                                margin: 0,
                                                boxShadow: 'var(--shadow-sm)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            title={!files.some(f => f.type.startsWith('image/')) ? "Sube una foto para usar la IA" : "Identificar marca, modelo y color automáticamente"}
                                        >
                                            {isAnalyzing ? (
                                                <>Detectando...</>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} /> ¿No conoces el vehículo?
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {isAnalyzing ? (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '2.5rem 1rem',
                                            background: 'var(--bg-input)',
                                            borderRadius: '0.75rem',
                                            border: '2px dashed var(--primary)',
                                            color: 'var(--primary)',
                                            textAlign: 'center',
                                            opacity: 0.9,
                                            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <style>
                                                {`
                                                @keyframes aiFloat {
                                                    0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 2px var(--primary)); }
                                                    50% { transform: translateY(-8px); filter: drop-shadow(0 0 12px var(--primary)); }
                                                }
                                                @keyframes aiPulseText {
                                                    0%, 100% { opacity: 0.7; }
                                                    50% { opacity: 1; }
                                                }
                                                @keyframes aiScanLine {
                                                    0% { top: -10%; opacity: 0; }
                                                    10% { opacity: 1; }
                                                    90% { opacity: 1; }
                                                    100% { top: 110%; opacity: 0; }
                                                }
                                                `}
                                            </style>

                                            <div style={{ position: 'relative', marginBottom: '1.2rem', animation: 'aiFloat 2.5s ease-in-out infinite' }}>
                                                <FaCar size={48} style={{ color: 'var(--primary)' }} />
                                                <Sparkles size={18} style={{ position: 'absolute', top: -10, right: -15, color: '#FFD700', animation: 'aiPulseText 1s ease-in-out infinite' }} />
                                                <Sparkles size={14} style={{ position: 'absolute', bottom: -5, left: -10, color: 'inherit', animation: 'aiPulseText 1.5s ease-in-out infinite 0.5s' }} />

                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-20%',
                                                    width: '140%',
                                                    height: '2px',
                                                    background: 'var(--primary)',
                                                    boxShadow: '0 0 10px var(--primary)',
                                                    animation: 'aiScanLine 2s linear infinite'
                                                }}></div>
                                            </div>

                                            <span style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.4rem', animation: 'aiPulseText 2s infinite' }}>Escaneando base de datos...</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Extrayendo fabricante, año, modelo y color del vehículo</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Marca</label>
                                                <input
                                                    type="text"
                                                    value={carBrand}
                                                    onChange={(e) => setCarBrand(e.target.value)}
                                                    placeholder="Ej: Toyota"
                                                    style={{ padding: '0.6rem' }}
                                                />
                                            </div>
                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Modelo</label>
                                                <input
                                                    type="text"
                                                    value={carModel}
                                                    onChange={(e) => setCarModel(e.target.value)}
                                                    placeholder="Ej: Corolla"
                                                    style={{ padding: '0.6rem' }}
                                                />
                                            </div>
                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Año</label>
                                                <input
                                                    type="text"
                                                    value={carYear}
                                                    onChange={(e) => setCarYear(e.target.value)}
                                                    placeholder="Ej: 2022"
                                                    style={{ padding: '0.6rem' }}
                                                />
                                            </div>
                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Color</label>
                                                <input
                                                    type="text"
                                                    value={carColor}
                                                    onChange={(e) => setCarColor(e.target.value)}
                                                    placeholder="Ej: Blanco"
                                                    style={{ padding: '0.6rem' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-column">
                                <div className="input-group">
                                    <p className="text-sm text-muted" style={{ textAlign: 'left', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                                        Arrastra el marcador <CiLocationOn size={18} style={{ color: 'var(--primary)', flexShrink: 0, display: 'inline-block', verticalAlign: 'text-bottom' }} /> a la ubicación exacta del incidente o escriba la ubicación exacta.
                                    </p>
                                    <DraggableMap
                                        location={location}
                                        setLocation={setLocation}
                                        setAddress={setAddress}
                                        refreshLocation={refreshLocationTrigger}
                                    />

                                    {/* Address Display */}
                                    {address && (
                                        <div style={{
                                            background: 'var(--bg-input)',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <span><CiLocationOn size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} /></span>
                                            <strong>{address}</strong>
                                        </div>
                                    )}

                                    {location && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={`Lat: ${location.lat.toFixed(6)}`}
                                                disabled
                                                style={{ background: 'var(--surface)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '0.8rem', flex: 1 }}
                                            />
                                            <input
                                                type="text"
                                                value={`Lng: ${location.lng.toFixed(6)}`}
                                                disabled
                                                style={{ background: 'var(--surface)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '0.8rem', flex: 1 }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label>Fotos / Videos</label>
                                    <div className="file-upload-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', border: 'none', background: 'transparent', padding: 0 }}>
                                        {/* Photo Camera Option */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            id="camera-photo-upload"
                                        />
                                        <label
                                            htmlFor="camera-photo-upload"
                                            onClick={() => setRefreshLocationTrigger(prev => prev + 1)}
                                            style={{
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '1rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius)',
                                                background: 'var(--bg-input)',
                                                height: '100%'
                                            }}
                                        >
                                            <Camera size={24} color="var(--primary)" style={{ marginBottom: '0.25rem' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>Foto</span>
                                        </label>

                                        {/* Video Camera Option */}
                                        <input
                                            type="file"
                                            accept="video/*"
                                            capture="environment"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            id="camera-video-upload"
                                        />
                                        <label
                                            htmlFor="camera-video-upload"
                                            onClick={() => setRefreshLocationTrigger(prev => prev + 1)}
                                            style={{
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '1rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius)',
                                                background: 'var(--bg-input)',
                                                height: '100%'
                                            }}
                                        >
                                            <Video size={24} color="var(--primary)" style={{ marginBottom: '0.25rem' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>Video</span>
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
                                            padding: '1rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius)',
                                            background: 'var(--bg-input)',
                                            height: '100%'
                                        }}>
                                            <GrGallery size={24} color="var(--primary)" style={{ marginBottom: '0.25rem' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>Galería</span>
                                        </label>
                                    </div>

                                    {files.length > 0 && (
                                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                            {files.map((file, index) => (
                                                <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
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
                            </div>
                        </div>

                        {loading && <LinearProgressWithLabel value={uploadProgress} />}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                opacity: loading ? 0.7 : 1,
                                marginTop: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            {loading ? (
                                uploadProgress < 100 ? 'Subiendo...' : 'Procesando...'
                            ) : (
                                <>
                                    <IoIosSend size={24} /> Enviar Reporte
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateReport;
