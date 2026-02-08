const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Fix for DNS SRV lookup failures (ECONNREFUSED) on some networks
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google DNS
    console.log('DNS Servers set to Google DNS (8.8.8.8)');
} catch (e) {
    console.error('Failed to set DNS servers:', e);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

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

app.get('/', (req, res) => {
    res.send('Vialidades API Running');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
