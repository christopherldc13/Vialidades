const nodemailer = require('nodemailer');
const process = require('process');

// Initialize Nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// The verified sender email in Gmail
const FROM_EMAIL = process.env.EMAIL_USER || 'vialidades.transito@gmail.com';

/**
 * Base template generator for professional emails
 */
const getBaseTemplate = (title, content, actionButton = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { text-align: center; padding-bottom: 30px; border-bottom: 1px solid #f1f5f9; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 800; color: #6366f1; letter-spacing: -1px; text-decoration: none; }
        h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 20px; }
        p { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 28px; background-color: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3); }
        .footer { text-align: center; padding-top: 30px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 14px; margin-top: 30px; }
        .highlight { font-weight: 600; color: #1e293b; }
        .info-box { background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin-bottom: 24px; }
        @media only screen and (max-width: 600px) { .container { padding: 20px; border-radius: 0; margin-top: 0; } }
    </style>
</head>
<body>
    <div style="background-color: #f8fafc; padding: 20px 0;">
        <div class="container">
            <div class="header">
                <a href="#" class="logo">Vialidades</a>
            </div>
            <h1>${title}</h1>
            ${content}
            ${actionButton}
            <div class="footer">
                <p style="margin: 0; font-size: 13px;">© ${new Date().getFullYear()} Vialidades. Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0; font-size: 13px;">No respondas a este correo generado automáticamente.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

/**
 * Send Welcome Email on Registration
 */
exports.sendWelcomeEmail = async (email, username, generatedPassword) => {
    try {
        const title = "¡Bienvenido a Vialidades!";
        const content = `
            <p>Hola <span class="highlight">${username}</span>,</p>
            <p>Nos emociona darte la bienvenida a <strong>Vialidades</strong>, la plataforma ciudadana líder para el reporte y monitoreo de incidentes de tránsito en tiempo real.</p>
            <div class="info-box" style="margin-top: 20px;">
                <strong>Tus credenciales de acceso:</strong><br>
                <p style="margin-top: 10px; margin-bottom: 0;"><strong>Usuario/Email:</strong> ${email}</p>
                <p style="margin-top: 5px; margin-bottom: 0;"><strong>Contraseña:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</span></p>
                <p style="font-size: 13px; margin-top: 10px; color: #64748b;">Te recomendamos cambiar esta contraseña desde tu perfil una vez inicies sesión o usando la opción de "Olvidé mi contraseña".</p>
            </div>
            <p>Con tu cuenta activa, ahora puedes:</p>
            <ul style="color: #475569; line-height: 1.6; padding-left: 20px; margin-bottom: 24px;">
                <li>Reportar accidentes, tráfico pesado y peligros en las vías.</li>
                <li>Acumular puntos de reputación y ganar medallas por tu contribución comunitaria.</li>
                <li>Mantener a tu ciudad más segura y fluida para todos.</li>
            </ul>
        `;
        const actionButton = `
            <div class="btn-container">
                <a href="http://localhost:5173/login" class="btn">Iniciar Sesión Ahora</a>
            </div>
        `;

        const html = getBaseTemplate(title, content, actionButton);

        const mailOptions = {
            from: `"Vialidades" <${FROM_EMAIL}>`,
            to: email,
            subject: "¡Bienvenido a la comunidad de Vialidades!",
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent: ${result.messageId} to ${email}`);
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw error;
    }
};

/**
 * Send Verification Email on Registration
 */
exports.sendVerificationEmail = async (email, firstName, code) => {
    try {
        const title = "Verifica tu cuenta en Vialidades";
        const content = `
            <p>Hola <span class="highlight">${firstName}</span>,</p>
            <p>Gracias por registrarte en <strong>Vialidades</strong> al servicio de tu comunidad.</p>
            <div class="info-box" style="margin-top: 20px; text-align: center;">
                <strong>Tu Código de Verificación es:</strong><br>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1; margin: 15px 0;">${code}</div>
            </div>
            <p>Por favor, ingresa este código de 6 dígitos en la página de registro para confirmar tu correo y activar tu cuenta.</p>
        `;
        const actionButton = ``; // No button needed, just the code

        const html = getBaseTemplate(title, content, actionButton);

        const mailOptions = {
            from: `"Vialidades" <${FROM_EMAIL}>`,
            to: email,
            subject: "Código de Verificación - Vialidades",
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Verification email sent: ${result.messageId} to ${email}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
    }
};

/**
 * Send Password Reset Link
 */
exports.sendPasswordResetEmail = async (email, username, resetUrl) => {
    try {
        const title = "Recuperación de Contraseña";
        const content = `
            <p>Hola <span class="highlight">${username}</span>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Vialidades</strong>.</p>
            <p>Si hiciste esta solicitud, haz clic en el siguiente botón para crear una nueva contraseña. Por motivos de seguridad, este enlace caducará en <strong>1 hora</strong>.</p>
        `;
        const actionButton = `
            <div class="btn-container">
                <a href="${resetUrl}" class="btn">Restablecer Mi Contraseña</a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Si no solicitaste un cambio de contraseña, puedes ignorar este correo de forma segura. Tu cuenta sigue protegida.</p>
        `;

        const html = getBaseTemplate(title, content, actionButton);

        const mailOptions = {
            from: `"Soporte Vialidades" <${FROM_EMAIL}>`,
            to: email,
            subject: "Instrucciones para restablecer tu contraseña",
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent: ${result.messageId} to ${email}`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

/**
 * Send Notification when Report Status Changes
 */
exports.sendReportStatusEmail = async (email, username, reportType, status, moderatorComment = '', isSanctioned = false) => {
    try {
        let title = "Actualización de tu Reporte";
        let statusText = "Revisado";
        let statusColor = "#6366f1"; // default

        if (status === 'approved') {
            title = "Reporte Aprobado ✅";
            statusText = "Aprobado";
            statusColor = "#10b981"; // success
        } else if (status === 'rejected') {
            if (isSanctioned) {
                title = "Has sido Sancionado ⚠️";
                statusText = "Rechazado y Sancionado";
                statusColor = "#b91c1c"; // dark red
            } else {
                title = "Reporte Rechazado ❌";
                statusText = "Rechazado";
                statusColor = "#ef4444"; // error
            }
        }

        const reasonHtml = moderatorComment ? `
            <div class="info-box" style="border-left-color: ${statusColor}; background-color: ${status === 'approved' ? '#f0fdf4' : '#fef2f2'}; margin-top: 20px;">
                <strong style="color: ${statusColor}; display: block; margin-bottom: 5px;">
                    ${status === 'approved' ? 'Comentario del moderador:' : isSanctioned ? 'Motivo de la sanción:' : 'Motivo del rechazo:'}
                </strong>
                <span style="color: #475569;">${moderatorComment}</span>
            </div>
        ` : '';

        const content = `
            <p>Hola <span class="highlight">${username}</span>,</p>
            <p>Queremos informarte que tu reciente reporte de <strong>"${reportType}"</strong> ha sido revisado por nuestro equipo de moderación.</p>
            <div class="info-box" style="border-left-color: ${statusColor}; display: inline-block; padding: 10px 20px; margin-bottom: 0;">
                <strong>Estado Actual:</strong> <span style="color: ${statusColor}; font-weight: 800; text-transform: uppercase;">${statusText}</span>
            </div>
            ${reasonHtml}
            <p style="margin-top: 24px;">Agradecemos tu constante colaboración para mantener informada a la comunidad.</p>
        `;

        const actionButton = `
            <div class="btn-container">
                <a href="http://localhost:5173/dashboard?view=my" class="btn" style="background-color: ${statusColor}; box-shadow: 0 4px 6px -1px ${statusColor}40;">Ver mis Reportes</a>
            </div>
        `;

        const html = getBaseTemplate(title, content, actionButton);

        const mailOptions = {
            from: `"Moderación Vialidades" <${FROM_EMAIL}>`,
            to: email,
            subject: `Actualización: Tu reporte ha sido ${statusText.toLowerCase()}`,
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Report status email sent: ${result.messageId} to ${email}`);
    } catch (error) {
        console.error("Error sending report status email:", error);
        throw error;
    }
};
