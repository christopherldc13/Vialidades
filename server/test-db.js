const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Force Google DNS
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('DNS set to 8.8.8.8');
} catch (e) { console.log('DNS set failed', e); }

const uri = process.env.MONGO_URI;
console.log('Testing Connection to:', uri);

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    family: 4
})
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully!');
        try {
            const testSchema = new mongoose.Schema({ name: String });
            // Use a different collection name to avoid conflicts preferably, but 'tests' is fine
            const Test = mongoose.model('Test', testSchema);
            await Test.create({ name: 'Connection Test ' + Date.now() });
            console.log('✅ Data Insertion Successful!');
            process.exit(0);
        } catch (err) {
            console.error('❌ Insertion Failed:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('❌ Connection Failed:', err);
        process.exit(1);
    });
