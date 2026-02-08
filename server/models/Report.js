const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // e.g., 'Accident', 'Traffic', 'Violation'
    description: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String }
    },
    photos: [{
        url: { type: String, required: true },
        metadata: { type: Object } // Store exif data here
    }],
    media: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], default: 'image' },
        public_id: { type: String }
    }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
