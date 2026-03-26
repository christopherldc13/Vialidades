require('dotenv').config();
const emailService = require('./utils/emailService');

async function testRestApi() {
    console.log('--- GMAIL REST API FINAL TEST ---');
    console.log('Target Email:', process.env.EMAIL_USER);

    try {
        console.log('Attempting to send a real test email via REST API...');
        // Using sendPasswordResetEmail as it's the one the user was testing
        await emailService.sendPasswordResetEmail(
            process.env.EMAIL_USER, 
            'TestUser', 
            'https://localhost:5173/reset-password/test-token'
        );
        console.log('✅ SUCCESS! Email sent via REST API (HTTPS).');
        console.log('Check your inbox (and spam folder) for "Instrucciones para restablecer tu contraseña".');
    } catch (error) {
        console.error('❌ FINAL TEST FAILED:');
        console.error(error);
    }
}

testRestApi();
