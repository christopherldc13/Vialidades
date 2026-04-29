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

const obtenerPlantillaBase = (tituloEs, tituloEn, contenidoEs, contenidoEn, botonAccion = '') => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>${tituloEs}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f6f7fb;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper { width: 100%; padding: 48px 16px; background-color: #f6f7fb; }
        .card {
            max-width: 540px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid #e8eaf0;
            overflow: hidden;
        }
        /* Accent bar at the top */
        .accent-bar {
            height: 3px;
            background: linear-gradient(90deg, #6366f1, #a78bfa);
        }
        /* Logo area */
        .logo-area {
            padding: 32px 48px 0 48px;
        }
        .logo-text {
            font-size: 17px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.3px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 7px;
        }
        .logo-dot {
            width: 7px; height: 7px;
            background: #6366f1;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
        }
        /* Body */
        .body { padding: 36px 48px 40px 48px; }
        h1 {
            font-size: 22px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 20px 0;
            line-height: 1.3;
            letter-spacing: -0.4px;
        }
        p {
            font-size: 15px;
            line-height: 1.75;
            color: #4b5563;
            margin: 0 0 12px 0;
        }
        .btn-wrap { margin: 28px 0 8px 0; }
        .btn {
            display: inline-block;
            background-color: #6366f1;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 8px;
            letter-spacing: 0.1px;
        }
        /* Divider */
        .divider { border: none; border-top: 1px solid #f0f1f5; margin: 32px 0; }
        /* EN section */
        .en-label {
            display: block;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #c0c4d0;
            margin-bottom: 10px;
        }
        .en-title {
            font-size: 15px;
            font-weight: 600;
            color: #9ca3af;
            margin: 0 0 8px 0;
        }
        .en-body p { color: #c0c4d0; font-size: 13.5px; line-height: 1.65; }
        /* Footer */
        .footer {
            padding: 20px 48px;
            border-top: 1px solid #f0f1f5;
            text-align: center;
        }
        .footer p { font-size: 11.5px; color: #c0c4d0; line-height: 1.6; margin: 0 0 3px 0; }
        .footer-brand { color: #6366f1; font-weight: 600; }

        @media (prefers-color-scheme: dark) {
            body, .wrapper { background-color: #0e0e14 !important; }
            .card { background: #15151f !important; border-color: #25253a !important; }
            .logo-text { color: #e0e0f0 !important; }
            h1 { color: #e0e0f0 !important; }
            p { color: #9090b8 !important; }
            .divider { border-color: #22223a !important; }
            .en-body p { color: #50507a !important; }
            .en-label { color: #40405a !important; }
            .en-title { color: #606090 !important; }
            .footer { border-color: #22223a !important; }
            .footer p { color: #40405a !important; }
        }
        @media (max-width: 600px) {
            .wrapper { padding: 20px 12px !important; }
            .logo-area { padding: 24px 28px 0 28px !important; }
            .body { padding: 24px 28px 28px 28px !important; }
            .footer { padding: 18px 28px !important; }
            h1 { font-size: 20px !important; }
        }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="card">
        <div class="accent-bar"></div>

        <div class="logo-area">
            <a href="#" class="logo-text">
                <span class="logo-dot"></span>
                Vialidades
            </a>
        </div>

        <div class="body">
            <h1>${tituloEs}</h1>
            <div class="es-body">${contenidoEs}</div>
            ${botonAccion ? `<div class="btn-wrap">${botonAccion}</div>` : ''}

            <hr class="divider">

            <span class="en-label">English</span>
            <h2 class="en-title">${tituloEn}</h2>
            <div class="en-body">${contenidoEn}</div>
        </div>

        <div class="footer">
            <p><span class="footer-brand">Vialidades</span> · Infraestructura y Seguridad Vial</p>
            <p>Mensaje automático · Automated message &nbsp;·&nbsp; © ${new Date().getFullYear()} Vialidades Dominicana</p>
        </div>
    </div>
</div>
</body>
</html>
`;

exports.sendPasswordResetEmail = async (email, firstName, resetUrl) => {
    try {
        const tituloEs = "Restablece tu contraseña";
        const tituloEn = "Reset your password";
        const contenidoEs = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Vialidades. Haz clic en el botón para crear una nueva clave segura.</p>
            <p style="font-size:13px;color:#9ca3af;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
        `;
        const contenidoEn = `
            <p>Hello <strong>${firstName}</strong>,</p>
            <p>We received a request to reset your Vialidades account password. Click the button above to create a new secure password.</p>
            <p style="font-size:13px;color:#9ca3af;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        `;
        const botonAccion = `<a href="${resetUrl}" class="btn">Restablecer Contraseña / Reset Password</a>`;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, botonAccion);
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Restablecer contraseña | Reset password", html });
    } catch (error) { console.error("Error envío reset email:", error); throw error; }
};

exports.sendVerificationEmail = async (email, firstName, code) => {
    try {
        const tituloEs = "Verifica tu cuenta";
        const tituloEn = "Verify your account";
        const contenidoEs = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Usa el siguiente código para activar tu perfil en Vialidades:</p>
            <div style="margin:28px 0;text-align:center;">
                <div style="display:inline-block;background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:16px;padding:20px 40px;">
                    <span style="font-size:38px;font-weight:800;color:#4f46e5;letter-spacing:10px;font-family:monospace;">${code}</span>
                </div>
            </div>
            <p style="font-size:13px;color:#9ca3af;">Este código expira en pocos minutos. No lo compartas con nadie.</p>
        `;
        const contenidoEn = `
            <p>Hello <strong>${firstName}</strong>,</p>
            <p>Use the code above to activate your Vialidades profile. Do not share this code with anyone.</p>
        `;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Código de Verificación | Verification Code", html });
    } catch (error) { console.error("Error envío verificación:", error); throw error; }
};

exports.sendWelcomeEmail = async (email, firstName, generatedPassword) => {
    try {
        const tituloEs = `¡Bienvenido, ${firstName}!`;
        const tituloEn = `Welcome, ${firstName}!`;
        const contenidoEs = `
            <p>Tu cuenta en <strong>Vialidades</strong> ha sido creada exitosamente por un administrador.</p>
            <p>Aquí están tus credenciales de acceso:</p>
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px 24px;margin:20px 0;">
                <p style="margin:0 0 8px 0;font-size:14px;color:#6d28d9;font-weight:600;">Tus credenciales</p>
                <p style="margin:0 0 6px 0;font-size:14px;color:#374151;"><strong>Email:</strong> ${email}</p>
                <p style="margin:0;font-size:14px;color:#374151;"><strong>Contraseña temporal:</strong> <code style="background:#ede9fe;padding:2px 8px;border-radius:6px;font-family:monospace;color:#6d28d9;">${generatedPassword}</code></p>
            </div>
            <p style="font-size:13px;color:#9ca3af;">Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
        `;
        const contenidoEn = `
            <p>Your <strong>Vialidades</strong> account was successfully created. Use the credentials above to log in. We recommend changing your password after your first login.</p>
        `;
        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vialidades-1.onrender.com';
        const botonAccion = `<a href="${FRONTEND_URL}/login" class="btn">Iniciar Sesión / Login</a>`;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, botonAccion);
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "¡Bienvenido! | Welcome!", html });
    } catch (error) { console.error("Error envío bienvenida:", error); throw error; }
};

exports.sendReportStatusEmail = async (email, firstName, reportType, status, moderatorComment = '') => {
    try {
        const approved = status === 'approved';
        const tituloEs = approved ? "Tu reporte fue aprobado ✓" : "Actualización de tu reporte";
        const tituloEn = approved ? "Your report was approved ✓" : "Your report has been updated";

        const statusBadge = approved
            ? `<div style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;padding:4px 14px;border-radius:999px;margin-bottom:16px;">✓ Aprobado</div>`
            : `<div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 14px;border-radius:999px;margin-bottom:16px;">⚠ Revisado</div>`;

        const contenidoEs = `
            <p>Hola <strong>${firstName}</strong>,</p>
            ${statusBadge}
            <p>Tu reporte sobre <strong>"${reportType}"</strong> ha sido ${approved ? 'revisado y <strong>aprobado</strong> por nuestro equipo de moderación' : 'revisado por nuestro equipo de moderación'}.</p>
            ${moderatorComment ? `
            <div style="background:#f8f9fc;border-left:3px solid #6366f1;border-radius:0 10px 10px 0;padding:14px 18px;margin:20px 0;">
                <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Nota del moderador</p>
                <p style="margin:0;font-size:14px;color:#374151;">${moderatorComment}</p>
            </div>` : ''}
            <p style="font-size:13px;color:#9ca3af;">Gracias por contribuir a mejorar la seguridad vial en tu comunidad.</p>
        `;
        const contenidoEn = `
            <p>Hello <strong>${firstName}</strong>,</p>
            <p>Your report regarding <strong>"${reportType}"</strong> has been ${approved ? 'approved' : 'reviewed'} by our moderation team.</p>
            ${moderatorComment ? `<p><em>Moderator note: ${moderatorComment}</em></p>` : ''}
        `;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Estado de tu reporte | Report status", html });
    } catch (error) { console.error("Error envío estado reporte:", error); }
};
