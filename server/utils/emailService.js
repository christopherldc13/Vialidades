require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

// Configuración del cliente OAuth2 de Google
const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// Establecer el Refresh Token desade las variables de entorno
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

/**
 * Función auxiliar: Envía correo usando la API REST de Gmail.
 * Esto evita el bloqueo de puertos SMTP (465/587) en plataformas como Render.
 */
async function enviarEmailViaAPI(opciones) {
    try {
        // Construir el asunto en formato UTF-8 Base64
        const asuntoUtf8 = `=?utf-8?B?${Buffer.from(opciones.subject).toString('base64')}?=`;

        // Construir el mensaje MIME estándar
        const mensajeRaw = [
            `From: ${opciones.from}`,
            `To: ${opciones.to}`,
            `Subject: ${asuntoUtf8}`,
            'Content-Type: text/html; charset="UTF-8"',
            'MIME-Version: 1.0',
            '',
            opciones.html,
        ].join('\r\n');

        // Codificar en Base64 URL-safe (requerido por la API de Gmail)
        const mensajeCodificado = Buffer.from(mensajeRaw)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Usar oAuth2Client.request que maneja automáticamente la renovación de access tokens
        const respuesta = await oAuth2Client.request({
            url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            method: 'POST',
            data: {
                raw: mensajeCodificado
            }
        });

        console.log(`Correo enviado vía API REST de Gmail ID: ${respuesta.data.id}`);
        return respuesta.data;
    } catch (error) {
        console.error('❌ Error enviando email vía API REST de Gmail:', error.message);
        if (error.response && error.response.data) {
            console.error('Detalle del error de Google:', JSON.stringify(error.response.data));
        }
        throw error;
    }
}

// El correo remitente (Gmail)
const CORREO_REMITENTE = process.env.EMAIL_USER || 'vialidades.transito@gmail.com';

/**
 * Generador de plantilla base profesional en español
 */
const obtenerPlantillaBase = (titulo, contenido, botonAccion = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { text-align: center; padding-bottom: 30px; border-bottom: 1px solid #f1f5f9; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 800; color: #6366f1; text-decoration: none; }
        h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 20px; }
        p { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 28px; background-color: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .footer { text-align: center; padding-top: 30px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 14px; margin-top: 30px; }
        .highlight { font-weight: 600; color: #1e293b; }
        .info-box { background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin-bottom: 24px; }
    </style>
</head>
<body>
    <div style="background-color: #f8fafc; padding: 20px 0;">
        <div class="container">
            <div class="header">
                <a href="#" class="logo">Vialidades</a>
            </div>
            <h1>${titulo}</h1>
            ${contenido}
            ${botonAccion}
            <div class="footer">
                <p style="margin: 0;">© ${new Date().getFullYear()} Vialidades. Todos los derechos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

/**
 * Enviar Correo de Bienvenida
 */
exports.sendWelcomeEmail = async (email, username, generatedPassword) => {
    try {
        const titulo = "¡Bienvenido a Vialidades!";
        const contenido = `
            <p>Hola <span class="highlight">${username}</span>,</p>
            <p>Gracias por unirte a la red de monitoreo ciudadano de vialidades.</p>
            <div class="info-box">
                <strong>Tus credenciales:</strong><br>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña:</strong> <span style="font-family: monospace;">${generatedPassword}</span></p>
            </div>
        `;
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const botonAccion = `
            <div class="btn-container">
                <a href="${FRONTEND_URL}/login" class="btn">Entrar al Portal</a>
            </div>
        `;

        const html = obtenerPlantillaBase(titulo, contenido, botonAccion);
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "¡Bienvenido a la comunidad!", html });
    } catch (error) {
        console.error("Error enviando email de bienvenida:", error);
        throw error;
    }
};

/**
 * Enviar Código de Verificación
 */
exports.sendVerificationEmail = async (email, firstName, code) => {
    try {
        const titulo = "Verifica tu cuenta";
        const contenido = `
            <p>Hola <span class="highlight">${firstName}</span>,</p>
            <div class="info-box" style="text-align: center;">
                <strong>Código de Verificación:</strong><br>
                <div style="font-size: 32px; font-weight: bold; color: #6366f1; margin: 15px 0;">${code}</div>
            </div>
        `;
        const html = obtenerPlantillaBase(titulo, contenido, '');
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Código de Verificación - Vialidades", html });
    } catch (error) {
        console.error("Error enviando email de verificación:", error);
        throw error;
    }
};

/**
 * Enviar Enlace de Recuperación de Contraseña
 */
exports.sendPasswordResetEmail = async (email, username, resetUrl) => {
    try {
        const titulo = "Recuperación de Contraseña";
        const contenido = `
            <p>Hola <span class="highlight">${username}</span>,</p>
            <p>Has solicitado restablecer tu contraseña. El enlace caduca en 1 hora por seguridad.</p>
        `;
        const botonAccion = `
            <div class="btn-container">
                <a href="${resetUrl}" class="btn">Restablecer Contraseña</a>
            </div>
        `;
        const html = obtenerPlantillaBase(titulo, contenido, botonAccion);
        await enviarEmailViaAPI({ from: `"Soporte Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Instrucciones de recuperación", html });
    } catch (error) {
        console.error("❌ ERROR API GMAIL en sendPasswordResetEmail:", error.message);
        throw error;
    }
};

/**
 * Enviar Notificación de Cambio de Estado de Reporte
 */
exports.sendReportStatusEmail = async (email, username, reportType, status, moderatorComment = '', isSanctioned = false) => {
    try {
        let titulo = "Actualización de Reporte";
        let estadoTxt = status === 'approved' ? 'Aprobado' : 'Rechazado';
        let colorEstado = status === 'approved' ? '#10b981' : '#ef4444';

        const contenido = `
            <p>Hola <span class="highlight">${username}</span>,</p>
            <p>Tu reporte de <strong>"${reportType}"</strong> ha sido ${estadoTxt}.</p>
            <p><strong>Comentario:</strong> ${moderatorComment}</p>
        `;
        const html = obtenerPlantillaBase(titulo, contenido, '');
        await enviarEmailViaAPI({ from: `"Moderación" <${CORREO_REMITENTE}>`, to: email, subject: `Vialidades: Reporte ${estadoTxt}`, html });
    } catch (error) {
        console.error("Error enviando email de estado de reporte:", error);
        throw error;
    }
};
