const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();
const User = require('./models/User');
const dns = require('dns');

// Fix for DNS SRV lookup failures
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.error('Failed to set DNS servers:', e);
}

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('creation_log.txt', msg + '\n');
};

const createAdmin = async () => {
    try {
        log('Starting admin creation process...');
        log('Connecting to MongoDB...');
        log(`URI: ${process.env.MONGO_URI}`); // CAREFUL WITH LOGGING SECRETS, BUT DEBUGGING

        await mongoose.connect(process.env.MONGO_URI);
        log('MongoDB Connected Successfully');

        // Check if user already exists
        let user = await User.findOne({ email: 'admin@vialidades.com' });
        if (user) {
            log('User already exists in DB');
            // Force update password just in case
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('adminpassword123', salt);
            user.role = 'admin';
            user.reputation = 999;
            await user.save();
            log('Existing user updated with new password and admin role.');
        } else {
            user = new User({
                username: 'Admin',
                email: 'admin@vialidades.com',
                password: 'adminpassword123',
                role: 'admin',
                reputation: 999
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('adminpassword123', salt);

            await user.save();
            log('New Admin user created successfully');
        }

        log('Process completed.');
        process.exit();
    } catch (err) {
        log('ERROR: ' + err.message);
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
