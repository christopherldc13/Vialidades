const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// No manual DNS overrides - let Render handle its own name resolution

dotenv.config({ path: path.join(__dirname, '../.env') });

// Fix for MongoDB DNS/SRV issues in some networks
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('DNS override set to Google 8.8.8.8');
} catch (e) {
    console.log('DNS override failed, using system default.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
    console.log(`[HTTP IN] ${req.method} ${req.url}`);
    next();
});
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/ai', require('./routes/ai'));

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Force IPv4
})
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        console.error('Explanation: Unable to connect to MongoDB Atlas. This is likely due to a firewall or DNS blocking the connection.');
    });

// Development API root check (optional, but better scoped)
if (process.env.NODE_ENV !== 'production') {
    app.get('/', (req, res) => {
        res.send('Vialidades API Running');
    });
}

// Global Error Handler for Multer / Cloudinary / Express Unhandled Rejections
app.use((err, req, res, next) => {
    console.error('🔥 GLOBAL EXACT ERROR OBJECT CAUGHT:');
    try {
        console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch (e) {
        console.error(err);
    }
    res.status(500).json({
        msg: 'Error interno del servidor capturado globalmente',
        error: err.message || err.name || 'Error Desconocido'
    });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
