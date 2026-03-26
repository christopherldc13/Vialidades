const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const { sendReportStatusEmail } = require('../utils/emailService');

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

// Create Report
router.post('/', auth, upload.array('media', 5), async (req, res) => {
    try {
        const { type, description, lat, lng, address } = req.body;
        const userId = req.user.id;

        if (!type || !description || !lat || !lng) {
            return res.status(400).json({ msg: 'Please enter all fields' });
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

        const newReport = new Report({
            userId,
            type,
            description,
            location: { lat, lng, address },
            media, // New field
            photos: media.filter(m => m.type === 'image'), // Backward compatibility
            status: 'pending'
        });

        const report = await newReport.save();
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
        } else if (['moderator', 'admin'].includes(req.user.role)) {
            // Global vs. Personalized logic
            if (status === 'pending') {
                query.status = 'pending';
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
            // Regular users ONLY see approved reports in the feed
            query.status = 'approved';
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
    const { status, moderatorComment } = req.body; // Ignore moderatorId from body, use req.user.id
    const Sanction = require('../models/Sanction'); // Import Sanction model
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
            report.moderatorComment = moderatorComment; // Store positive feedback if needed
            // Apply Automatic Face Blurring for Approved Reports
            let modified = false;
            // (Blur logic remains the same)
            if (report.media && report.media.length > 0) {
                report.media.forEach(item => {
                    if (item.type === 'image' && item.url.includes('/upload/')) {
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
            }
            if (report.photos && report.photos.length > 0) {
                report.photos.forEach(item => {
                    if (item.type === 'image' && item.url.includes('/upload/')) {
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
            }

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
            sendReportStatusEmail(user.email, user.username, report.type, status, report.moderatorComment, isSanctioning)
                .catch(err => console.error("Could not send report status email:", err));

        } else {
            console.log("[DEBUG] User not found for report:", report.userId);
        }

        res.json(report);
    } catch (err) {
        console.error("Error in moderation:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
