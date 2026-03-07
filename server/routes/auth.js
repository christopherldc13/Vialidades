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
        console.log('🔍 Iniciando validación OCR de Cédula...');
        const base64Data = idImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const { data: { text } } = await Tesseract.recognize(
            buffer,
            'spa', // Spanish language for DR ID
            { logger: m => console.log(`OCR Progress: ${m.status} ${Math.round(m.progress * 100)}%`) }
        );

        console.log('✅ OCR Texto Extraído (Muestra):', text.substring(0, 100) + '...');

        const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Strip all symbols/spaces
        const formFirstName = firstName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const formLastName = lastName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Check if OCR text includes the name parts
        const nameMatch = cleanText.includes(formFirstName) || cleanText.includes(formLastName);

        // For cedula, strip dashes and O's (in case 0 was read as O)
        const cleanCedula = cedula.replace(/[-O]/g, '0').replace(/[^0-9]/g, '');
        const ocrCedulaText = cleanText.replace(/[O]/g, '0');
        const cedulaMatch = ocrCedulaText.includes(cleanCedula);

        if (!nameMatch || !cedulaMatch) {
            console.log('❌ KYC Mismatch. OCR Text:', cleanText, '| Expected Name:', formFirstName, formLastName, '| Expected ID:', cleanCedula);

            // Soft Fail: If Text extracted is very short or completely misread, we let it pass for manual review later
            // We don't want to completely block registration for users with bad cameras
            if (cleanText.length < 80) {
                console.log('⚠️ OCR extracted very little text, soft-failing and allowing registration.');
            } else {
                return res.status(400).json({ msg: 'Validación KYC fallida. El nombre o la cédula en el documento no coinciden con el formulario. Intenta con mejor iluminación y encuadre.' });
            }
        } else {
            console.log('✅ Validación KYC Exitosa.');
        }

        if (faceMatchPercentage !== undefined) {
            console.log(`👤 Validación Facial Terminada: ${faceMatchPercentage}% de similitud entre Selfie y foto de Cédula.`);
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

        // Send Verification Email asynchronously
        const { sendVerificationEmail } = require('../utils/emailService');
        sendVerificationEmail(pendingUser.email, pendingUser.firstName, verificationCode).catch(err => console.error("Could not send verification email:", err));

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
                        avatar: user.avatar
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
                        avatar: user.avatar
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

        // Set expire: 10 mins
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Create reset url dynamically based on request origin
        const currentOrigin = req.headers.origin || `https://${req.get('host')}`;
        // Since the backend might be on a different port than the frontend (e.g. 5000 vs 5173 during dev),
        // we'll prioritize FRONTEND_URL from env, fallback to origin, fallback to https://localhost:5173
        const frontendUrl = process.env.FRONTEND_URL || (req.headers.origin ? req.headers.origin : 'https://localhost:5173');
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, user.username, resetUrl);
            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ msg: 'Hubo un error enviando el email' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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

        // Clear token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Contraseña actualizada' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
