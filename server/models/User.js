const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    cedula: { type: String, required: true },
    birthProvince: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    reputation: { type: Number, default: 0 },
    sanctions: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
