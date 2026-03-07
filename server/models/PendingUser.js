const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    cedula: { type: String, required: true },
    birthProvince: { type: String, required: true },
    verificationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // 1 hour TTL
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);
