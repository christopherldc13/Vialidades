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
import Navbar from '../components/Navbar';
import TermsModal from '../components/TermsModal';
import { TbCameraSelfie } from 'react-icons/tb';
import { IoMailUnreadOutline } from 'react-icons/io5';
import { HiOutlineIdentification } from 'react-icons/hi2';

// Set dayjs locale to Spanish
dayjs.locale('es');

function Register() {
    const { register, verifyEmail, checkRegistrationDuplicates } = useContext(AuthContext);
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    // Step state
    // 1: Form, 2: ID Capture, 3: Selfie Capture, 4: Verify Code
    const [step, setStep] = useState(1);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Mobile specific state for ID scanning
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
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
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
        const loadModels = async () => {
            try {
                // Ensure TFJS is ready and try to set a stable backend if WebGL fails
                await faceapi.tf.ready();

                // If WebGL is not available, try wasm, then cpu
                if (faceapi.tf.getBackend() !== 'webgl') {
                    try {
                        await faceapi.tf.setBackend('wasm');
                    } catch (e) {
                        console.warn("WASM backend failed, falling back to CPU", e);
                        await faceapi.tf.setBackend('cpu');
                    }
                }

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/models')
                ]);
                setModelsLoaded(true);
            } catch (e) {
                console.error("Error loading face-api models", e);
                // Last resort fallback to CPU if models fail after backend init
                try {
                    await faceapi.tf.setBackend('cpu');
                } catch (inner) { }
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
        const requiredTicks = 3; // 3 ticks of 1 second = 3 second hold

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

        if (!termsAccepted) {
            setError('Debes aceptar los Términos y Condiciones para continuar.');
            return;
        }

        const requiredFields = ['firstName', 'lastName', 'username', 'email', 'password', 'birthDate', 'gender', 'phone', 'cedula', 'birthProvince'];
        const missing = requiredFields.filter(f => !formData[f] || formData[f].toString().trim() === '');
        if (missing.length > 0) {
            setError('Por favor completa todos los campos requeridos antes de continuar.');
            return;
        }

        if (strength <= 2) {
            setError('La contraseña es muy débil. Por favor intenta combinar letras, números y símbolos.');
            return;
        }

        setIsLoading(true);

        const res = await checkRegistrationDuplicates(formData);

        setIsLoading(false);

        if (res.success) {
            setStep(2); // Proceed to Document Capture
        } else {
            setError(res.msg); // Muestra el mensaje de error específico
        }
    };

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

    const [isDesktop] = useState(() => screen.width > 1024 && navigator.maxTouchPoints === 0);

    if (isDesktop) {
        return (
            <>
                <Navbar />
                <style>{`
                    .landing-nav {
                        background: var(--bg-page) !important;
                        backdrop-filter: none !important;
                        box-shadow: none !important;
                    }
                    .nav-gradient-overlay { opacity: 0 !important; }
                    @keyframes floatPhone {
                        0%, 100% { transform: translateY(0px) rotate(-3deg); }
                        50%       { transform: translateY(-16px) rotate(-3deg); }
                    }
                    @keyframes pulseGlow {
                        0%, 100% { opacity: 0.35; transform: scale(1); }
                        50%       { opacity: 0.65; transform: scale(1.06); }
                    }
                    @keyframes ringPulse {
                        0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.18; }
                        50%       { transform: translate(-50%,-50%) scale(1.12); opacity: 0.08; }
                    }
                    @keyframes kycScanLineD {
                        0%   { top: 8%;  opacity: 0; }
                        8%   { opacity: 1; }
                        92%  { opacity: 1; }
                        100% { top: 88%; opacity: 0; }
                    }
                    .dbp {
                        margin-top: 64px;
                        height: calc(100dvh - 64px);
                        display: flex;
                        background: var(--bg-page);
                        overflow: hidden;
                        position: relative;
                    }
                    .dbp-left {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: clamp(1.5rem, 4vw, 4rem);
                        gap: clamp(1rem, 2.5vh, 2.5rem);
                        min-width: 0;
                        overflow: hidden;
                        position: relative;
                    }
                    .dbp-right {
                        flex: 1.1;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                        padding: clamp(1.5rem, 4vw, 5rem);
                        min-width: 0;
                        overflow: hidden;
                    }
                    .dbp-right-inner {
                        width: 100%;
                        max-width: clamp(380px, 36vw, 600px);
                    }
                    .dbp-phone {
                        width: clamp(140px, 14vw, 240px);
                        height: clamp(250px, 40vh, 440px);
                        border-radius: clamp(24px, 2.8vw, 40px);
                        background: linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
                        border: clamp(3px, 0.3vw, 5px) solid rgba(99,102,241,0.55);
                        box-shadow: 0 clamp(16px,2vw,32px) clamp(40px,4vw,72px) rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: clamp(0.5rem, 1.2vh, 1rem);
                        position: relative;
                        overflow: hidden;
                        flex-shrink: 0;
                    }
                    .dbp-phone-icon {
                        font-size: clamp(1.8rem, 5vh, 3.2rem);
                        color: #a5b4fc;
                        display: flex;
                    }
                    .dbp-phone-bar1 { width: 58%; height: clamp(3px,0.5vh,5px); border-radius: 3px; background: rgba(99,102,241,0.65); }
                    .dbp-phone-bar2 { width: 42%; height: clamp(2px,0.35vh,4px); border-radius: 2px; background: rgba(255,255,255,0.18); }
                    .dbp-label {
                        font-size: clamp(0.6rem, 0.9vw, 0.78rem);
                        font-weight: 800;
                        letter-spacing: 0.18em;
                        text-transform: uppercase;
                        color: var(--primary);
                        margin-bottom: 0.25rem;
                    }
                    .dbp-sublabel {
                        font-size: clamp(0.78rem, 1.1vw, 0.98rem);
                        color: var(--text-muted);
                        font-weight: 500;
                    }
                    .dbp-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        background: rgba(239,68,68,0.1);
                        border: 1px solid rgba(239,68,68,0.28);
                        border-radius: 999px;
                        padding: clamp(0.25rem,0.5vh,0.35rem) clamp(0.7rem,1.2vw,1rem);
                        margin-bottom: clamp(0.75rem,1.8vh,1.4rem);
                    }
                    .dbp-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
                    .dbp-badge-text { font-size: clamp(0.6rem,0.75vw,0.75rem); font-weight: 800; color: #ef4444; letter-spacing: 0.06em; text-transform: uppercase; }
                    .dbp-h1 {
                        font-size: clamp(1.5rem, 2.8vw, 3rem);
                        font-weight: 900;
                        color: var(--text-main);
                        margin: 0 0 clamp(0.5rem,1.2vh,1rem) 0;
                        line-height: 1.15;
                        letter-spacing: -0.03em;
                    }
                    .dbp-p {
                        font-size: clamp(0.82rem, 1.05vw, 1.05rem);
                        color: var(--text-muted);
                        line-height: 1.65;
                        margin: 0 0 clamp(1rem,2.5vh,2rem) 0;
                    }
                    .dbp-steps { display: flex; flex-direction: column; gap: clamp(0.5rem,1.2vh,0.85rem); margin-bottom: clamp(1rem,2.5vh,2rem); }
                    .dbp-step {
                        display: flex;
                        align-items: center;
                        gap: clamp(0.6rem,1vw,1rem);
                        padding: clamp(0.6rem,1.4vh,1rem) clamp(0.75rem,1.2vw,1.2rem);
                        background: var(--surface-solid);
                        border: 1px solid var(--border-color);
                        border-radius: clamp(10px,1vw,16px);
                        transition: border-color 0.2s;
                    }
                    .dbp-step:hover { border-color: rgba(99,102,241,0.4); }
                    .dbp-step-icon {
                        width: clamp(34px,3.5vw,50px);
                        height: clamp(34px,3.5vw,50px);
                        border-radius: clamp(8px,0.8vw,12px);
                        background: rgba(99,102,241,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: clamp(1rem,1.8vw,1.5rem);
                        color: var(--primary);
                        flex-shrink: 0;
                    }
                    .dbp-step-title { font-weight: 700; font-size: clamp(0.8rem,1vw,0.98rem); color: var(--text-main); }
                    .dbp-step-desc { font-size: clamp(0.7rem,0.85vw,0.82rem); color: var(--text-muted); margin-top: 2px; }
                    .dbp-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        width: 100%;
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
                        color: #fff;
                        padding: clamp(0.75rem,1.8vh,1.1rem) 2rem;
                        border-radius: clamp(10px,1vw,16px);
                        font-weight: 700;
                        font-size: clamp(0.85rem,1.1vw,1.05rem);
                        text-decoration: none;
                        box-shadow: 0 clamp(6px,1vh,10px) clamp(20px,2vw,32px) rgba(139,92,246,0.4);
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .dbp-btn:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 clamp(10px,1.5vh,16px) clamp(28px,3vw,44px) rgba(139,92,246,0.55);
                    }
                    .dbp-divider {
                        width: 1px;
                        height: 55%;
                        background: var(--border-color);
                        flex-shrink: 0;
                        align-self: center;
                    }
                `}</style>
                <div className="dbp">
                    <div style={{ position: 'fixed', top: '-10vh', left: '-8vw', width: 'clamp(260px,28vw,500px)', height: 'clamp(260px,28vw,500px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)', animation: 'pulseGlow 7s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
                    <div style={{ position: 'fixed', bottom: '-8vh', right: '-6vw', width: 'clamp(220px,24vw,420px)', height: 'clamp(220px,24vw,420px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.11) 0%, transparent 70%)', animation: 'pulseGlow 9s ease-in-out infinite 2s', pointerEvents: 'none', zIndex: 0 }} />

                    <div className="dbp-left" style={{ zIndex: 1 }}>
                        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 'clamp(280px,28vw,460px)', height: 'clamp(280px,28vw,460px)', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.1)', transform: 'translate(-50%,-50%)', animation: 'ringPulse 6s ease-in-out infinite', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 'clamp(380px,38vw,620px)', height: 'clamp(380px,38vw,620px)', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.06)', transform: 'translate(-50%,-50%)', animation: 'ringPulse 9s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />
                        <div style={{ animation: 'floatPhone 4s ease-in-out infinite', position: 'relative' }}>
                            <div className="dbp-phone">
                                <div style={{ width: '28%', height: 'clamp(3px,0.4vh,4px)', borderRadius: '2px', background: 'rgba(255,255,255,0.22)', position: 'absolute', top: 'clamp(10px,1.5vh,16px)' }} />
                                <div className="dbp-phone-icon"><HiOutlineIdentification /></div>
                                <div className="dbp-phone-bar1" />
                                <div className="dbp-phone-bar2" />
                                <div style={{ position: 'absolute', left: '12px', right: '12px', height: '2px', background: 'linear-gradient(90deg, transparent, #22c55e, transparent)', top: '45%', boxShadow: '0 0 10px #22c55e', animation: 'kycScanLineD 2.2s linear infinite' }} />
                            </div>
                            <div style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', width: 'clamp(60px,6vw,100px)', height: 'clamp(12px,1.5vh,20px)', background: 'rgba(99,102,241,0.22)', filter: 'blur(12px)', borderRadius: '50%' }} />
                        </div>
                        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div className="dbp-label">Vialidades · KYC</div>
                            <div className="dbp-sublabel">Verificación de identidad segura</div>
                        </div>
                    </div>

                    <div className="dbp-divider" style={{ zIndex: 1 }} />

                    <div className="dbp-right" style={{ zIndex: 1 }}>
                        <div className="dbp-right-inner">
                            <div className="dbp-badge">
                                <span className="dbp-badge-dot" />
                                <span className="dbp-badge-text">No disponible en escritorio</span>
                            </div>
                            <h1 className="dbp-h1">
                                El registro requiere<br />tu <span style={{ color: 'var(--primary)' }}>teléfono</span>
                            </h1>
                            <p className="dbp-p">
                                Para garantizar la seguridad de tu cuenta, el proceso incluye verificación de cédula y reconocimiento facial — funciones que requieren la cámara de un dispositivo móvil.
                            </p>
                            <div className="dbp-steps">
                                {[
                                    { icon: <HiOutlineIdentification />, label: 'Escaneo de cédula', desc: 'Captura ambos lados de tu documento' },
                                    { icon: <TbCameraSelfie />, label: 'Selfie de verificación', desc: 'Confirma que eres tú' },
                                    { icon: <IoMailUnreadOutline />, label: 'Código de confirmación', desc: 'Verifica tu correo electrónico' },
                                ].map(({ icon, label, desc }) => (
                                    <div key={label} className="dbp-step">
                                        <div className="dbp-step-icon">{icon}</div>
                                        <div>
                                            <div className="dbp-step-title">{label}</div>
                                            <div className="dbp-step-desc">{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/login" className="dbp-btn">
                                Ir a Iniciar Sesión →
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
        <style>{`
            @keyframes kycScanLine {
                0%   { top: 3%;  opacity: 0; }
                8%   { opacity: 1; }
                92%  { opacity: 1; }
                100% { top: 94%; opacity: 0; }
            }
            @keyframes kycPulseGlow {
                0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 10px rgba(34,197,94,0.3); }
                50%       { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 28px rgba(34,197,94,0.75); }
            }
            @keyframes kycIdleGlow {
                0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 8px rgba(99,102,241,0.25); }
                50%       { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 18px rgba(99,102,241,0.55); }
            }
            @keyframes kycSpinner {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }
        `}</style>
        <div style={{
            padding: '96px 1rem 3rem 1rem',
            background: 'var(--bg-page)',
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Navbar />
            <div className="premium-login-card" style={{ maxWidth: '560px', width: '100%', margin: '0 auto', padding: 'clamp(1.25rem, 3vh, 2rem) clamp(1rem, 2.5vw, 1.75rem)' }}>
                <div className="login-header" style={step === 2 || step === 3 ? { marginBottom: '0.5rem', marginTop: 0 } : {}}>
                    <h2 style={step === 2 || step === 3 ? { fontSize: '1.15rem', marginBottom: '0.15rem' } : {}}>
                        {step === 1 ? 'Crear Cuenta' :
                            step === 2 ? 'Verificación de Cédula' :
                                step === 3 ? 'Verificación Facial' : 'Verificar Cuenta'}
                    </h2>
                    <p className="text-muted" style={step === 2 || step === 3 ? { fontSize: '0.8rem' } : {}}>
                        {step === 1 ? 'Únete a nuestra plataforma' :
                            step === 2 ? 'Identifica tu cédula frente a la cámara' :
                                step === 3 ? 'Sigue las instrucciones para validar tu identidad' : 'Ingresa el código enviado a tu correo'}
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
                        {/* Terms acceptance */}
                        <div style={{
                            marginTop: 'clamp(1.25rem, 2.5vh, 1.75rem)',
                            padding: '1rem 1.25rem',
                            borderRadius: '1rem',
                            background: termsAccepted
                                ? 'rgba(99,102,241,0.08)'
                                : 'var(--bg-input)',
                            border: `1.5px solid ${termsAccepted ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
                            transition: 'all 0.25s ease',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <div
                                    onClick={() => setTermsAccepted(v => !v)}
                                    style={{
                                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '2px',
                                        border: `2px solid ${termsAccepted ? '#6366f1' : 'var(--border-color)'}`,
                                        background: termsAccepted ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s ease', cursor: 'pointer',
                                        boxShadow: termsAccepted ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                                    }}
                                >
                                    {termsAccepted && (
                                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <span
                                    onClick={() => setTermsAccepted(v => !v)}
                                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    He leído y acepto los{' '}
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setShowTermsModal(true); }}
                                        style={{
                                            background: 'none', border: 'none', padding: 0,
                                            color: 'var(--primary)', fontWeight: 700, cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: 'inherit',
                                            textDecoration: 'underline', textUnderlineOffset: '3px',
                                            width: 'auto', display: 'inline', margin: 0,
                                            boxShadow: 'none',
                                        }}
                                    >
                                        Términos y Condiciones
                                    </button>
                                    {' '}de uso de Vialidades, incluyendo el tratamiento de mis datos personales y biométricos, y asumo la responsabilidad del contenido que publique en la plataforma.
                                </span>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading || !termsAccepted} className="login-submit-btn" style={{
                            marginTop: 'clamp(1rem, 2vh, 1.5rem)',
                            opacity: termsAccepted ? 1 : 0.5,
                            cursor: termsAccepted ? 'pointer' : 'not-allowed',
                            transition: 'opacity 0.2s ease',
                        }}>
                            Siguiente (KYC)
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="webcam-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {!isIdScannerActive ? (
                            /* ── Step 2 Intro (flat, mobile-first) ── */
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Progress dots */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                    {[1,2,3].map(n => (
                                        <div key={n} style={{ width: n === 2 ? '24px' : '8px', height: '8px', borderRadius: '999px', background: n === 2 ? '#6366f1' : 'var(--border-color)', transition: 'all 0.3s' }} />
                                    ))}
                                </div>

                                {/* Icon + title row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '56px', height: '56px', flexShrink: 0, borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))', border: '1.5px solid rgba(99,102,241,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                                        <HiOutlineIdentification color="#6366f1" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '2px' }}>Paso 2 · KYC</p>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>Escaneo de Cédula</h3>
                                    </div>
                                </div>

                                {/* Tips grid — 2 columns on mobile */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[
                                        { icon: '💡', text: 'Buena iluminación' },
                                        { icon: '📐', text: 'Posición horizontal' },
                                        { icon: '🔍', text: 'Texto visible' },
                                        { icon: '✋', text: 'Mantén firme' },
                                    ].map(({ icon, text }) => (
                                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{icon}</span>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{text}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Buttons */}
                                <button onClick={() => setIsIdScannerActive(true)} type="button" className="login-submit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: 0 }}>
                                    <i className="fas fa-camera"></i> Iniciar Escáner
                                </button>
                                <button onClick={() => { setStep(1); setFlashlightOn(false); setError(''); setSuccess(''); setIdImage(null); }} type="button" style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                                    ← Atrás
                                </button>
                            </div>
                        ) : (
                            /* ── Step 2 Active scanner ── */
                            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                {/* Scanner viewport */}
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1.586', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={1}
                                        videoConstraints={{ facingMode: "environment", width: { ideal: 4096 }, height: { ideal: 2160 }, advanced: [{ focusMode: "continuous" }] }}
                                        mirrored={false}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 }}
                                    />

                                    {/* Dark vignette + ID guide window */}
                                    <div style={{
                                        position: 'absolute', top: '12%', left: '8%', right: '8%', bottom: '12%',
                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
                                        borderRadius: '8px', zIndex: 1, pointerEvents: 'none',
                                    }}>
                                        {/* Corner brackets */}
                                        {[
                                            { top: 0, left: 0, borderTop: '3px solid', borderLeft: '3px solid', borderTopLeftRadius: '6px' },
                                            { top: 0, right: 0, borderTop: '3px solid', borderRight: '3px solid', borderTopRightRadius: '6px' },
                                            { bottom: 0, left: 0, borderBottom: '3px solid', borderLeft: '3px solid', borderBottomLeftRadius: '6px' },
                                            { bottom: 0, right: 0, borderBottom: '3px solid', borderRight: '3px solid', borderBottomRightRadius: '6px' },
                                        ].map((style, i) => (
                                            <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', borderColor: isIdAligned ? '#22c55e' : '#6366f1', transition: 'border-color 0.3s', ...style }} />
                                        ))}

                                        {/* Animated scan line — always mounted so animation never restarts */}
                                        <div style={{
                                            position: 'absolute', left: 0, right: 0, height: '2px',
                                            background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                                            animation: 'kycScanLine 1.5s linear infinite',
                                            zIndex: 2,
                                            opacity: (isIdAligned && !isProcessingId) ? 1 : 0,
                                            transition: 'opacity 0.3s',
                                            willChange: 'top',
                                        }} />
                                    </div>

                                    {/* Torch button */}
                                    {trackSupportsTorch && (
                                        <button
                                            onClick={() => setFlashlightOn(!flashlightOn)}
                                            type="button"
                                            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 3, width: '38px', height: '38px', borderRadius: '50%', background: flashlightOn ? '#facc15' : 'rgba(0,0,0,0.55)', color: flashlightOn ? '#1a1a00' : 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                        >
                                            <i className="fas fa-lightbulb"></i>
                                        </button>
                                    )}

                                    {/* Status pill */}
                                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, whiteSpace: 'nowrap', padding: '0.35rem 1rem', borderRadius: '999px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', fontSize: '0.8rem', fontWeight: 600, color: isProcessingId ? '#fbbf24' : isIdAligned ? '#22c55e' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span>{isProcessingId ? '⏳' : isIdAligned ? '✅' : '📋'}</span>
                                        {isProcessingId ? 'Procesando…' : isIdAligned ? `Capturando ${scanningProgress}%` : 'Coloca tu cédula'}
                                    </div>
                                </div>

                                {/* Progress bar (visible while scanning) */}
                                {isIdAligned && !isProcessingId && (
                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${scanningProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #22c55e)', borderRadius: '999px', transition: 'width 1s linear' }} />
                                    </div>
                                )}

                                <button onClick={() => { setIsIdScannerActive(false); setFlashlightOn(false); }} type="button" style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                    Cancelar Escáner
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="webcam-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
                        {/* Progress dots */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[1,2,3].map(n => (
                                <div key={n} style={{ width: n === 3 ? '24px' : '8px', height: '8px', borderRadius: '999px', background: n === 3 ? (isSelfieAligned ? '#22c55e' : '#6366f1') : 'var(--border-color)', transition: 'all 0.3s' }} />
                            ))}
                        </div>

                        {/* Webcam with oval guide */}
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: '20px', overflow: 'hidden', background: '#000' }}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={1}
                                videoConstraints={{ facingMode: "user", width: 1920, height: 1080 }}
                                mirrored={true}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 }}
                            />

                            {/* Oval face guide with animated glow */}
                            {!isLoading && (
                                <div style={{
                                    position: 'absolute', top: '10%', left: '18%', right: '18%', bottom: '22%',
                                    borderRadius: '50%',
                                    border: `3px solid ${isSelfieAligned ? '#22c55e' : (modelsLoaded ? '#6366f1' : '#f59e0b')}`,
                                    boxShadow: isSelfieAligned
                                        ? '0 0 0 9999px rgba(0,0,0,0.52)'
                                        : '0 0 0 9999px rgba(0,0,0,0.52)',
                                    animation: isSelfieAligned ? 'kycPulseGlow 1.8s ease-in-out infinite' : (modelsLoaded ? 'kycIdleGlow 2.5s ease-in-out infinite' : 'none'),
                                    zIndex: 1, pointerEvents: 'none', transition: 'border-color 0.3s',
                                }} />
                            )}

                            {/* Processing overlay */}
                            {isLoading && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '20px' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.12)', borderTopColor: '#6366f1', animation: 'kycSpinner 0.9s linear infinite' }} />
                                    <h3 style={{ color: 'white', textAlign: 'center', margin: 0, fontSize: '1rem', fontWeight: 700 }}>Validación Biométrica y OCR</h3>
                                    <div style={{ width: '85%', height: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #22c55e)', borderRadius: '999px', transition: 'width 0.2s linear' }} />
                                    </div>
                                    <p style={{ color: '#22c55e', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{ocrProgress}% Completado</p>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '0.8rem', lineHeight: '1.6', margin: 0 }}>
                                        Analizando tu cédula con OCR de alta precisión.<br />
                                        <strong style={{ color: '#fbbf24' }}>Este proceso toma ~20 segundos.</strong>
                                    </p>
                                </div>
                            )}

                            {/* Status pill */}
                            {!isLoading && (
                                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, whiteSpace: 'nowrap', padding: '0.35rem 1rem', borderRadius: '999px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', fontSize: '0.8rem', fontWeight: 600, color: isSelfieAligned ? '#22c55e' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span>{isSelfieAligned ? '✅' : (modelsLoaded ? '👤' : '⏳')}</span>
                                    {livenessStatus}
                                </div>
                            )}

                            {/* Top-left step label */}
                            {!isLoading && (
                                <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 3, padding: '0.25rem 0.65rem', borderRadius: '999px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', fontSize: '0.7rem', fontWeight: 700, color: isSelfieAligned ? '#22c55e' : (modelsLoaded ? '#a5b4fc' : '#fbbf24'), letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Paso 3 · Prueba de vida
                                </div>
                            )}
                        </div>

                        <button onClick={() => { setStep(2); setError(''); setSuccess(''); }} type="button" disabled={isLoading} style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', opacity: isLoading ? 0.5 : 1, padding: '0.75rem', borderRadius: '0.75rem', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                            ← Atrás
                        </button>
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

        <TermsModal
            isOpen={showTermsModal}
            onClose={() => setShowTermsModal(false)}
            onAccept={() => setTermsAccepted(true)}
            theme={theme}
        />
        </>
    );
}

export default Register;
