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

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
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
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi'],
            transformation: isVideo ? [] : [{ width: 1000, crop: "limit" }] // Optimize images only
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
                // Determine type from file (Cloudinary storage adds this info or we infer from mimetype)
                const isVideo = file.mimetype.startsWith('video/');
                media.push({
                    url: file.path, // Cloudinary URL
                    type: isVideo ? 'video' : 'image',
                    public_id: file.filename
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
            // Default to approved if no status provided, but allow overriding
            if (status === 'all') {
                // Do not filter by status, return everything
            } else if (status === 'sanctioned') {
                query.wasSanctioned = true;
            } else if (status === 'rejected') {
                // EXCLUDE sanctioned reports from the 'rejected' tab to keep them distinct
                query.status = 'rejected';
                query.wasSanctioned = { $ne: true };
            } else if (status) {
                query.status = status;
            } else {
                query.status = 'approved';
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

// Moderate Report
router.patch('/:id/moderate', async (req, res) => {
    const { status, rejectionReason, moderatorId } = req.body;
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
        if (status === 'rejected') {
            report.rejectionReason = rejectionReason;
            if (isSanctioning) {
                report.wasSanctioned = true;
            }
        } else if (status === 'approved') {
            // Apply Automatic Face Blurring for Approved Reports
            let modified = false;
            if (report.media && report.media.length > 0) {
                report.media.forEach(item => {
                    if (item.type === 'image' && item.url.includes('/upload/') && !item.url.includes('/e_blur_faces/')) {
                        item.url = item.url.replace('/upload/', '/upload/e_blur_faces/');
                        modified = true;
                    }
                });
            }
            if (report.photos && report.photos.length > 0) {
                report.photos.forEach(item => {
                    if (item.type === 'image' && item.url.includes('/upload/') && !item.url.includes('/e_blur_faces/')) {
                        item.url = item.url.replace('/upload/', '/upload/e_blur_faces/');
                        modified = true;
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

            if (status === 'approved') {
                user.reputation += 5;
                if (user.reputation > 100) user.reputation = 100;
            } else if (status === 'rejected') {
                if (isSanctioning) {
                    if (!report.rejectionReason && !req.body.rejectionReason) {
                        // Ideally we should validate this before, but let's ensure we save it
                    }
                    user.sanctions = (user.sanctions || 0) + 1;
                    user.reputation -= 25; // Sanction penalty
                    console.log(`[DEBUG] Applied Sanction. New Rep=${user.reputation}, New Sanctions=${user.sanctions}`);
                } else {
                    user.reputation -= 1; // Normal rejection penalty
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
                notifMsg = `⚠️ HAS SIDO SANCIONADO. Tu reporte de ${report.type} fue rechazado. Razón: ${rejectionReason || 'Violación de normas'}. Se te han restado puntos y tienes una falta (Total: ${user.sanctions}/3).`;
            } else if (status === 'rejected' && rejectionReason) {
                notifMsg += ` Razón: ${rejectionReason}`;
            }

            const notification = new Notification({
                userId: user._id,
                type: notifType,
                message: notifMsg,
                relatedReportId: report._id
            });
            await notification.save();
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
