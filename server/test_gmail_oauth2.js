require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmail() {
    console.log('--- GMAIL OAUTH2 TEST ---');
    console.log('USER:', process.env.EMAIL_USER);
    console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'OK' : 'MISSING');
    console.log('REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'OK' : 'MISSING');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN
        }
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ Success! The credentials are valid.');
        
        console.log('Attempting to send a test email to yourself...');
        const result = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Vialidades - Test Gmail API',
            text: 'Si recibes esto, la configuración de Gmail API es correcta.'
        });
        console.log('✅ Email sent! Message ID:', result.messageId);
    } catch (error) {
        console.error('❌ FAILED:');
        if (error.response) console.error('Google Response:', error.response);
        console.error('Error Details:', error);
    }
}

testGmail();
