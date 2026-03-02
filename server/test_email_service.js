const emailService = require('./utils/emailService');
const nodemailer = require('nodemailer');

const run = async () => {
    try {
        console.log("Testing transporter verification...");
        // Since getTransporter isn't exported, we can just send an email with bad address or mock something.
        // Or wait, let's just make getTransporter trigger by calling a function, but without awaiting the whole send?
        // Actually it's easier: just call the function with a dummy email like 'test@example.com'.
        // Wait, sendWelcomeEmail catches errors and logs them.
        console.log("Attempting to send a dummy welcome email...");
        await emailService.sendWelcomeEmail('test-vialidades123@yopmail.com', 'TestUser');
        console.log("Done checking.");
    } catch (e) {
        console.error("Test failed:", e);
    }
};

run();
