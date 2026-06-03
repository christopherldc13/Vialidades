const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const axios = require('axios');
const auth = require('../middleware/auth');
const { sendReportStatusEmail, sendContentViolationEmail, sendReportPublishedEmail } = require('../utils/emailService');
const { checkImageContent } = require('../utils/contentModeration');
const Sanction = require('../models/Sanction');

// Configure Cloudinary
cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').replace(/[\r\n\t\0 ]+/g, ''),
    api_key: (process.env.CLOUDINARY_API_KEY || '').replace(/[\r\n\t\0 ]+/g, ''),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').replace(/[\r\n\t\0 ]+/g, '')
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Dynamically set resource_type based on mimetype
        const isVideo = file.mimetype.startsWith('video/');
        return {
            folder: 'vialidades_reports',
            resource_type: isVideo ? 'video' : 'image',
            format: isVideo ? undefined : 'jpg', // Force JPG for images to support HEIC conversion
            // Ensure metadata is preserved by NOT transforming the original on upload
            image_metadata: true,
            exif: true
        };
    }
});

const upload = multer({ storage: storage });
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// Pre-upload content check (called from frontend on file select)
router.post('/check-media', auth, uploadMemory.single('media'), async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file provided' });

    try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('media', req.file.buffer, {
            filename: req.file.originalname || 'image.jpg',
            contentType: req.file.mimetype || 'image/jpeg'
        });
        form.append('models', 'nudity-2.0,violence,offensive,gore');
        form.append('api_user', (process.env.SIGHTENGINE_API_USER   || '').replace(/[\r\n\t\0 ]+/g, ''));
        form.append('api_secret', (process.env.SIGHTENGINE_API_SECRET || '').replace(/[\r\n\t\0 ]+/g, ''));

        const { data } = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
            headers: form.getHeaders(),
            timeout: 10000
        });

        console.log('[check-media] scores:', JSON.stringify({
            nudity: data.nudity,
            violence: data.violence,
            gore: data.gore,
            offensive: data.offensive
        }));

        const reasons = [];
        if (data.nudity) {
            if ((data.nudity.sexual_activity ?? 0) > 0.3) reasons.push('contenido sexual explícito');
            if ((data.nudity.sexual_display  ?? 0) > 0.3) reasons.push('exhibición sexual');
            if ((data.nudity.erotica         ?? 0) > 0.3) reasons.push('contenido erótico');
            if ((data.nudity.raw             ?? 0) > 0.3) reasons.push('desnudez explícita');
            if ((data.nudity.sextoy          ?? 0) > 0.3) reasons.push('contenido sexual');
            if ((data.nudity.suggestive      ?? 0) > 0.7) reasons.push('contenido sugestivo');
            // catch-all: si "none" es bajo, hay algún tipo de desnudez
            if ((data.nudity.none            ?? 1) < 0.5) reasons.push('contenido inapropiado');
        }
        if ((data.violence?.prob ?? 0) > 0.5) reasons.push('contenido violento');
        if ((data.gore?.prob     ?? 0) > 0.5) reasons.push('imágenes gore');
        if ((data.offensive?.prob ?? 0) > 0.5) reasons.push('contenido ofensivo');

        res.json({ isFlagged: reasons.length > 0, reasons });
    } catch (err) {
        console.error('[check-media] ERROR:', err.response?.status, JSON.stringify(err.response?.data), err.message);
        res.status(500).json({ msg: 'Error al verificar la imagen', detail: err.message });
    }
});

// Create Report
router.post('/', auth, upload.array('media', 5), async (req, res) => {
    try {
        const { type, description, lat, lng, address, carBrand, carModel, carYear, carColor } = req.body;
        const userId = req.user.id;

        if (!type || !description || !lat || !lng) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'Debes adjuntar al menos una imagen o video al reporte.' });
        }

        // Check for sanctions
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.sanctions >= 3) {
            return res.status(403).json({ msg: 'You are banned from creating reports due to multiple sanctions.' });
        }

        const media = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const isVideo = file.mimetype.startsWith('video/');
                let metadata = {};

                try {
                    // Manually fetch metadata from Cloudinary since multer-storage-cloudinary might not provide it in 'file'
                    const result = await cloudinary.api.resource(file.filename, {
                        image_metadata: true,
                        exif: true,
                        resource_type: isVideo ? 'video' : 'image'
                    });

                    // Pick relevant fields to keep DB clean but informative
                    metadata = {
                        image_metadata: result.image_metadata,
                        exif: result.exif,
                        metadata: result.metadata,
                        gps: result.image_metadata?.GPS || result.exif?.GPS || null,
                        info: {
                            format: result.format,
                            size: result.bytes,
                            width: result.width,
                            height: result.height,
                            created_at: result.created_at
                        }
                    };
                } catch (metaErr) {
                    console.error("Error fetching Cloudinary metadata:", metaErr);
                }

                media.push({
                    url: file.path,
                    type: isVideo ? 'video' : 'image',
                    public_id: file.filename,
                    metadata: metadata
                });
            }
        }

        // --- Auto Content Moderation (Sightengine) ---
        console.log('[ContentModeration] API_USER set:', !!process.env.SIGHTENGINE_API_USER, '| Images to check:', media.filter(m => m.type === 'image').length);
        if (process.env.SIGHTENGINE_API_USER) {
            const imagesToCheck = media.filter(m => m.type === 'image');
            const flaggedReasons = [];

            for (const img of imagesToCheck) {
                try {
                    const result = await checkImageContent(img.url);
                    if (result.isFlagged) flaggedReasons.push(...result.reasons);
                } catch (modErr) {
                    console.error('[ContentModeration] Sightengine error:', modErr.message);
                }
            }

            if (flaggedReasons.length > 0) {
                const uniqueReasons = [...new Set(flaggedReasons)];
                const rejectionComment = `[AUTO] Contenido inapropiado detectado: ${uniqueReasons.join(', ')}.`;

                // Save rejected report for audit trail
                const rejectedReport = new Report({
                    userId,
                    type,
                    description,
                    location: { lat, lng, address },
                    media,
                    photos: media.filter(m => m.type === 'image'),
                    carInfo: { brand: carBrand, model: carModel, year: carYear, color: carColor },
                    status: 'rejected',
                    moderatorComment: rejectionComment,
                    wasSanctioned: true
                });
                const savedReport = await rejectedReport.save();

                // Apply sanction directly on user
                const isFirstReport = user.reputation === 0;
                user.reputation = isFirstReport ? 25 : Math.max(1, user.reputation - 25);
                user.sanctions += 1;

                if (user.sanctions === 1) user.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
                else if (user.sanctions === 2) user.blockedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
                // sanctions >= 3: permanent ban (blockedUntil stays null, sanctions count blocks)

                await user.save();

                // Send email notification
                sendContentViolationEmail(user.email, user.firstName, uniqueReasons, user.sanctions)
                    .catch(err => console.error('Error enviando email de sanción:', err));

                // Notify user via notification system (silent rejection)
                await new Notification({
                    userId: user._id,
                    type: 'warning',
                    message: `⚠️ Tu reporte fue rechazado porque el sistema detectó contenido inapropiado en las imágenes adjuntas. Recuerda que subir este tipo de contenido está prohibido y puede resultar en la suspensión de tu cuenta (${user.sanctions}/3 sanciones).`
                }).save();

                const io = require('../socket').getIo();
                io.emit('report_status_updated', { reportId: savedReport._id, status: 'rejected', wasSanctioned: true });

                // Devuelve 200 para que el frontend muestre éxito — la notificación llega por el sistema
                return res.json(savedReport);
            }
        }

        const newReport = new Report({
            userId,
            type,
            description,
            location: { lat, lng, address },
            media,
            photos: media.filter(m => m.type === 'image'),
            carInfo: {
                brand: carBrand,
                model: carModel,
                year: carYear,
                color: carColor
            },
            status: 'approved'
        });

        const report = await newReport.save();

        // Notify in Real-Time
        const io = require('../socket').getIo();
        io.emit('new_report', report);

        // Send published email (fire-and-forget)
        sendReportPublishedEmail(user.email, user.firstName, {
            type: report.type,
            description: report.description,
            address: report.location?.address || null,
            timestamp: report.timestamp
        }).catch(err => console.error('Error enviando email de publicación:', err));

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- PUBLIC ENDPOINT FOR LANDING PAGE HEATMAP ---
router.get('/public', async (req, res) => {
    try {
        // Only return approved reports.
        // Select only the absolutely necessary fields (plus title/desc for popups) to keep the payload safe.
        const reports = await Report.find({ status: 'approved' })
            .select('location.lat location.lng type title description -_id')
            .lean();

        res.json(reports);
    } catch (err) {
        console.error('Error fetching public reports:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- MODERATOR STATS ENDPOINT ---
router.get('/stats', auth, async (req, res) => {
    try {
        if (!['moderator', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        const moderatorId = req.user.id;

        const [pending, approved, rejected, sanctioned] = await Promise.all([
            Report.countDocuments({ status: 'pending' }),
            Report.countDocuments({ status: 'approved', moderatorId }),
            Report.countDocuments({ status: 'rejected', wasSanctioned: { $ne: true }, moderatorId }),
            Report.countDocuments({ wasSanctioned: true, moderatorId })
        ]);

        res.json({ pending, approved, rejected, sanctioned });
    } catch (err) {
        console.error('Error fetching stats:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- LOCK REPORT (In Process) ---
router.put('/:id/lock', auth, async (req, res) => {
    try {
        if (!['moderator', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'No autorizado' });
        }

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Reporte no encontrado' });

        // If already locked by someone else
        if (report.status === 'In Process' && report.moderatorInCharge?.toString() !== req.user.id) {
            return res.status(409).json({ msg: 'Este reporte ya está siendo revisado por otro moderador' });
        }

        report.status = 'In Process';
        report.moderatorInCharge = req.user.id;
        await report.save();

        // Emit to all
        const io = require('../socket').getIo();
        io.emit('report_status_updated', {
            reportId: report._id,
            status: 'In Process',
            moderatorName: req.user.username
        });

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- UNLOCK REPORT (Back to Pending) ---
router.put('/:id/unlock', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Reporte no encontrado' });

        if (report.status === 'In Process' && report.moderatorInCharge?.toString() === req.user.id) {
            const restoredStatus = report.flags?.length >= 3 ? 'needs_review' : 'pending';
            report.status = restoredStatus;
            report.moderatorInCharge = null;
            await report.save();

            const io = require('../socket').getIo();
            io.emit('report_status_updated', {
                reportId: report._id,
                status: restoredStatus
            });
        }

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Reports - Logic:
// If query 'my=true', return user's reports.
// If query 'status=pending' & user is admin/mod, return pending.
// Default: return status='approved' (Public Feed).
router.get('/', auth, async (req, res) => {
    try {
        const { my, status } = req.query;
        let query = {};

        if (my === 'true') {
            query.userId = req.user.id;
            query.hiddenByUser = { $ne: true };
        } else if (['moderator', 'admin'].includes(req.user.role)) {
            // Global vs. Personalized logic
            if (status === 'pending') {
                query.status = { $in: ['pending', 'In Process', 'needs_review'] };
                // Global: No moderatorId filter
            } else if (status === 'all') {
                // Global history: No specific filter
            } else if (status === 'sanctioned') {
                query.wasSanctioned = true;
                query.moderatorId = req.user.id;
            } else if (status === 'rejected') {
                query.status = 'rejected';
                query.wasSanctioned = { $ne: true };
                query.moderatorId = req.user.id;
            } else if (status === 'approved') {
                query.status = 'approved';
                query.moderatorId = req.user.id;
            } else if (status) {
                query.status = status;
                // For any other specific status, filter by self for security
                query.moderatorId = req.user.id;
            } else {
                // Default: Moderated approved reports for this user
                query.status = 'approved';
                query.moderatorId = req.user.id;
            }
        } else {
            // Regular users see approved + reports under community review
            query.status = { $in: ['approved', 'In Process', 'needs_review'] };
            query.hiddenByUser = { $ne: true };
        }

        const reports = await Report.find(query).sort({ timestamp: -1 }).populate('userId', 'username avatar');
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Single Report
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('userId', 'username avatar');
        if (!report) return res.status(404).json({ msg: 'Report not found' });
        res.json(report);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Report not found' });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Moderate Report
router.patch('/:id/moderate', auth, async (req, res) => {
    const { status, moderatorComment } = req.body;
    console.log("MODERATION REQUEST BODY:", req.body);

    // Robust boolean conversion
    const isSanctioning = req.body.sanctionUser === true || req.body.sanctionUser === 'true';
    console.log("Calculated isSanctioning:", isSanctioning);

    try {
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        report.status = status;
        report.moderatorId = req.user.id; // Corrected: use req.user.id from token
        if (status === 'rejected') {
            report.moderatorComment = moderatorComment || req.body.rejectionReason;
            if (isSanctioning) {
                report.wasSanctioned = true;
            }
        } else if (status === 'approved') {
            report.moderatorComment = moderatorComment;
            report.flags = []; // clear community flags on approval

            // Apply Cloudinary face-blur to all images via URL transformation
            let modified = false;
            const allItems = [...(report.media || []), ...(report.photos || [])];
            allItems.forEach(item => {
                if (item.type === 'image' && item.url && item.url.includes('/upload/')) {
                    if (!item.url.includes('/e_blur_faces/')) {
                        item.url = item.url.replace('/upload/', '/upload/e_blur_faces/');
                        modified = true;
                    }
                    if (item.url.toLowerCase().endsWith('.heic')) {
                        item.url = item.url.replace(/\.heic$/i, '.jpg');
                        modified = true;
                    }
                }
            });

            if (modified) {
                report.markModified('media');
                report.markModified('photos');
            }
        }

        // SAVE REPORT IMMEDIATELY
        await report.save();

        // Fetch user next to apply reputation logic
        const user = await User.findById(report.userId);
        if (user) {
            console.log(`[DEBUG] User ${user.username} BEFORE: Rep=${user.reputation}, Sanctions=${user.sanctions}`);

            const isFirstReport = user.reputation === 0;

            if (status === 'approved') {
                if (isFirstReport) {
                    user.reputation = 100;
                } else {
                    user.reputation = Math.min(100, user.reputation + 10);
                }
            } else if (status === 'rejected') {
                if (isSanctioning) {
                    if (isFirstReport) {
                        user.reputation = 25; // 50 base - 25 penalty
                    } else {
                        user.reputation = Math.max(1, user.reputation - 25);
                    }

                    // Create Sanction Record
                    let expiresAt = null;
                    if (user.sanctions === 0) {
                        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                    } else if (user.sanctions === 1) {
                        expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
                    } else {
                        expiresAt = null; // Permanent
                    }

                    const newSanction = new Sanction({
                        userId: user._id,
                        reportId: report._id,
                        status: 'active',
                        expiresAt: expiresAt
                    });
                    await newSanction.save();

                    user.sanctions += 1;
                    console.log(`[DEBUG] Applied Sanction. New Rep=${user.reputation}, New Sanctions=${user.sanctions}`);
                } else {
                    // Normal Rejection
                    if (isFirstReport) {
                        user.reputation = 40; // 50 base - 10 penalty
                    } else {
                        user.reputation = Math.max(1, user.reputation - 10);
                    }
                    console.log(`[DEBUG] Applied Normal Rejection. New Rep=${user.reputation}`);
                }
            }
            await user.save();
            console.log(`[DEBUG] User saved successfully.`);

            // Create Notification
            let notifType = status === 'approved' ? 'success' : 'error';
            let notifMsg = `Tu reporte de ${report.type} ha sido ${status === 'approved' ? 'APROBADO ✅' : 'RECHAZADO ❌'}.`;

            if (isSanctioning) {
                notifType = 'warning';
                notifMsg = `⚠️ HAS SIDO SANCIONADO. Tu reporte de ${report.type} fue rechazado. Razón: ${report.moderatorComment || 'Violación de normas'}. Se te han restado puntos y tienes una falta (Total: ${user.sanctions}/3).`;
            } else if (report.moderatorComment) {
                notifMsg += ` Comentario del Moderador: ${report.moderatorComment}`;
            }

            const notification = new Notification({
                userId: user._id,
                type: notifType,
                message: notifMsg,
                relatedReportId: report._id
            });
            await notification.save();

            // Send Email Notification
            sendReportStatusEmail(user.email, user.firstName, report.type, status, report.moderatorComment, isSanctioning)
                .catch(err => console.error("Could not send report status email:", err));

        }

        // Emit final status update to everyone
        const io = require('../socket').getIo();
        io.emit('report_status_updated', {
            reportId: report._id,
            status: report.status,
            wasSanctioned: report.wasSanctioned
        });

        res.json(report);
    } catch (err) {
        console.error("Error in moderation:", err);
        res.status(500).send('Server Error');
    }
});

// Lock report for moderation
router.put('/:id/lock', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        // If it's already in process and someone else has it
        if (report.status === 'In Process' && report.moderatorInCharge && report.moderatorInCharge.toString() !== req.user.id) {
            return res.status(409).json({
                msg: 'Report is already being reviewed by another moderator',
                moderatorInChargeName: report.moderatorInChargeName
            });
        }

        // Lock it
        report.status = 'In Process';
        report.moderatorInCharge = req.user.id;
        // Use username from req.user if available, otherwise just use 'Moderador'
        report.moderatorInChargeName = req.user.username || 'Moderador';
        await report.save();

        res.json(report);
    } catch (err) {
        console.error("Error locking report:", err);
        res.status(500).send('Server Error');
    }
});

// Unlock report
router.put('/:id/unlock', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        if (report.status === 'In Process' && report.moderatorInCharge && report.moderatorInCharge.toString() === req.user.id) {
            report.status = report.flags?.length >= 3 ? 'needs_review' : 'pending';
            report.moderatorInCharge = null;
            report.moderatorInChargeName = null;
            await report.save();
        }

        res.json(report);
    } catch (err) {
        console.error("Error unlocking report:", err);
        res.status(500).send('Server Error');
    }
});

// Flag report (community report)
router.post('/:id/flag', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Reporte no encontrado' });

        if (report.userId.toString() === req.user.id)
            return res.status(400).json({ msg: 'No puedes denunciar tu propio reporte.' });

        const alreadyFlagged = report.flags.some(f => (f.userId || f).toString() === req.user.id);
        if (alreadyFlagged)
            return res.status(400).json({ msg: 'Ya denunciaste este reporte.' });

        const { reason } = req.body;
        report.flags.push({ userId: req.user.id, reason: reason || 'Sin motivo especificado', createdAt: new Date() });

        if (report.flags.length >= 3 && report.status === 'approved') {
            report.status = 'needs_review';
            const io = require('../socket').getIo();
            io.emit('report_flagged', { reportId: report._id, status: 'needs_review', flagsCount: report.flags.length });
        }

        await report.save();
        res.json({ flagsCount: report.flags.length, status: report.status });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Clear all flags (moderator/admin only)
router.delete('/:id/flags', auth, async (req, res) => {
    try {
        if (!['moderator', 'admin'].includes(req.user.role))
            return res.status(403).json({ msg: 'No autorizado' });

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Reporte no encontrado' });

        report.flags = [];
        await report.save();
        res.json({ flags: [] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message });
    }
});

// Hide report (soft delete by user)
router.patch('/:id/hide', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Reporte no encontrado' });
        if (report.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'No autorizado' });
        }
        report.hiddenByUser = true;
        await report.save();
        res.json({ msg: 'Reporte ocultado correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
