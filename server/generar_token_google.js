require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

/**
 * ESTE SCRIPT TE AYUDARÁ A GENERAR UN REFRESH TOKEN VÁLIDO.
 * 1. Asegúrate de que las variables GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET estén en tu archivo .env
 * 2. Ejecuta: node server/generar_token_google.js
 */

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Esto fuerza a que entregue un refresh token siempre
});

console.log('\n--- PASO 1: AUTORIZACIÓN ---');
console.log('Abre este enlace en tu navegador:\n', authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('\n--- PASO 2: CÓDIGO ---\nIntroduce el código que aparece después de autorizar (está en la URL): ', async (code) => {
    rl.close();
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        console.log('\n--- PASO 3: ÉXITO! ---');
        console.log('Añade esto a tu archivo .env y al panel de Render:');
        console.log('\nGOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('\n(Copia solo el texto de arriba)');
    } catch (error) {
        console.error('\nERROR: No se pudo obtener el token. Revisa tus claves en el .env');
        console.error(error.message);
    }
});
