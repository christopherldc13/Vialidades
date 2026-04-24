const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const Tesseract = require('tesseract.js');
const crypto = require('crypto'); // For generating reset tokens
require('dotenv').config(); // Ensure variables are loaded before Cloudinary config
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'AQUI_TU_CLIENT_ID.apps.googleusercontent.com');

// Check for duplicates before KYC
router.post('/check-duplicates', async (req, res) => {
    const { username, email, cedula, phone, firstName, lastName } = req.body;
    try {
        // Validate required fields
        if (!username || !email || !firstName || !lastName || !phone || !cedula) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
        }

        const normalizedFirstName = firstName.trim().toLowerCase();
        const normalizedLastName = lastName.trim().toLowerCase();

        const existingUser = await User.findOne({
            $or: [
                { username },
                { email },
                { cedula },
                { phone }
            ]
        });

        if (existingUser) {
            if (existingUser.cedula === cedula) return res.status(400).json({ msg: 'Esta cédula ya está registrada.' });
            if (existingUser.username === username) return res.status(400).json({ msg: 'Este nombre de usuario ya está en uso.' });
            if (existingUser.email === email) return res.status(400).json({ msg: 'Este correo electrónico ya está registrado.' });
            if (existingUser.phone === phone) return res.status(400).json({ msg: 'Este número de teléfono ya está registrado.' });
        }

        // Name and Last Name combined check (case insensitive)
        const nameMatch = await User.findOne({
            firstName: { $regex: new RegExp(`^${normalizedFirstName}$`, 'i') },
            lastName: { $regex: new RegExp(`^${normalizedLastName}$`, 'i') }
        });

        if (nameMatch) {
            return res.status(400).json({ msg: 'Ya existe un usuario con este Nombre y Apellido.' });
        }

        res.json({ success: true, msg: 'Datos válidos, puede proceder al KYC.' });

    } catch (err) {
        console.error('❌ Check Duplicates Error:', err.message);
        res.status(500).send('Server Error al validar datos: ' + err.message);
    }
});

// Register
router.post('/register', async (req, res) => {
    console.log('📝 Register Request Body:', req.body); // DEBUG LOG
    const { username, email, password, firstName, lastName, birthDate, gender, phone, cedula, birthProvince, idImage, selfieImage, faceMatchPercentage } = req.body;
    try {
        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName || !birthDate || !gender || !phone || !cedula || !birthProvince) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
        }

        if (!idImage || !selfieImage) {
            return res.status(400).json({ msg: 'Las imágenes de Verificación de Identidad (KYC) son requeridas.' });
        }

        // --- INICIO KYC OCR VALIDATION ---
        console.log('🔍 Iniciando validación OCR de Cédula con PRE-PROCESAMIENTO AVANZADO...');
        const base64Data = idImage.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // PRE-PROCESAMIENTO DE IMAGEN CON JIMP
        const { Jimp } = require('jimp');
        let processedBuffer = imageBuffer;

        try {
            console.log('⚙️ Procesando imagen para mejorar legibilidad del OCR...');
            const image = await Jimp.read(imageBuffer);

            // Convertir a escala de grises, aumentar contraste y redimensionar
            image.greyscale()      // Elimina colores que confunden al OCR
                .contrast(0.5)    // Aumenta el contraste al 50%
                .normalize()      // Normaliza los canales
                .scale(2);        // Aumenta la resolución al doble

            processedBuffer = await image.getBuffer('image/jpeg');
            console.log('✅ Imagen procesada correctamente.');
        } catch (jimpErr) {
            console.error('⚠️ Error al procesar imagen con Jimp, usando original:', jimpErr.message);
            // Fallback to original buffer if Jimp fails
        }

        const { data: { text } } = await Tesseract.recognize(
            processedBuffer,
            'spa', // Spanish language for DR ID
            { logger: m => console.log(`OCR Progress: ${m.status} ${Math.round(m.progress * 100)}%`) }
        );

        console.log('✅ OCR Texto Extraído (Muestra):', text.substring(0, 100) + '...');

        const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Strip all symbols/spaces
        const formFirstName = firstName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const formLastName = lastName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Name match checks if any major part of the name is exactly present.
        const nameParts = [...firstName.toUpperCase().split(' '), ...lastName.toUpperCase().split(' ')]
            .map(p => p.replace(/[^A-Z0-9]/g, ''))
            .filter(p => p.length >= 3);

        let nameMatch = false;
        for (const part of nameParts) {
            if (cleanText.includes(part)) {
                nameMatch = true;
                break;
            }
        }

        // For cedula, user input is clean of dashes/O's
        const cleanCedula = cedula.replace(/[^0-9]/g, '');
        // Replace common OCR mismatches
        const ocrCedulaText = cleanText.replace(/[OQ]/g, '0').replace(/[I]/g, '1').replace(/[S]/g, '5').replace(/[Z]/g, '2').replace(/[B]/g, '8');

        // Exactitud estricta para la Cédula (los 11 números deben coincidir exactamente)
        let cedulaMatch = ocrCedulaText.includes(cleanCedula);

        if (!nameMatch || !cedulaMatch) {
            console.log('❌ KYC Mismatch. OCR Text:', cleanText, '| Expected Name:', formFirstName, formLastName, '| Expected ID:', cleanCedula);
            return res.status(400).json({ msg: 'Validación KYC fallida. El nombre o la cédula en el documento no coinciden con el formulario. Intenta con mejor iluminación y encuadre y que los datos coincidan.' });
        } else {
            console.log(`✅ Validación KYC Exitosa.`);
            console.log(`🔍 Textos detectados y aprobados -> Nombre esperado: ${formFirstName} ${formLastName} | Cédula esperada: ${cleanCedula}`);
        }

        if (faceMatchPercentage !== undefined) {
            console.log(`👤 Validación Facial Terminada: ${faceMatchPercentage}% de similitud entre Selfie y foto de Cédula.`);
            if (faceMatchPercentage < 30) {
                return res.status(400).json({ msg: 'Validación facial fallida. Tu selfie no corresponde con la foto de la cédula.' });
            }
        }
        // --- FIN KYC OCR VALIDATION ---
        let user = await User.findOne({ email });
        if (user) {
            console.log('⚠️ User already exists in main collection:', email);
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Remove any existing pending registration for this email to start fresh
        await PendingUser.deleteMany({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 6-digit confirmation code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        let pendingUser = new PendingUser({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            birthDate,
            gender,
            phone,
            cedula,
            birthProvince,
            verificationCode
        });

        await pendingUser.save();
        console.log('✅ Pending User Saved Successfully:', pendingUser.id);

        // Send Verification Email asynchronously, delayed by 21 seconds to match the frontend OCR artificial loader!
        const { sendVerificationEmail } = require('../utils/emailService');
        setTimeout(() => {
            sendVerificationEmail(pendingUser.email, pendingUser.firstName, verificationCode).catch(err => console.error("Could not send verification email:", err));
        }, 21000);

        // Return generic success to prompt for the verification code
        res.json({
            msg: 'Registro exitoso. Revisa tu correo electrónico para el código de verificación.',
            requiresVerification: true,
            email: pendingUser.email
        });
    } catch (err) {
        console.error('❌ Register Error:', err.message); // DEBUG LOG
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ msg: 'Cuenta no verificada. Por favor verifica tu correo electrónico.', unverified: true });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // --- SANCTIONS CHECK ---
        const Sanction = require('../models/Sanction');
        const activeSanctions = await Sanction.find({ userId: user.id, status: 'active' });

        let isBlocked = false;
        let blockMessage = '';
        let sanctionExpiresAt = null;

        for (let sanction of activeSanctions) {
            if (sanction.expiresAt && sanction.expiresAt < new Date()) {
                // Sanction expired, set to inactive
                sanction.status = 'inactive';
                await sanction.save();
            } else {
                // Sanction still active
                isBlocked = true;
                if (!sanction.expiresAt) {
                    blockMessage = 'Tu cuenta ha sido suspendida permanentemente debido a múltiples reportes rechazados por violación de normas.';
                } else {
                    blockMessage = `Tu cuenta está suspendida temporalmente hasta ${sanction.expiresAt.toLocaleString()}.`;
                    sanctionExpiresAt = sanction.expiresAt;
                }
                break;
            }
        }

        if (isBlocked) {
            return res.status(403).json({ msg: blockMessage, sanctionExpiresAt });
        }
        // --- END SANCTIONS CHECK ---

        const sessionToken = crypto.randomBytes(20).toString('hex');
        user.sessionToken = sessionToken;
        await user.save({ validateBeforeSave: false });

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                sessionToken
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        cedula: user.cedula,
                        birthProvince: user.birthProvince,
                        birthDate: user.birthDate,
                        gender: user.gender,
                        role: user.role,
                        reputation: user.reputation,
                        sanctions: user.sanctions,
                        avatar: user.avatar,
                        isVerified: user.isVerified
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Google Login
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: [
                process.env.GOOGLE_CLIENT_ID,
                '60456172765-aejg7e2na3nm6b476hjhn3c1q7n3u91u.apps.googleusercontent.com'
            ]
        });
        const payload = ticket.getPayload();
        const email = payload['email'];

        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'No se encontró una cuenta registrada con este correo de Google en Vialidades. Por favor, regístrate primero con la misma cuenta.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ msg: 'Cuenta no verificada. Por favor verifica tu correo electrónico.', unverified: true });
        }

        // --- SANCTIONS CHECK ---
        const Sanction = require('../models/Sanction');
        const activeSanctions = await Sanction.find({ userId: user.id, status: 'active' });

        let isBlocked = false;
        let blockMessage = '';
        let sanctionExpiresAt = null;

        for (let sanction of activeSanctions) {
            if (sanction.expiresAt && sanction.expiresAt < new Date()) {
                sanction.status = 'inactive';
                await sanction.save();
            } else {
                isBlocked = true;
                if (!sanction.expiresAt) {
                    blockMessage = 'Tu cuenta ha sido suspendida permanentemente debido a múltiples reportes rechazados por violación de normas.';
                } else {
                    blockMessage = `Tu cuenta está suspendida temporalmente hasta ${sanction.expiresAt.toLocaleString()}.`;
                    sanctionExpiresAt = sanction.expiresAt;
                }
                break;
            }
        }

        if (isBlocked) {
            return res.status(403).json({ msg: blockMessage, sanctionExpiresAt });
        }
        // --- END SANCTIONS CHECK ---

        const sessionToken = crypto.randomBytes(20).toString('hex');
        user.sessionToken = sessionToken;
        await user.save({ validateBeforeSave: false });

        const jwtPayload = {
            user: {
                id: user.id,
                role: user.role,
                sessionToken
            }
        };

        jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        cedula: user.cedula,
                        birthProvince: user.birthProvince,
                        birthDate: user.birthDate,
                        gender: user.gender,
                        role: user.role,
                        reputation: user.reputation,
                        sanctions: user.sanctions,
                        avatar: user.avatar,
                        isVerified: user.isVerified
                    }
                });
            }
        );
    } catch (err) {
        console.error('Google Auth Verify Error:', err.message);
        res.status(500).json({ msg: 'Fallo al autenticar el token de Google. Intentelo nuevamente.' });
    }
});

// Verify Email Code
router.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    try {
        let pendingUser = await PendingUser.findOne({ email });

        if (!pendingUser) {
            // Check if user is already fully registered and verified
            let verifiedUser = await User.findOne({ email });
            if (verifiedUser) {
                return res.status(400).json({ msg: 'El usuario ya está verificado y activo. Por favor, inicia sesión.' });
            }
            return res.status(400).json({ msg: 'No se encontró un registro pendiente o el código ha expirado tras 1 hora. Por favor, regístrate de nuevo.' });
        }

        if (pendingUser.verificationCode !== code) {
            return res.status(400).json({ msg: 'Código de verificación incorrecto' });
        }

        // Code matches perfectly! Let's create the final User
        let user = new User({
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password, // Keep the hashed password
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            birthDate: pendingUser.birthDate,
            gender: pendingUser.gender,
            phone: pendingUser.phone,
            cedula: pendingUser.cedula,
            birthProvince: pendingUser.birthProvince,
            isVerified: true
        });

        await user.save();

        // Clean up pending
        await PendingUser.deleteMany({ email });

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        cedula: user.cedula,
                        birthProvince: user.birthProvince,
                        birthDate: user.birthDate,
                        gender: user.gender,
                        role: user.role,
                        reputation: user.reputation,
                        sanctions: user.sanctions,
                        avatar: user.avatar,
                        isVerified: user.isVerified
                    }
                });
            }
        );

    } catch (err) {
        console.error('❌ Verify Error:', err.message);
        res.status(500).send('Server Error al verificar el código');
    }
});

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary (Same as in reports.js)
cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').replace(/[\r\n\t\0 ]+/g, ''),
    api_key: (process.env.CLOUDINARY_API_KEY || '').replace(/[\r\n\t\0 ]+/g, ''),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').replace(/[\r\n\t\0 ]+/g, '')
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'vialidades_avatars',
        // allowed_formats removed to let Cloudinary auto-convert phone photos (HEIC/etc)
        // transformation removed: phone photos and HEIC formats may crash during crop limit evaluation
    }
});

const upload = multer({ storage: storage });

const auth = require('../middleware/auth');

// Get User (Verify Token Middleware)
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Profile (Support Avatar Upload)
router.patch('/profile', auth, upload.single('avatar'), async (req, res) => {
    console.log('[DEBUG] /profile patch hit. file:', req.file, 'body:', req.body);
    const {
        username, email,
        firstName, lastName, phone,
        cedula, gender, birthProvince, birthDate
    } = req.body;
    try {
        let updateFields = {};

        if (username !== undefined) updateFields.username = username;
        if (email !== undefined) updateFields.email = email;
        if (firstName !== undefined) updateFields.firstName = firstName;
        if (lastName !== undefined) updateFields.lastName = lastName;
        if (phone !== undefined) updateFields.phone = phone;
        if (cedula !== undefined) updateFields.cedula = cedula;
        if (gender !== undefined) updateFields.gender = gender;
        if (birthProvince !== undefined) updateFields.birthProvince = birthProvince;
        if (birthDate !== undefined) updateFields.birthDate = birthDate;

        if (req.file) updateFields.avatar = req.file.path;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ msg: 'No se envió ningún dato para actualizar' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: false } // runValidators: false helps with legacy accounts missing new fields
        ).select('-password');

        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        res.json(user);
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ msg: 'Server Error al actualizar perfil', error: err.message });
    }
});

// @route   POST api/auth/forgot-password
// @desc    Generate password reset token and send email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ msg: 'No existe una cuenta con ese correo electrónico.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expire: 60 mins (increased from 10m for better UX)
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        // Create reset url dynamically based on request origin
        const currentOrigin = req.headers.origin || `https://${req.get('host')}`;
        // Since the backend might be on a different port than the frontend (e.g. 5000 vs 5173 during dev),
        // we'll prioritize FRONTEND_URL from env, fallback to origin, fallback to https://localhost:5173
        const frontendUrl = process.env.FRONTEND_URL || (req.headers.origin ? req.headers.origin : 'https://localhost:5173');
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
            console.log(`✅ Reset password email sent successfully to: ${user.email}`);
            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.error("❌ ERROR SENDING RESET EMAIL:", err.message);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({
                msg: 'Hubo un error enviando el email de recuperación.',
                error: err.message,
                type: 'EMAIL_ERROR'
            });
        }
    } catch (err) {
        console.error("❌ FORGOT PASSWORD ROUTE ERROR:", err.message);
        res.status(500).json({
            msg: 'Error interno del servidor al procesar la solicitud.',
            error: err.message,
            type: 'SERVER_ERROR'
        });
    }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Token no válido o ha expirado.' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        // Clear token fields explicitly and save
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        console.log(`✅ Contraseña restablecida con éxito para el usuario: ${user.email}. Token invalidado.`);

        res.status(200).json({ success: true, data: 'Contraseña actualizada' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
