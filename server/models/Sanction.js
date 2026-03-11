const mongoose = require('mongoose');

const SanctionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    expiresAt: { type: Date }, // If null, it's permanent
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sanction', SanctionSchema);
