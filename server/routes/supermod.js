const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

const isSuperMod = (req, res) => {
    if (!['admin', 'supermoderador'].includes(req.user.role)) {
        res.status(403).json({ msg: 'Acceso denegado. Se requiere rol supermoderador.' });
        return false;
    }
    return true;
};

// GET /api/supermod/stats — Dashboard stats
router.get('/stats', auth, async (req, res) => {
    try {
        if (!isSuperMod(req, res)) return;

        const [total, activos, inactivos, reportesTotal] = await Promise.all([
            User.countDocuments({ role: 'moderator' }),
            User.countDocuments({ role: 'moderator', isActive: { $ne: false } }),
            User.countDocuments({ role: 'moderator', isActive: false }),
            Report.countDocuments({ moderatorId: { $exists: true, $ne: null } })
        ]);

        res.json({ total, activos, inactivos, reportesTotal });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/supermod/moderators — Lista de moderadores con sus stats
router.get('/moderators', auth, async (req, res) => {
    try {
        if (!isSuperMod(req, res)) return;

        const moderators = await User.find({ role: 'moderator' })
            .select('-password -sessionToken -resetPasswordToken -resetPasswordExpire -verificationCode')
            .sort({ createdAt: -1 })
            .lean();

        // Contar reportes moderados por cada uno
        const withStats = await Promise.all(moderators.map(async (mod) => {
            const [aprobados, rechazados, sancionados] = await Promise.all([
                Report.countDocuments({ moderatorId: mod._id, status: 'approved' }),
                Report.countDocuments({ moderatorId: mod._id, status: 'rejected' }),
                Report.countDocuments({ moderatorId: mod._id, wasSanctioned: true })
            ]);
            return { ...mod, stats: { aprobados, rechazados, sancionados, total: aprobados + rechazados + sancionados } };
        }));

        res.json(withStats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/supermod/moderators — Crear nuevo moderador
router.post('/moderators', auth, async (req, res) => {
    try {
        if (!isSuperMod(req, res)) return;

        const { username, email, password, firstName, lastName, birthDate, gender, phone, cedula, birthProvince } = req.body;

        if (!username || !email || !password || !firstName || !lastName || !birthDate || !gender || !phone || !cedula || !birthProvince) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ msg: 'El correo ya está registrado.' });

        const existingConflict = await User.findOne({
            $and: [
                { $or: [{ username }, { cedula }] },
                { role: { $ne: 'user' } }
            ]
        });
        if (existingConflict) return res.status(400).json({ msg: 'El usuario o cédula ya pertenece a otra cuenta de Moderador o Admin.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newMod = new User({
            username, email, password: hashedPassword,
            firstName, lastName, birthDate, gender, phone, cedula, birthProvince,
            role: 'moderator',
            isVerified: true,
            isActive: true
        });

        await newMod.save();
        res.status(201).json({ msg: 'Moderador creado exitosamente', moderador: { email: newMod.email, username: newMod.username } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// PATCH /api/supermod/moderators/:id/toggle — Activar/Desactivar moderador
router.patch('/moderators/:id/toggle', auth, async (req, res) => {
    try {
        if (!isSuperMod(req, res)) return;

        const mod = await User.findOne({ _id: req.params.id, role: 'moderator' });
        if (!mod) return res.status(404).json({ msg: 'Moderador no encontrado' });

        mod.isActive = mod.isActive === false ? true : false;
        mod.sessionToken = null; // Invalidar sesión activa si se desactiva
        await mod.save({ validateBeforeSave: false });

        res.json({ msg: mod.isActive ? 'Moderador activado' : 'Moderador desactivado', isActive: mod.isActive });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
