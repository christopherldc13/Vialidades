const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSupportRequestConfirmation, sendSupportStatusUpdate } = require('../utils/emailService');
const auth = require('../middleware/auth');
const { getIo } = require('../socket');

const isSuperMod = (req, res) => {
    if (!['admin', 'supermoderador'].includes(req.user.role)) {
        res.status(403).json({ msg: 'Acceso denegado.' });
        return false;
    }
    return true;
};

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function generateCaseNumber() {
    let attempts = 0;
    while (attempts < 10) {
        let code = 'VIL-';
        for (let i = 0; i < 7; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
        const exists = await SupportRequest.findOne({ caseNumber: code });
        if (!exists) return code;
        attempts++;
    }
    throw new Error('No se pudo generar número de caso único.');
}

// POST / — Submit support request (public, no auth)
router.post('/', async (req, res) => {
    try {
        const {
            type, requesterName, requesterEmail, requesterPhone, requesterCedula,
            relationship, victimName, reportId, reportDescription, reason
        } = req.body;

        if (!type || !requesterName || !requesterEmail || !reason) {
            return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
        }

        const caseNumber = await generateCaseNumber();

        const request = new SupportRequest({
            type, requesterName, requesterEmail, requesterPhone,
            requesterCedula, relationship, victimName, reportId,
            reportDescription, reason, caseNumber
        });

        await request.save();
        console.log(`[SUPPORT] Nueva solicitud ${caseNumber} de ${requesterEmail} — tipo: ${type}`);

        sendSupportRequestConfirmation(requesterEmail, {
            requesterName, type, victimName, relationship,
            reportId, reportDescription, reason,
            caseNumber, createdAt: request.createdAt
        }).catch(err => console.error('[SUPPORT EMAIL]', err.message));

        // Notify all supermods
        (async () => {
            try {
                const typeLabel = type === 'familiar' ? 'Familiar (Ley 192-19)' : 'Cont. No Autorizado (Ley 172-13)';
                const supermods = await User.find(
                    { role: { $in: ['admin', 'supermoderador'] } },
                    '_id'
                );
                if (supermods.length > 0) {
                    await Notification.insertMany(supermods.map(sm => ({
                        userId: sm._id,
                        type: 'warning',
                        priority: 'urgent',
                        category: 'support_request',
                        message: `Nueva solicitud de soporte: ${caseNumber} — ${requesterName} (${typeLabel})`,
                        link: '/supermoderador/soporte',
                        metadata: { caseNumber, type, requesterName },
                    })));
                }
                try {
                    getIo().to('supermod_room').emit('new_support_request', {
                        caseNumber, type, requesterName, createdAt: request.createdAt,
                    });
                } catch (_) {}
            } catch (err) {
                console.error('[SUPPORT NOTIF]', err.message);
            }
        })();

        res.status(201).json({ msg: 'Solicitud enviada exitosamente.', caseNumber });
    } catch (err) {
        console.error('[SUPPORT POST]', err.message);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
});

// GET /case/:caseNumber — Consulta pública por número de caso (no auth)
router.get('/case/:caseNumber', async (req, res) => {
    try {
        const request = await SupportRequest.findOne({
            caseNumber: req.params.caseNumber.toUpperCase()
        }).select('caseNumber type status victimName relationship createdAt resolvedAt resolution');

        if (!request) return res.status(404).json({ msg: 'Número de caso no encontrado.' });
        res.json(request);
    } catch (err) {
        console.error('[SUPPORT CASE LOOKUP]', err.message);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
});

// GET / — List all requests (supermod only)
router.get('/', auth, async (req, res) => {
    try {
        if (!isSuperMod(req, res)) return;
        const { status } = req.query;
        const query = status ? { status } : {};
        const requests = await SupportRequest.find(query)
            .populate('resolvedBy', 'firstName lastName username')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('[SUPPORT GET]', err.message);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
});

// PATCH /:id — Update request status (supermod only)
router.patch('/:id', auth, async (req, res) => {
    try {
        if (!isSuperMod(req, res)) return;
        const { status, resolution } = req.body;

        const update = { status };
        if (resolution !== undefined) update.resolution = resolution;
        if (['resolved', 'rejected'].includes(status)) {
            update.resolvedBy = req.user.id;
            update.resolvedAt = new Date();
        }

        const request = await SupportRequest.findByIdAndUpdate(
            req.params.id, update, { new: true }
        ).populate('resolvedBy', 'firstName lastName username');

        if (!request) return res.status(404).json({ msg: 'Solicitud no encontrada.' });

        sendSupportStatusUpdate(request.requesterEmail, {
            requesterName: request.requesterName,
            caseNumber: request.caseNumber,
            type: request.type,
            status: request.status,
            resolution: resolution || null,
        }).catch(err => console.error('[SUPPORT STATUS EMAIL]', err.message));

        res.json(request);
    } catch (err) {
        console.error('[SUPPORT PATCH]', err.message);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
});

module.exports = router;
