import { useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import ThemeContext from '../context/ThemeContext';

// Set dayjs locale to Spanish
dayjs.locale('es');

function Register() {
    const { register, verifyEmail, checkRegistrationDuplicates } = useContext(AuthContext);
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    // Step state
    // 1: Form, 2: ID Capture, 3: Selfie Capture, 4: Verify Code
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Mobile specific state for ID scanning
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [showPassword, setShowPassword] = useState(false);
    const [flashlightOn, setFlashlightOn] = useState(false);
    const [trackSupportsTorch, setTrackSupportsTorch] = useState(false);
    const [isIdAligned, setIsIdAligned] = useState(false);
    const [isIdScannerActive, setIsIdScannerActive] = useState(false);
    const [isProcessingId, setIsProcessingId] = useState(false);

    // Selfie Liveness specific state
    const [livenessStatus, setLivenessStatus] = useState('Buscando rostro...');
    const [isSelfieAligned, setIsSelfieAligned] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', firstName: '', lastName: '',
        birthDate: '', gender: '', phone: '', cedula: '', birthProvince: ''
    });

    const [idImage, setIdImage] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [scanningProgress, setScanningProgress] = useState(0);
    const [ocrProgress, setOcrProgress] = useState(0);
    const { theme } = useContext(ThemeContext);

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: theme === 'dark' ? 'dark' : 'light',
            primary: {
                main: '#6366f1',
            },
            background: {
                default: theme === 'dark' ? '#171717' : '#ffffff',
                paper: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            },
            text: {
                primary: theme === 'dark' ? '#f5f5f5' : '#1e293b',
                secondary: theme === 'dark' ? '#a3a3a3' : '#64748b',
            }
        },
        typography: {
            fontFamily: '"Outfit", sans-serif',
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-xl)',
                    }
                }
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent !important',
                        boxShadow: 'none !important',
                        '&:hover': {
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important',
                        }
                    }
                }
            },
            MuiButtonBase: {
                defaultProps: {
                    disableRipple: false,
                },
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent !important',
                        boxShadow: 'none !important',
                        '&:hover': {
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08) !important' : 'rgba(0,0,0,0.04) !important',
                        }
                    }
                }
            },
            MuiPickersDay: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent !important',
                        '&.Mui-selected': {
                            backgroundColor: 'var(--primary) !important',
                            color: 'white !important',
                        },
                        '&:hover': {
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important',
                        }
                    }
                }
            },
            MuiPickersYear: {
                styleOverrides: {
                    yearButton: {
                        backgroundColor: 'transparent !important',
                        boxShadow: 'none !important',
                        color: 'inherit',
                        width: '72px !important',
                        height: '32px !important',
                        borderRadius: '16px !important',
                        margin: '0 auto !important',
                        display: 'flex !important',
                        alignItems: 'center !important',
                        justifyContent: 'center !important',
                        fontSize: '0.9rem',
                        lineHeight: '1 !important',
                        // Using padding to force the text up since transforms might be conflicting
                        padding: '0 0 6px 0 !important', 
                        '&.Mui-selected': {
                            backgroundColor: 'var(--primary) !important',
                            color: 'white !important',
                        },
                        '&:hover': {
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important',
                        }
                    }
                }
            },
            MuiPickersMonth: {
                styleOverrides: {
                    monthButton: {
                        backgroundColor: 'transparent !important',
                        boxShadow: 'none !important',
                        color: 'inherit',
                        '&.Mui-selected': {
                            backgroundColor: 'var(--primary) !important',
                            color: 'white !important',
                        },
                        '&:hover': {
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.05) !important',
                        }
                    }
                }
            }
        }
    }), [theme]);

    useEffect(() => {
        const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/models')
                ]);
                setModelsLoaded(true);
            } catch (e) {
                console.error("Error loading face-api models", e);
            }
        };
        loadModels();
    }, []);

    // Effect to check and toggle flashlight
    useEffect(() => {
        if (step === 2 && webcamRef.current?.video?.srcObject) {
            const track = webcamRef.current.video.srcObject.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
                setTrackSupportsTorch(true);
                track.applyConstraints({
                    advanced: [{ torch: flashlightOn }]
                }).catch(e => console.error("Error applying torch:", e));
            } else {
                setTrackSupportsTorch(false);
            }
        }
    }, [step, flashlightOn, webcamRef.current?.video?.srcObject]);

    // Real auto-alignment logic using face detection
    useEffect(() => {
        let intervalId;
        let steadyCount = 0; // Target: 5 seconds
        const requiredTicks = 5; // 5 ticks of 1 second

        if (step === 2 && modelsLoaded && isIdScannerActive && !isProcessingId) {
            intervalId = setInterval(async () => {
                if (webcamRef.current?.video?.readyState === 4) {
                    try {
                        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
                        const detection = await faceapi.detectSingleFace(webcamRef.current.video, options);

                        let isWellFramed = false;

                        if (detection && detection.score > 0.6) {
                            const videoW = webcamRef.current.video.videoWidth;
                            const videoH = webcamRef.current.video.videoHeight;

                            const { x, y, width, height } = detection.box;

                            const isInsidePaddingX = x > videoW * 0.05 && (x + width) < videoW * 0.95;
                            const isInsidePaddingY = y > videoH * 0.10 && (y + height) < videoH * 0.90;

                            const faceWidthRatio = width / videoW;
                            const isReasonableSize = faceWidthRatio > 0.08 && faceWidthRatio < 0.45;

                            if (isInsidePaddingX && isInsidePaddingY && isReasonableSize) {
                                isWellFramed = true;
                            }
                        }

                        if (isWellFramed) {
                            setIsIdAligned(true);
                            steadyCount += 1;
                            setScanningProgress(Math.min(100, Math.round((steadyCount / requiredTicks) * 100)));

                            if (steadyCount >= requiredTicks) {
                                setIsProcessingId(true);
                                clearInterval(intervalId);

                                if (webcamRef.current) {
                                    const imageSrc = webcamRef.current.getScreenshot();
                                    if (imageSrc) {
                                        setIdImage(imageSrc);
                                        setError('');
                                        setIsIdScannerActive(false);
                                        setIsProcessingId(false);
                                        setScanningProgress(0);
                                        setStep(3); // Move to Selfie capture
                                    } else {
                                        setIsProcessingId(false);
                                    }
                                } else {
                                    setIsProcessingId(false);
                                }
                            }
                        } else {
                            setIsIdAligned(false);
                            steadyCount = 0; // User moved, face lost, or not well framed, reset!
                            setScanningProgress(0);
                        }
                    } catch (e) {
                        console.error('Error detecting face for ID alignment', e);
                    }
                }
            }, 1000); // Check exactly every 1 second
        } else {
            if (!isProcessingId) {
                setIsIdAligned(false);
                setScanningProgress(0);
            }
        }
        return () => clearInterval(intervalId);
    }, [step, modelsLoaded, isIdScannerActive, isProcessingId]);

    // Real-time liveness detection for step 3 (Selfie)
    useEffect(() => {
        let intervalId;
        if (step === 3 && modelsLoaded && !isLoading) {
            setLivenessStatus('Buscando rostro en el óvalo...');
            setIsSelfieAligned(false);

            intervalId = setInterval(async () => {
                if (webcamRef.current?.video?.readyState === 4) {
                    try {
                        const imageSrc = webcamRef.current.getScreenshot();
                        if (!imageSrc) return;

                        const imgElement = document.createElement('img');
                        imgElement.src = imageSrc;
                        await new Promise(r => imgElement.onload = r);

                        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 });
                        const detection = await faceapi.detectSingleFace(imgElement, options).withFaceExpressions();

                        if (!detection) {
                            setLivenessStatus('No se detecta rostro. Ajusta la cámara.');
                            setIsSelfieAligned(false);
                        } else {
                            if (detection.expressions.happy > 0.6) {
                                setLivenessStatus('¡Perfecto! Procesando...');
                                setIsSelfieAligned(true);
                                clearInterval(intervalId); // Stop tracking, we got the smile
                                captureSelfieAndSubmit(); // Auto trigger capture
                            } else {
                                setLivenessStatus('Rostro detectado. Ahora, ¡sonríe grande!');
                                setIsSelfieAligned(true);
                            }
                        }
                    } catch (e) {
                        console.error('Liveness detection error', e);
                    }
                }
            }, 600); // Check every 600ms
        }
        return () => clearInterval(intervalId);
    }, [step, modelsLoaded, isLoading]); // Cannot depend on captureSelfieAndSubmit safely without an infinite loop, so omitted from deps

    const formatPhone = (val) => {
        const cleaned = ('' + val).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? '-' + match[3] : ''}`;
        }
        return val;
    };

    const formatCedula = (val) => {
        const cleaned = ('' + val).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,7})(\d{0,1})$/);
        if (match) {
            let res = match[1];
            if (match[2]) res += '-' + match[2];
            if (match[3]) res += '-' + match[3];
            return res;
        }
        return val;
    };

    const calculateStrength = (pass) => {
        const checks = {
            length: pass.length >= 6,
            upper: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
            symbol: /[^A-Za-z0-9]/.test(pass)
        };
        
        let score = 0;
        if (checks.length) score++;
        if (pass.length >= 10) score++;
        if (checks.upper) score++;
        if (checks.number) score++;
        if (checks.symbol) score++;
        
        return { score, checks };
    };

    const strengthData = calculateStrength(formData.password);
    const strength = strengthData.score;

    const getStrengthInfo = (score) => {
        if (!formData.password) return { text: '', color: '', width: '0%' };
        if (score <= 2) return { text: 'Débil', color: 'strength-weak', width: '33%' };
        if (score <= 4) return { text: 'Media', color: 'strength-medium', width: '66%' };
        return { text: 'Fuerte', color: 'strength-strong', width: '100%' };
    };

    const strengthInfo = getStrengthInfo(strength);

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'phone') value = formatPhone(value);
        if (name === 'cedula') value = formatCedula(value);

        if (name === 'firstName' || name === 'lastName') {
            value = value.replace(/\b\w/g, char => char.toUpperCase());
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDateChange = (date) => {
        setFormData({
            ...formData,
            birthDate: date ? date.format('YYYY-MM-DD') : ''
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const res = await checkRegistrationDuplicates(formData);
        
        if (strength <= 2) {
            setError('La contraseña es muy débil. Por favor intenta combinar letras, números y símbolos.');
            setIsLoading(false);
            return;
        }

        setIsLoading(false);

        if (res.success) {
            setStep(2); // Proceed to Document Capture
        } else {
            setError(res.msg); // Muestra el mensaje de error específico
        }
    };

    const captureId = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError("No se pudo capturar la imagen. Revisa los permisos de tu cámara.");
            return;
        }
        setIdImage(imageSrc);
        setError('');
        setStep(3); // Move to Selfie capture
    }, [webcamRef]);

    const captureSelfieAndSubmit = useCallback(async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError("No se pudo capturar la imagen. Revisa los permisos de tu cámara.");
            return;
        }

        setError('');
        setOcrProgress(0);
        setIsLoading(true);

        const progressInterval = setInterval(() => {
            setOcrProgress((prev) => {
                const next = prev + 1;
                return next >= 99 ? 99 : next;
            });
        }, 200); // 1% every 200ms = ~20s to 100%

        // Forced minimum execution of 20 seconds as requested by user
        const minDelayPromise = new Promise(res => setTimeout(res, 20000));

        try {
            if (!modelsLoaded) {
                clearInterval(progressInterval);
                setError('Aún cargando modelos de IA, por favor espera unos segundos.');
                setIsLoading(false);
                return;
            }

            // Check for face
            const imgElement = document.createElement('img');
            imgElement.src = imageSrc;
            await new Promise(r => imgElement.onload = r);

            const detections = await faceapi.detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions());

            if (detections.length === 0) {
                clearInterval(progressInterval);
                setError('No se detectó ningún rostro. Por favor, asegúrate de tener buena luz e inténtalo de nuevo.');
                setIsLoading(false);
                return;
            }
            if (detections.length > 1) {
                clearInterval(progressInterval);
                setError('Se detectó más de un rostro en la cámara. Por favor, asegúrate de ser el único en la foto.');
                setIsLoading(false);
                return;
            }

            // Proceed to verify the ID image vs the selfie
            let faceDistance = null;

            if (idImage) {
                const idImgElement = document.createElement('img');
                idImgElement.src = idImage;
                await new Promise(r => idImgElement.onload = r);

                const idDetection = await faceapi.detectSingleFace(idImgElement, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!idDetection) {
                    clearInterval(progressInterval);
                    setError('No se pudo encontrar un rostro en la foto de la cédula. Toma la foto de la cédula más de cerca o con mejor luz.');
                    setIsLoading(false);
                    return;
                }

                // Get descriptor for the selfie
                const selfieDetectionArray = await faceapi.detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!selfieDetectionArray) {
                    clearInterval(progressInterval);
                    setError('Error al procesar el rostro del selfie.');
                    setIsLoading(false);
                    return;
                }

                faceDistance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetectionArray.descriptor);
                console.log("Face Match Euclidean Distance:", faceDistance);

                if (faceDistance > 0.70) {
                    clearInterval(progressInterval);
                    setError('Error: El rostro de la selfie NO coincide en lo absoluto con la foto de la cédula. Por favor, asegúrate de ser tú el titular.');
                    setIsLoading(false);
                    return;
                }
            }

            // Proceed to final Registration Submit
            const similarityPercentage = faceDistance !== null ? Math.round(Math.max(0, 1 - faceDistance) * 100) : 0;
            const payload = { ...formData, idImage, selfieImage: imageSrc, faceMatchPercentage: similarityPercentage };

            // Wait for both the backend OCR registration process AND the compulsory 20 seconds minimum
            const [res] = await Promise.all([register(payload), minDelayPromise]);

            clearInterval(progressInterval);
            setOcrProgress(100);

            if (res.success) {
                setSuccess('¡Registro Paso 1 Exitoso! Revisa tu correo por el código de verificación.');
                setStep(4); // Move to verification step
            } else {
                setError(res.msg);
                // Si el backend da error de que el rostro no coincide o el OCR falla, 
                // mostramos el error para que vuelva a intentar.
            }
        } catch (err) {
            clearInterval(progressInterval);
            setError("Error procesando la imagen. Inténtalo de nuevo.");
        } finally {
            clearInterval(progressInterval);
            setIsLoading(false);
        }
    }, [webcamRef, formData, idImage, register, modelsLoaded]);

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const res = await verifyEmail(formData.email, verificationCode);
        setIsLoading(false);

        if (res.success) {
            setSuccess('¡Cuenta verificada exitosamente! Redirigiendo...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            setError(res.msg);
        }
    };

    return (
        <div className="landing-container auth-wrapper modern-login-wrapper" style={{ padding: '0' }}>
            <div className="card modern-login-card" style={{ maxWidth: '650px', padding: 'clamp(1.5rem, 3vh, 2.5rem) clamp(1rem, 2.5vw, 2rem)' }}>
                <div className="login-header">
                    <h2>
                        {step === 1 ? 'Crear Cuenta' :
                            step === 2 ? 'Veridad de Cédula' :
                                step === 3 ? 'Verificación Facial' : 'Verificar Cuenta'}
                    </h2>
                    <p className="text-muted">
                        {step === 1 ? 'Únete a nuestra plataforma' :
                            step === 2 ? 'Toma una foto clara a tu cédula para el proceso KYC' :
                                step === 3 ? 'Toma una selfie para comprobar tu identidad' : 'Ingresa el código enviado a tu correo'}
                    </p>
                </div>

                {error && <div className="login-error-alert">{error}</div>}
                {success && <div style={{ background: '#dcfce7', borderLeft: '4px solid #10b981', color: '#15803d', padding: 'clamp(0.75rem, 2vh, 1rem)', borderRadius: '0.5rem', marginBottom: 'clamp(1rem, 2vh, 1.5rem)', fontSize: '0.85rem', fontWeight: 500, textAlign: 'center' }}>{success}</div>}

                {step === 1 && (
                    <form onSubmit={handleFormSubmit}>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Datos Personales</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(0.75rem, 2vh, 1.25rem)', marginBottom: '1.5rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Nombre</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Ej: Juan" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Apellido</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Ej: Pérez" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Fecha de Nacimiento</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                    <MUIThemeProvider theme={muiTheme}>
                                        <DatePicker
                                            value={formData.birthDate ? dayjs(formData.birthDate) : null}
                                            onChange={handleDateChange}
                                            maxDate={dayjs()}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true,
                                                    placeholder: "DD/MM/YYYY",
                                                    sx: {
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '1rem',
                                                            border: '2px solid var(--border-color)',
                                                            background: 'var(--bg-input)',
                                                            color: 'var(--text-main)',
                                                            fontFamily: 'inherit',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '& fieldset': { border: 'none' },
                                                            '&:hover': {
                                                                borderColor: 'var(--primary)',
                                                                transform: 'translateY(-1px)',
                                                            },
                                                            '&.Mui-focused': {
                                                                borderColor: 'var(--primary)',
                                                                background: 'var(--bg-input-focus)',
                                                                boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15)',
                                                            },
                                                            '& .MuiInputBase-input::placeholder': {
                                                                color: 'var(--text-muted)',
                                                                opacity: 1,
                                                            },
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem',
                                                            fontSize: '0.9rem',
                                                            color: 'var(--text-main)',
                                                        },
                                                        // CRITICAL: Reset global button styles for the adornment icon
                                                        '& .MuiInputAdornment-root button': {
                                                            width: 'auto !important',
                                                            minWidth: 'unset !important',
                                                            padding: '8px !important',
                                                            margin: '0 !important',
                                                            background: 'transparent !important',
                                                            boxShadow: 'none !important',
                                                            borderRadius: '50% !important',
                                                            transform: 'none !important',
                                                            color: 'var(--primary) !important',
                                                            '&:hover': {
                                                                background: theme === 'dark' ? 'rgba(255,255,255,0.05) !important' : 'rgba(0,0,0,0.05) !important',
                                                            }
                                                        }
                                                    }
                                                },
                                                popper: {
                                                    modifiers: [
                                                        {
                                                            name: 'offset',
                                                            options: {
                                                                offset: [0, -8],
                                                            },
                                                        },
                                                    ],
                                                    sx: {
                                                        // POPPER STYLING
                                                        '& .MuiPaper-root': {
                                                            marginTop: '0 !important',
                                                            backgroundImage: 'none',
                                                            backdropFilter: 'blur(25px)',
                                                            backgroundColor: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                                            boxShadow: 'var(--shadow-xl)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '16px',
                                                            minWidth: '320px !important',
                                                            maxHeight: '400px !important', // Limit height to avoid empty space
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'center', // Center content block vertically
                                                            alignItems: 'center',
                                                        },
                                                        '& .MuiYearCalendar-root': {
                                                            width: '100% !important',
                                                            display: 'flex !important',
                                                            flexWrap: 'wrap !important',
                                                            justifyContent: 'center !important',
                                                            alignContent: 'center !important',
                                                            padding: '8px !important',
                                                        },
                                                        '& .MuiPickersYear-root': {
                                                            flexBasis: '25% !important',
                                                            maxWidth: '25% !important',
                                                            display: 'flex !important',
                                                            justifyContent: 'center !important',
                                                            padding: '4px 0 !important',
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </MUIThemeProvider>
                                </LocalizationProvider>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Sexo</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required style={{ width: '100%', padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', appearance: 'none', fontSize: '0.9rem' }}>
                                    <option value="">Selecciona...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Teléfono</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Ej: 809-555-5555" maxLength="12" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Cédula</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required placeholder="Ej: 000-0000000-0" maxLength="13" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Provincia de Nacimiento</label>
                                <select name="birthProvince" value={formData.birthProvince} onChange={handleChange} required style={{ width: '100%', padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', borderRadius: '1rem', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', appearance: 'none', fontSize: '0.9rem' }}>
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
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Datos de la Cuenta</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(0.75rem, 2vh, 1.25rem)' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Nombre de Usuario</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Tu alias en el sistema" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Correo Electrónico</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="tucorreo@ejemplo.com" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem' }} />
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem' }}>Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        required 
                                        minLength="6" 
                                        placeholder="Mínimo 6 caracteres" 
                                        style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem) 1.25rem', fontSize: '0.9rem', paddingRight: '3rem' }} 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '4px',
                                            margin: 0,
                                            width: 'auto',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            boxShadow: 'none'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                
                                {formData.password && (
                                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 'bold' }}>La contraseña debe tener lo siguiente:</p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <li style={{ color: strengthData.checks.length ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {strengthData.checks.length ? '✅' : '○'} Mín. 6 caracteres
                                            </li>
                                            <li style={{ color: strengthData.checks.upper ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {strengthData.checks.upper ? '✅' : '○'} Una mayúscula
                                            </li>
                                            <li style={{ color: strengthData.checks.number ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {strengthData.checks.number ? '✅' : '○'} Un número
                                            </li>
                                            <li style={{ color: strengthData.checks.symbol ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {strengthData.checks.symbol ? '✅' : '○'} Un símbolo
                                            </li>
                                        </ul>

                                        <div className="strength-bar-container" style={{ marginBottom: '0.5rem' }}>
                                            <div 
                                                className={`strength-bar ${strengthInfo.color}`} 
                                                style={{ width: strengthInfo.width }}
                                            ></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Nivel de Seguridad:</span>
                                            <span style={{ 
                                                fontSize: '0.9rem', 
                                                fontWeight: '800', 
                                                padding: '0.2rem 0.6rem', 
                                                borderRadius: '0.5rem',
                                                background: strengthInfo.color === 'strength-weak' ? 'rgba(239, 68, 68, 0.1)' : strengthInfo.color === 'strength-medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: strengthInfo.color === 'strength-weak' ? 'var(--error)' : strengthInfo.color === 'strength-medium' ? 'var(--warning)' : 'var(--success)'
                                            }}>
                                                {strengthInfo.text}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="login-submit-btn" style={{ marginTop: 'clamp(1.5rem, 3vh, 2rem)' }}>
                            Siguiente (KYC)
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="webcam-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {!isIdScannerActive ? (
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪪</div>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Escaneo Automático</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                    El sistema detectará y capturará la foto de tu cédula automáticamente para validar tu nombre, cédula y rostro en el siguiente paso.
                                </p>
                                <button onClick={() => setIsIdScannerActive(true)} type="button" className="login-submit-btn" style={{ marginBottom: '10px' }}>
                                    <i className="fas fa-camera" style={{ marginRight: '8px' }}></i> Iniciar Escáner
                                </button>
                                <button onClick={() => { setStep(1); setFlashlightOn(false); setError(''); setSuccess(''); setIdImage(null); }} type="button" style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                    Atrás
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1.58', borderRadius: '12px', overflow: 'hidden', border: `4px solid ${isIdAligned ? '#22c55e' : '#ffff00'}`, transition: 'border-color 0.3s' }}>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={1}
                                        videoConstraints={{ facingMode: "environment", width: { ideal: 4096 }, height: { ideal: 2160 }, advanced: [{ focusMode: "continuous" }] }}
                                        mirrored={false}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 }}
                                    />

                                    {/* Overlay guide for ID */}
                                    <div style={{ position: 'absolute', top: '15%', left: '10%', right: '10%', bottom: '15%', border: `2px solid ${isProcessingId || isIdAligned ? '#22c55e' : 'rgba(255,255,255,0.7)'}`, borderRadius: '8px', zIndex: 1, pointerEvents: 'none', transition: 'border-color 0.3s' }}>
                                        <div style={{ position: 'absolute', top: '-28px', left: 0, width: '100%', textAlign: 'center', color: isProcessingId || isIdAligned ? '#22c55e' : '#ffff00', fontWeight: 'bold', fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                            {isProcessingId ? '¡Listo! Procesando...' : isIdAligned ? '¡No te muevas! ' + scanningProgress + '%' : 'Enfocando Cédula...'}
                                        </div>
                                        {isIdAligned && !isProcessingId && (
                                            <div style={{ position: 'absolute', bottom: '-20px', left: '10%', right: '10%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${scanningProgress}%`, height: '100%', background: '#22c55e', transition: 'width 1s linear' }}></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls Overlay */}
                                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {trackSupportsTorch && (
                                            <button
                                                onClick={() => setFlashlightOn(!flashlightOn)}
                                                type="button"
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: flashlightOn ? 'var(--primary)' : 'rgba(0,0,0,0.5)', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', padding: 0 }}
                                            >
                                                <i className="fas fa-bolt"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>Identificación: Coloca tu cédula horizontalmente dentro del cuadro.</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', width: '100%', maxWidth: '400px' }}>
                                    <button onClick={() => { setIsIdScannerActive(false); setFlashlightOn(false); }} type="button" style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.75rem' }}>Cancelar Escáner</button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="webcam-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', border: `5px solid ${isSelfieAligned ? '#22c55e' : (modelsLoaded ? 'var(--primary)' : 'orange')}`, transition: 'border-color 0.3s' }}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={1}
                                videoConstraints={{ facingMode: "user", width: 1920, height: 1080 }}
                                mirrored={true}
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                            {/* Face outline overlay */}
                            <div style={{ position: 'absolute', top: '15%', left: '25%', right: '25%', bottom: '25%', border: `3px dashed ${isSelfieAligned ? '#22c55e' : 'rgba(255,255,255,0.7)'}`, borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

                            {/* Processing Overlay */}
                            {isLoading && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}>
                                    <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}>Validación Biométrica y OCR...</h3>
                                    <div style={{ width: '80%', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                                        <div style={{ width: `${ocrProgress}%`, height: '8px', background: '#22c55e', transition: 'width 0.2s linear' }}></div>
                                    </div>
                                    <p style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '15px' }}>{ocrProgress}% Completado</p>
                                    <p style={{ color: '#ccc', textAlign: 'center', fontSize: '0.9rem', padding: '0 20px', lineHeight: '1.5' }}>
                                        Por favor, mantén esta ventana abierta. Estamos analizando tu cédula con OCR Avanzado de alta precisión.<br /><br />
                                        <strong style={{ color: '#fbbf24' }}>Este proceso toma 20 segundos de manera garantizada para no emitir errores.</strong>
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Liveness Instruction */}
                            {!isLoading && (
                                <div style={{ position: 'absolute', bottom: '10%', left: '10%', right: '10%', textAlign: 'center', color: isSelfieAligned ? '#22c55e' : '#ffff00', fontWeight: 'bold', fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '8px', zIndex: 2 }}>
                                    {livenessStatus}
                                </div>
                            )}
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>Prueba de Vida en Vivo: Sigue las instrucciones en el video para validar tu identidad contra la cédula automáticamente.</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', width: '100%', maxWidth: '400px' }}>
                            <button onClick={() => { setStep(2); setError(''); setSuccess(''); }} type="button" disabled={isLoading} style={{ flex: 1, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', opacity: isLoading ? 0.7 : 1, padding: '0.75rem', borderRadius: '0.75rem' }}>Atrás</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <form onSubmit={handleVerifySubmit}>
                        <div className="input-group">
                            <label>Código de Confirmación (6 dígitos)</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                maxLength="6"
                                placeholder="Ej: 123456"
                                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', padding: '1rem' }}
                            />
                        </div>
                        <button type="submit" className="login-submit-btn" disabled={isLoading || verificationCode.length !== 6} style={{ width: '100%', opacity: (isLoading || verificationCode.length !== 6) ? 0.5 : 1 }}>
                            {isLoading ? 'Verificando...' : 'Confirmar y Entrar'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <button type="button" onClick={() => { setStep(1); setError(''); setSuccess(''); setIdImage(null); setVerificationCode(''); }} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Volver al registro
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div className="login-divider" style={{ marginTop: '1.5rem' }}>
                        <div className="divider-line"></div>
                        <span>¿Ya tienes una cuenta?</span>
                    </div>
                )}
                {step === 1 && (
                    <div className="login-footer" style={{ marginTop: '1rem' }}>
                        <Link to="/login" className="register-link">
                            Iniciar Sesión
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Register;
