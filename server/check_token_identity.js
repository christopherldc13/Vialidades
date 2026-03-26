require('dotenv').config();
const https = require('https');
const querystring = require('querystring');

function checkToken() {
    const token = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log('--- TOKEN IDENTITY CHECK ---');
    if (!token || !clientId) {
        console.error('Missing token or clientId in .env');
        return;
    }

    const postData = querystring.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token,
        grant_type: 'refresh_token'
    });

    const options = {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const result = JSON.parse(data);
            if (result.error) {
                console.error('❌ REFRESH FAILED:', result.error_description || result.error);
                return;
            }

            const accessToken = result.access_token;
            
            // Now check tokeninfo
            https.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`, (res2) => {
                let data2 = '';
                res2.on('data', (chunk) => data2 += chunk);
                res2.on('end', () => {
                    const info = JSON.parse(data2);
                    console.log('✅ Token is VALID.');
                    console.log('📧 This token belongs to:', info.email);
                    console.log('🔑 Scopes:', info.scope);
                    
                    if (info.email !== process.env.EMAIL_USER) {
                        console.error('❌ MISMATCH DETECTED!');
                        console.error(`The token is for [${info.email}] but your .env EMAIL_USER is [${process.env.EMAIL_USER}]`);
                    } else {
                        console.log('✅ Match confirmed with EMAIL_USER.');
                    }
                });
            });
        });
    });

    req.on('error', (e) => console.error(e));
    req.write(postData);
    req.end();
}

checkToken();
