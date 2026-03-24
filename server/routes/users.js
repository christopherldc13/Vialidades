const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin/Moderator only)
router.get('/', auth, async (req, res) => {
    try {
        if (!['admin', 'moderator'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'No tienes permisos' });
        }
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/promote
// @desc    Promote a user to moderator
// @access  Private (Admin/Moderator only)
router.put('/promote', auth, async (req, res) => {
    try {
        // Check if requester is admin or moderator
        if (!['admin', 'moderator'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'No tienes permisos para realizar esta acción' });
        }

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ msg: 'Por favor, proporciona el correo electrónico del usuario' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ msg: 'No se encontró ningún usuario con ese correo electrónico' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ msg: 'No puedes cambiar el rol de un administrador' });
        }

        if (user.role === 'moderator') {
            return res.status(400).json({ msg: 'El usuario ya es un moderador' });
        }

        // Update role
        user.role = 'moderator';
        await user.save();

        res.json({ msg: 'Usuario promovido a moderador exitosamente', user: { email: user.email, role: user.role } });
    } catch (err) {
        console.error('Error promoting user:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/users/moderator
// @desc    Create a new moderator directly
// @access  Private (Admin/Moderator only)
router.post('/moderator', auth, async (req, res) => {
    try {
        if (!['admin', 'moderator'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'No tienes permisos para crear moderadores' });
        }

        const { username, email, password, firstName, lastName, birthDate, gender, phone, cedula, birthProvince } = req.body;

        if (!username || !email || !password || !firstName || !lastName || !birthDate || !gender || !phone || !cedula || !birthProvince) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
        }

        // Check if email is already taken (Strictly unique)
        let existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: 'El correo electrónico ya está registrado en otra cuenta.' });
        }

        // Check if username or cedula is taken by another moderator/admin
        // We allow duplicates if the existing record is a regular 'user'
        let existingConflict = await User.findOne({ 
            $and: [
                { $or: [{ username }, { cedula }] },
                { role: { $ne: 'user' } }
            ]
        });

        if (existingConflict) {
            return res.status(400).json({ msg: 'El nombre de usuario o la cédula ya corresponden a una cuenta de Moderador o Administrador activa.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
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
            role: 'moderator',
            isVerified: true // Moderators bypass email verification
        });

        await user.save();
        res.status(201).json({ msg: 'Moderador creado exitosamente', user: { email: user.email, username: user.username } });

    } catch (err) {
        console.error('Error creating moderator:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

module.exports = router;
