require('dotenv').config();
const nodemailer = require('nodemailer');

const run = async () => {
    console.log("USER:", process.env.EMAIL_USER);
    console.log("PASS:", process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await transporter.verify();
        console.log("Transporter verified successfully");
    } catch (e) {
        console.error("Transporter verify failed:", e);
    }
};

run();
