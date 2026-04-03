require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

async function enviarEmailViaAPI(opciones) {
    try {
        const asuntoUtf8 = `=?utf-8?B?${Buffer.from(opciones.subject).toString('base64')}?=`;
        const mensajeRaw = [`From: ${opciones.from}`, `To: ${opciones.to}`, `Subject: ${asuntoUtf8}`, 'Content-Type: text/html; charset="UTF-8"', 'MIME-Version: 1.0', '', opciones.html].join('\r\n');
        const mensajeCodificado = Buffer.from(mensajeRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const respuesta = await oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', method: 'POST', data: { raw: mensajeCodificado } });
        return respuesta.data;
    } catch (error) {
        console.error('❌ Error enviando email:', error.message);
        throw error;
    }
}

const CORREO_REMITENTE = process.env.EMAIL_USER || 'vialidades.transito@gmail.com';

/**
 * Plantilla Estilo Corporativo Minimalista (v5)
 * Incluye divisor sutil entre idiomas.
 */
const obtenerPlantillaBase = (tituloEs, tituloEn, contenidoEs, contenidoEn, botonAccion = '') => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #ffffff; color: #111827; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .main-wrapper { width: 100%; table-layout: fixed; background-color: #ffffff; padding-bottom: 40px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { padding: 40px 0 20px 0; text-align: left; }
        .logo-text { font-size: 20px; font-weight: 700; color: #000000; letter-spacing: -0.5px; text-decoration: none; text-transform: uppercase; }
        .content { padding: 20px 0; border-top: 1px solid #f3f4f6; }
        h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0; line-height: 1.2; }
        p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 24px 0; }
        
        .btn-wrapper { margin: 32px 0; }
        .btn { background-color: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; display: inline-block; }
        
        .divider { height: 1px; background-color: #f3f4f6; margin: 48px 0; border: none; }
        .eng-text { color: #6b7280; font-size: 15px; }

        .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px; line-height: 1.5; }

        /* Dark Mode support */
        @media (prefers-color-scheme: dark) {
            body, .main-wrapper, .container { background-color: #000000 !important; color: #f9fafb !important; }
            h1, .logo-text { color: #ffffff !important; }
            p, .eng-text { color: #d1d5db !important; }
            .btn { background-color: #ffffff !important; color: #000000 !important; }
            .content, .divider, .footer { border-color: #1f2937 !important; background-color: #1f2937 !important; }
        }
    </style>
</head>
<body>
    <div class="main-wrapper">
        <center>
            <div class="container">
                <div class="header">
                    <a href="#" class="logo-text">Vialidades</a>
                </div>
                
                <div class="content">
                    <h1>${tituloEs}</h1>
                    <div class="spanish-body">
                        ${contenidoEs}
                    </div>

                    ${botonAccion ? `<div class="btn-wrapper">${botonAccion}</div>` : ''}

                    <hr class="divider">

                    <div class="eng-text">
                        <h2 style="font-size: 18px; color: inherit; margin: 0 0 12px 0;">${tituloEn}</h2>
                        ${contenidoEn}
                    </div>
                </div>

                <div class="footer">
                    <p>Vialidades. Infraestructura y Seguridad Vial.<br>
                    Este es un mensaje automático encargado por el sistema de seguridad.<br>
                    This is an automated message requested by the security system.</p>
                    <p>© ${new Date().getFullYear()} Vialidades Dominicana. All rights reserved.</p>
                </div>
            </div>
        </center>
    </div>
</body>
</html>
`;

exports.sendPasswordResetEmail = async (email, firstName, resetUrl) => {
    try {
        const tituloEs = "Restablece tu contraseña";
        const tituloEn = "Reset your password";
        const contenidoEs = `<p>Hola ${firstName},</p><p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para crear una nueva clave segura.</p>`;
        const contenidoEn = `<p>Hello ${firstName},</p><p>We received a request to reset the password for your account. Click the button below to create a new secure password.</p>`;
        const botonAccion = `<a href="${resetUrl}" class="btn">Restablecer Contraseña / Reset Password</a>`;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, botonAccion);
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Restablecer contraseña | Reset password", html });
    } catch (error) { console.error("Error envío reset email:", error); throw error; }
};

exports.sendVerificationEmail = async (email, firstName, code) => {
    try {
        const tituloEs = "Verifica tu cuenta";
        const tituloEn = "Verify your account";
        const contenidoEs = `<p>Hola ${firstName},</p><p>Tu código de seguridad para activar tu perfil en Vialidades es:</p><div style="font-size: 32px; font-weight: 700; color: #2563eb; letter-spacing: 4px; margin: 24px 0;">${code}</div>`;
        const contenidoEn = `<p>Hello ${firstName},</p><p>Your security code to activate your Vialidades profile is:</p>`;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Código de Verificación | Verification Code", html });
    } catch (error) { console.error("Error envío verificación:", error); throw error; }
};

exports.sendWelcomeEmail = async (email, firstName, generatedPassword) => {
    try {
        const tituloEs = "¡Bienvenido a Vialidades!";
        const tituloEn = "Welcome to Vialidades!";
        const contenidoEs = `<p>Hola ${firstName},</p><p>Tu cuenta ha sido creada exitosamente. Aquí tienes tus credenciales temporales:</p><p><strong>Email:</strong> ${email}<br><strong>Clave:</strong> ${generatedPassword}</p>`;
        const contenidoEn = `<p>Hello ${firstName},</p><p>Your account has been created successfully. You can now login using the credentials above.</p>`;
        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vialidades-1.onrender.com';
        const botonAccion = `<a href="${FRONTEND_URL}/login" class="btn">Iniciar Sesión / Login</a>`;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, botonAccion);
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "¡Bienvenido! | Welcome!", html });
    } catch (error) { console.error("Error envío bienvenida:", error); throw error; }
};

exports.sendReportStatusEmail = async (email, firstName, reportType, status, moderatorComment = '') => {
    try {
        const approved = status === 'approved';
        const tituloEs = approved ? "Reporte Aprobado" : "Actualización de Reporte";
        const tituloEn = approved ? "Report Approved" : "Report Update";
        const contenidoEs = `<p>Hola ${firstName},</p><p>Tu reporte sobre <strong>"${reportType}"</strong> ha sido ${approved ? 'aprobado' : 'revisado'}.</p>${moderatorComment ? `<p><em>Nota del moderador: ${moderatorComment}</em></p>` : ''}`;
        const contenidoEn = `<p>Hello ${firstName},</p><p>Your report regarding <strong>"${reportType}"</strong> has been ${approved ? 'approved' : 'reviewed'}.</p>`;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Estado de tu reporte | Report status", html });
    } catch (error) { console.error("Error envío estado reporte:", error); }
};
