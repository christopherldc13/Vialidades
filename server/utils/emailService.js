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
            .digit-box { background-color: #1e1e2d !important; border-color: #5b21b6 !important; color: #d8b4fe !important; }
            .code-label { color: #c4b5fd !important; }
            .warning-box { background-color: #271710 !important; border-color: #5c2410 !important; }
            .warning-text { color: #fdba74 !important; }
        }
        
        /* Verification Code specific */
        .digit-box {
            width: 46px; height: 58px;
            background-color: #f5f3ff;
            border: 2px solid #c4b5fd;
            border-radius: 12px;
            text-align: center;
            line-height: 58px;
            font-size: 28px;
            font-weight: 800;
            color: #4f46e5;
            font-family: 'Courier New', Courier, monospace;
            display: inline-block;
        }
        .code-label {
            margin: 0 0 14px 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: #8b5cf6;
        }
        .warning-box {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 8px;
        }
        .warning-text {
            margin: 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.6;
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
            <p style="margin:0 0 6px 0;">Hola <strong>${firstName}</strong>,</p>
            <p style="margin:0 0 24px 0;">Ingresa este código en la aplicación para verificar tu cuenta en <strong>Vialidades</strong>. Es válido por <strong>10 minutos</strong>.</p>

            <p class="code-label" style="text-align:center;">Tu código de verificación</p>
            <div style="background:#f5f3ff;border:2px solid #c4b5fd;border-radius:16px;padding:22px 16px;text-align:center;margin:0 0 24px 0;">
                <span style="font-size:28px;font-weight:800;color:#4f46e5;letter-spacing:10px;font-family:'Courier New',Courier,monospace;">${code}</span>
            </div>

            <div class="warning-box">
                <p class="warning-text">⚠️ Nunca compartas este código con nadie. Vialidades <strong>nunca</strong> te pedirá este código por teléfono o chat.</p>
            </div>
        `;
        const contenidoEn = `
            <p style="margin:0 0 6px 0;">Hello <strong>${firstName}</strong>,</p>
            <p style="margin:0;">Use the code above to verify your Vialidades account. It expires in 10 minutes. Never share it with anyone — Vialidades will never ask for it.</p>
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

const REPORT_TYPE_ES = {
    Traffic:   'Tráfico Pesado',
    Accident:  'Accidente',
    Violation: 'Infracción de Tránsito',
    Hazard:    'Peligro en la Vía',
};

exports.sendContentViolationEmail = async (email, firstName, reasons, totalSanctions) => {
    try {
        const tituloEs = '⚠️ Sanción por contenido inapropiado';
        const tituloEn = '⚠️ Sanction for inappropriate content';

        const isPermanent = totalSanctions >= 3;
        const sanctionDuration = totalSanctions === 1 ? '24 horas' : totalSanctions === 2 ? '48 horas' : 'permanente';

        const contenidoEs = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:16px 0;">
                <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;">Tu reporte fue rechazado automáticamente</p>
                <p style="margin:8px 0 0 0;font-size:13px;color:#b91c1c;">
                    El sistema detectó <strong>${reasons.join(', ')}</strong> en las imágenes adjuntas.
                </p>
            </div>
            <p>Subir contenido inapropiado o sensible está estrictamente prohibido en <strong>Vialidades</strong>. Como resultado:</p>
            <ul style="padding-left:20px;color:#4b5563;font-size:14px;line-height:2;">
                <li>Tu reporte fue <strong>rechazado</strong> y no será visible en la plataforma.</li>
                <li>Se aplicó una <strong>sanción</strong> a tu cuenta (${totalSanctions}/3).</li>
                <li>Tu reputación ha sido <strong>reducida</strong>.</li>
                ${!isPermanent ? `<li>Tienes una restricción de <strong>${sanctionDuration}</strong> para publicar.</li>` : `<li>Tu cuenta ha sido <strong>inhabilitada permanentemente</strong> para publicar reportes.</li>`}
            </ul>
            <p style="font-size:13px;color:#9ca3af;margin-top:16px;">
                Si crees que esto fue un error, puedes contactarnos respondiendo este correo.
                Recuerda que acumular 3 sanciones resulta en la suspensión permanente de tu cuenta.
            </p>
        `;
        const contenidoEn = `
            <p>Hello <strong>${firstName}</strong>,</p>
            <p>Your report was automatically rejected because our system detected <strong>${reasons.join(', ')}</strong> in the attached images.
            A sanction has been applied to your account (${totalSanctions}/3). Accumulating 3 sanctions results in a permanent account suspension.</p>
        `;

        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({
            from: `"Vialidades" <${CORREO_REMITENTE}>`,
            to: email,
            subject: '⚠️ Sanción aplicada | Sanction applied',
            html
        });
    } catch (error) { console.error('Error envío email sanción:', error); }
};

exports.sendReportStatusEmail = async (email, firstName, reportType, status, moderatorComment = '') => {
    try {
        const approved = status === 'approved';
        const reportTypeEs = REPORT_TYPE_ES[reportType] || reportType;
        const tituloEs = approved ? "Tu reporte fue aprobado ✓" : "Actualización de tu reporte";
        const tituloEn = approved ? "Your report was approved ✓" : "Your report has been updated";

        const statusBadge = approved
            ? `<div style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;padding:4px 14px;border-radius:999px;margin-bottom:16px;">✓ Aprobado</div>`
            : `<div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 14px;border-radius:999px;margin-bottom:16px;">⚠ Revisado</div>`;

        const contenidoEs = `
            <p>Hola <strong>${firstName}</strong>,</p>
            ${statusBadge}
            <p>Tu reporte sobre <strong>"${reportTypeEs}"</strong> ha sido ${approved ? 'revisado y <strong>aprobado</strong> por nuestro equipo de moderación' : 'revisado por nuestro equipo de moderación'}.</p>
            ${moderatorComment ? `
            <div style="background:#f8f9fc;border-left:3px solid #6366f1;border-radius:0 10px 10px 0;padding:14px 18px;margin:20px 0;">
                <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Nota del moderador</p>
                <p style="margin:0;font-size:14px;color:#374151;">${moderatorComment}</p>
            </div>` : ''}
            <p style="font-size:13px;color:#9ca3af;">Gracias por contribuir a mejorar la seguridad vial en tu comunidad.</p>
        `;
        const contenidoEn = `
            <p>Hello <strong>${firstName}</strong>,</p>
            <p>Your report regarding <strong>"${reportTypeEs}"</strong> has been ${approved ? 'approved' : 'reviewed'} by our moderation team.</p>
            ${moderatorComment ? `<p><em>Moderator note: ${moderatorComment}</em></p>` : ''}
        `;
        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({ from: `"Vialidades" <${CORREO_REMITENTE}>`, to: email, subject: "Estado de tu reporte | Report status", html });
    } catch (error) { console.error("Error envío estado reporte:", error); }
};

exports.sendSupportStatusUpdate = async (email, data) => {
    try {
        const { requesterName, caseNumber, type, status, resolution } = data;

        const typeLabel = type === 'familiar'
            ? 'Solicitud de Familiar — Ley 192-19'
            : 'Contenido No Autorizado — Ley 172-13';

        const STATUS_META = {
            in_review: {
                subject: `🔍 Tu caso ${caseNumber} está siendo revisado`,
                titleEs: 'Tu solicitud está En Revisión',
                titleEn: 'Your request is under review',
                color: '#f59e0b',
                bgColor: '#fffbeb',
                borderColor: '#fde68a',
                badgeText: 'En Revisión',
                msgEs: `Nuestro equipo de moderación ha comenzado a revisar tu caso. Te notificaremos por este correo cuando haya una respuesta final.`,
                msgEn: `Our moderation team has started reviewing your case. We will notify you by email when there is a final response.`,
            },
            resolved: {
                subject: `✅ Tu caso ${caseNumber} ha sido resuelto`,
                titleEs: 'Tu solicitud fue Resuelta',
                titleEn: 'Your request has been resolved',
                color: '#10b981',
                bgColor: '#f0fdf4',
                borderColor: '#bbf7d0',
                badgeText: 'Resuelta',
                msgEs: `Nos complace informarte que tu solicitud ha sido procesada y resuelta por nuestro equipo de moderación.`,
                msgEn: `We are pleased to inform you that your request has been processed and resolved by our moderation team.`,
            },
            rejected: {
                subject: `❌ Tu caso ${caseNumber} no pudo ser procesado`,
                titleEs: 'Tu solicitud fue Rechazada',
                titleEn: 'Your request could not be processed',
                color: '#ef4444',
                bgColor: '#fef2f2',
                borderColor: '#fecaca',
                badgeText: 'Rechazada',
                msgEs: `Lamentamos informarte que tu solicitud ha sido revisada y no pudo ser procesada en esta instancia.`,
                msgEn: `We regret to inform you that your request has been reviewed and could not be processed at this time.`,
            },
        };

        const meta = STATUS_META[status];
        if (!meta) return;

        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vialidades-1.onrender.com';

        const contenidoEs = `
            <p>Hola <strong>${requesterName}</strong>,</p>
            <p>${meta.msgEs}</p>

            <div style="background:${meta.bgColor};border:1px solid ${meta.borderColor};border-radius:12px;padding:20px 24px;margin:20px 0;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;width:130px;">Número de caso</td>
                        <td style="padding:6px 0;font-weight:700;font-family:monospace;color:${meta.color};font-size:15px;">${caseNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;">Tipo</td>
                        <td style="padding:6px 0;font-weight:600;">${typeLabel}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;">Estado</td>
                        <td style="padding:6px 0;">
                            <span style="display:inline-block;background:${meta.color}20;color:${meta.color};font-weight:700;font-size:12px;padding:3px 12px;border-radius:99px;">${meta.badgeText}</span>
                        </td>
                    </tr>
                </table>
            </div>

            ${resolution ? `
            <div style="background:#f8f9fc;border-left:3px solid ${meta.color};border-radius:0 10px 10px 0;padding:14px 18px;margin:0 0 16px 0;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Respuesta del equipo</p>
                <p style="margin:0;font-size:14px;color:#374151;font-style:italic;">"${resolution}"</p>
            </div>` : ''}

            <p style="font-size:13px;color:#9ca3af;">
                Puedes consultar el estado de tu caso en cualquier momento en
                <a href="${FRONTEND_URL}/soporte" style="color:#6366f1;">vialidades.com/soporte</a>
                usando tu número de caso <strong>${caseNumber}</strong>.
            </p>
        `;

        const contenidoEn = `
            <p>Hello <strong>${requesterName}</strong>,</p>
            <p>${meta.msgEn} Case number: <strong style="font-family:monospace;color:${meta.color};">${caseNumber}</strong> — Status: <strong>${meta.badgeText}</strong>.</p>
            ${resolution ? `<p><em>Team response: "${resolution}"</em></p>` : ''}
        `;

        const html = obtenerPlantillaBase(meta.titleEs, meta.titleEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({
            from: `"Vialidades Soporte" <${CORREO_REMITENTE}>`,
            to: email,
            subject: meta.subject,
            html,
        });
    } catch (error) {
        console.error('Error envío email actualización soporte:', error);
    }
};

exports.sendSupportRequestConfirmation = async (email, data) => {
    try {
        const {
            requesterName, type, victimName, relationship,
            reportId, reportDescription, reason, caseNumber, createdAt
        } = data;

        const typeLabel = type === 'familiar'
            ? 'Solicitud de Familiar — Ley 192-19'
            : 'Contenido No Autorizado — Ley 172-13';

        const fecha = new Date(createdAt).toLocaleDateString('es-DO', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const truncate = (text, max = 180) =>
            text && text.length > max ? text.substring(0, max) + '…' : (text || '—');

        const tituloEs = 'Solicitud recibida correctamente ✓';
        const tituloEn = 'Support request received ✓';

        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vialidades-1.onrender.com';

        const contenidoEs = `
            <p>Hola <strong>${requesterName}</strong>,</p>
            <p>Tu solicitud de eliminación de contenido ha sido <strong>recibida exitosamente</strong> y será revisada por nuestro equipo de moderación.</p>

            <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
                <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fca5a5;">Número de Caso</p>
                <p style="margin:0;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:4px;font-family:'Courier New',Courier,monospace;">${caseNumber}</p>
                <p style="margin:8px 0 0 0;font-size:12px;color:#fca5a5;">Guarda este número para consultar el estado de tu solicitud</p>
            </div>

            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px 24px;margin:20px 0;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#991b1b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Resumen de tu solicitud</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;width:130px;">Tipo</td>
                        <td style="padding:6px 0;font-weight:600;color:#dc2626;">${typeLabel}</td>
                    </tr>
                    ${victimName ? `<tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;">${type === 'familiar' ? 'Familiar' : 'Persona afectada'}</td>
                        <td style="padding:6px 0;font-weight:600;">${victimName}</td>
                    </tr>` : ''}
                    ${relationship ? `<tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;">Parentesco</td>
                        <td style="padding:6px 0;">${relationship}</td>
                    </tr>` : ''}
                    ${reportId ? `<tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;">Nº Reporte</td>
                        <td style="padding:6px 0;font-family:monospace;color:#4f46e5;">#${reportId}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;">Descripción</td>
                        <td style="padding:6px 0;">${truncate(reportDescription)}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;">Motivo</td>
                        <td style="padding:6px 0;">${truncate(reason)}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#6b7280;vertical-align:top;">Fecha</td>
                        <td style="padding:6px 0;">${fecha}</td>
                    </tr>
                </table>
            </div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:0 0 16px 0;">
                <p style="margin:0;font-size:14px;color:#065f46;">
                    ⏱ Tiempo estimado de respuesta: <strong>72 horas hábiles</strong>. Recibirás una notificación cuando tu solicitud sea procesada.
                </p>
            </div>

            <p style="font-size:13px;color:#9ca3af;">
                Puedes consultar el estado de tu caso en cualquier momento en <a href="${FRONTEND_URL}/soporte" style="color:#6366f1;">vialidades.com/soporte</a> usando tu número de caso. Guarda este correo como comprobante.
            </p>
        `;

        const contenidoEn = `
            <p>Hello <strong>${requesterName}</strong>,</p>
            <p>Your content removal request has been received. Case number: <strong style="font-family:monospace;color:#dc2626;">${caseNumber}</strong>.</p>
            <p>Type: <strong>${typeLabel}</strong>.${victimName ? ` Person: <strong>${victimName}</strong>.` : ''}
            We will review it within <strong>72 business hours</strong>.</p>
            <p style="font-size:13px;color:#9ca3af;">Keep this email and your case number to track the status of your request.</p>
        `;

        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({
            from: `"Vialidades Soporte" <${CORREO_REMITENTE}>`,
            to: email,
            subject: '✓ Solicitud de eliminación recibida | Removal request received',
            html
        });
    } catch (error) {
        console.error('Error envío email soporte:', error);
    }
};

exports.sendReportPublishedEmail = async (email, firstName, { type, description, address, timestamp }) => {
    try {
        const reportTypeEs = REPORT_TYPE_ES[type] || type;
        const fecha = new Date(timestamp).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const tituloEs = '🗺️ Tu reporte ha sido publicado';
        const tituloEn = '🗺️ Your report has been published';

        const contenidoEs = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Tu reporte ha sido recibido y ya está <strong>visible para la comunidad</strong> en Vialidades. Aquí está el resumen:</p>
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px 24px;margin:20px 0;">
                <p style="margin:0 0 10px 0;font-size:13px;color:#6d28d9;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalles del reporte</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
                    <tr><td style="padding:5px 0;color:#6b7280;width:110px;">Tipo</td><td style="padding:5px 0;font-weight:600;">${reportTypeEs}</td></tr>
                    <tr><td style="padding:5px 0;color:#6b7280;">Descripción</td><td style="padding:5px 0;">${description}</td></tr>
                    ${address ? `<tr><td style="padding:5px 0;color:#6b7280;">Ubicación</td><td style="padding:5px 0;">${address}</td></tr>` : ''}
                    <tr><td style="padding:5px 0;color:#6b7280;">Publicado</td><td style="padding:5px 0;">${fecha}</td></tr>
                </table>
            </div>
            <p style="font-size:13px;color:#9ca3af;">Gracias por contribuir a mejorar la seguridad vial en tu comunidad. Tu aporte hace la diferencia.</p>
        `;
        const contenidoEn = `
            <p>Hello <strong>${firstName}</strong>,</p>
            <p>Your report (<strong>${reportTypeEs}</strong>) has been received and is now visible to the community on Vialidades.
            ${address ? `Location: ${address}.` : ''} Thank you for helping improve road safety.</p>
        `;

        const html = obtenerPlantillaBase(tituloEs, tituloEn, contenidoEs, contenidoEn, '');
        await enviarEmailViaAPI({
            from: `"Vialidades" <${CORREO_REMITENTE}>`,
            to: email,
            subject: '🗺️ Tu reporte fue publicado | Your report is live',
            html
        });
    } catch (error) { console.error('Error envío email publicación reporte:', error); }
};
