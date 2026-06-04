const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const User = require('./models/User');

try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}


const EMAIL    = 'c88014392@gmail.com';
const PASSWORD = 'Supermod2026!';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB conectado');

        let user = await User.findOne({ email: EMAIL });

        if (user) {
            // Si ya existe, solo actualizar el rol
            user.role = 'supermoderador';
            user.isVerified = true;
            user.isActive = true;
            await user.save({ validateBeforeSave: false });
            console.log(`✅ Usuario existente actualizado a supermoderador: ${EMAIL}`);
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(PASSWORD, salt);

            user = new User({
                username:      'SuperMod',
                email:         EMAIL,
                password:      hashed,
                firstName:     'Super',
                lastName:      'Moderador',
                birthDate:     new Date('1990-01-01'),
                gender:        'M',
                phone:         '8090000000',
                cedula:        '000-0000000-0',
                birthProvince: 'Distrito Nacional',
                role:          'supermoderador',
                isVerified:    true,
                isActive:      true,
                reputation:    100
            });

            await user.save();
            console.log(`✅ Supermoderador creado exitosamente`);
        }

        console.log(`📧 Email:      ${EMAIL}`);
        console.log(`🔑 Contraseña: ${PASSWORD}`);
        console.log(`🛡️  Rol:        supermoderador`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

run();
