const mongoose = require('mongoose');
const User = require('./server/models/User'); // Adjusted path assuming script is in root but models in server/models
const Report = require('./server/models/Report');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Create a dummy user
        const testUser = new User({
            username: 'reputationtest_' + Date.now(),
            email: 'test_' + Date.now() + '@example.com',
            password: 'password123',
            reputation: 100,
            sanctions: 0
        });
        await testUser.save();
        console.log("Created user:", testUser.username, "Reputation:", testUser.reputation);

        // 2. Create a dummy report
        const testReport = new Report({
            userId: testUser._id,
            type: 'Traffic',
            description: 'Test report for sanction',
            location: { lat: 0, lng: 0, address: 'Test St' },
            status: 'pending'
        });
        await testReport.save();
        console.log("Created report:", testReport._id);

        // 3. Call the moderate endpoint (assuming server is running on localhost:5000)
        // We need the server to be running for this test to hit the endpoint logic completely,
        // OR we can simulate the logic directly if we just want to test the db flow.
        // But since we want to test the route logic, let's assume we can't easily hit localhost if not running.
        // I'll simulate the route logic directly here to see if *that* works.

        console.log("Simulating route logic...");
        const status = 'rejected';
        const sanctionUser = true;
        const rejectionReason = 'Test sanction';

        // LOGIC FROM reports.js
        testReport.status = status;
        testReport.rejectionReason = rejectionReason;
        testReport.wasSanctioned = true;
        await testReport.save();

        const userToCheck = await User.findById(testReport.userId);
        if (userToCheck) {
            if (status === 'rejected') {
                if (sanctionUser) {
                    userToCheck.sanctions = (userToCheck.sanctions || 0) + 1;
                    userToCheck.reputation -= 25;
                }
            }
            await userToCheck.save();
        }

        // 4. Verify
        const finalUser = await User.findById(testUser._id);
        console.log("Final User Reputation:", finalUser.reputation);
        console.log("Final User Sanctions:", finalUser.sanctions);

        if (finalUser.reputation === 75 && finalUser.sanctions === 1) {
            console.log("SUCCESS: Logic works in isolation.");
        } else {
            console.log("FAILURE: Logic failed in isolation.");
        }

        // Clean up
        await User.findByIdAndDelete(testUser._id);
        await Report.findByIdAndDelete(testReport._id);

        mongoose.disconnect();

    } catch (err) {
        console.error(err);
    }
}

run();
