const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
    type: { type: String, enum: ['familiar', 'unauthorized'], required: true },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    requesterPhone: { type: String },
    requesterCedula: { type: String },
    relationship: { type: String },
    victimName: { type: String },
    reportId: { type: String },
    reportDescription: { type: String },
    reason: { type: String, required: true },
    caseNumber: { type: String, unique: true, sparse: true },
    status: {
        type: String,
        enum: ['pending', 'in_review', 'resolved', 'rejected'],
        default: 'pending'
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolution: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
