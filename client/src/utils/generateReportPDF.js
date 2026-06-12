import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const INCIDENT_LABELS = {
    Traffic:   'Tráfico Pesado',
    Accident:  'Accidente de Tránsito',
    Violation: 'Infracción Vial',
    Hazard:    'Peligro en la Vía',
    RoadWork:  'Obra en la Vía',
    Pothole:   'Bache Peligroso',
    Flood:     'Inundación',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
const fmtFull = (d) => new Date(d).toLocaleString('es-DO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function hexToRgb(hex) {
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
const setFill   = (doc, hex) => doc.setFillColor(...hexToRgb(hex));
const setStroke = (doc, hex) => doc.setDrawColor(...hexToRgb(hex));
const setColor  = (doc, hex) => doc.setTextColor(...hexToRgb(hex));

function card(doc, x, y, w, h, r, fillHex, strokeHex = null, lw = 0.35) {
    setFill(doc, fillHex);
    doc.roundedRect(x, y, w, h, r, r, strokeHex ? 'FD' : 'F');
    if (strokeHex) {
        setStroke(doc, strokeHex);
        doc.setLineWidth(lw);
        doc.roundedRect(x, y, w, h, r, r, 'S');
    }
}

// Draw a proper checkmark with lines (no text character)
function drawCheckmark(doc, cx, cy, size, colorHex, lw = 1.5) {
    setStroke(doc, colorHex);
    doc.setLineWidth(lw);
    // Left stroke: down-right
    doc.line(cx - size * 0.45, cy + size * 0.05, cx - size * 0.05, cy + size * 0.45);
    // Right stroke: up-right
    doc.line(cx - size * 0.05, cy + size * 0.45, cx + size * 0.55, cy - size * 0.35);
}

export async function generateReportPDF(report) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const reportCode = `VTI${String(report.reportNumber).padStart(4, '0')}`;
    const verifyUrl  = `${window.location.origin}/reporte/${reportCode}`;

    // ── BACKGROUND ────────────────────────────────────────────────────────────
    setFill(doc, '#F8FAFC');
    doc.rect(0, 0, W, H, 'F');

    // Watermark circles (top-right, bottom-left)
    setStroke(doc, '#E2E8F0');
    doc.setLineWidth(0.25);
    doc.circle(182, 52, 52, 'S');
    doc.circle(182, 52, 38, 'S');
    doc.circle(28, 238, 42, 'S');
    doc.circle(28, 238, 28, 'S');

    // Left accent bar
    setFill(doc, '#4338CA');
    doc.rect(0, 0, 5, H, 'F');
    setFill(doc, '#6366F1');
    doc.rect(0, 0, 2.5, H, 'F');

    // ── HEADER ────────────────────────────────────────────────────────────────
    const hX = 14, hW = W - 18;

    // Main header card
    card(doc, hX, 12, hW, 60, 8, '#4F46E5');

    // Lighter top gradient band
    setFill(doc, '#5B54F5');
    doc.roundedRect(hX, 12, hW, 28, 8, 8, 'F');
    setFill(doc, '#4F46E5');
    doc.rect(hX, 28, hW, 12, 'F'); // flat bottom of lighter band

    // Decorative rings inside header
    setStroke(doc, '#7C75F5');
    doc.setLineWidth(0.3);
    doc.circle(hX + hW - 14, 23, 18, 'S');
    doc.circle(hX + hW - 14, 23, 12, 'S');
    doc.circle(hX + 10, 65, 13, 'S');

    // Platform label
    setColor(doc, '#A5B4FC');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('VIALIDADES DE TRÁNSITO  ·  REPÚBLICA DOMINICANA', W / 2 + 2, 21, { align: 'center' });

    // Title
    setColor(doc, '#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Certificado Oficial de Reporte Vial', W / 2 + 2, 33, { align: 'center' });

    // Divider
    setStroke(doc, '#818CF8');
    doc.setLineWidth(0.4);
    doc.line(hX + 25, 38, hX + hW - 25, 38);

    // Subtitle
    setColor(doc, '#C7D2FE');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Documento emitido y verificado por la Plataforma Vialidades', W / 2 + 2, 44, { align: 'center' });

    // ── REPORT NUMBER PILL ────────────────────────────────────────────────────
    card(doc, hX + 8, 50, 68, 17, 6, '#FFFFFF');
    setColor(doc, '#6366F1');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('N° DE REPORTE', hX + 42, 56.5, { align: 'center' });
    setColor(doc, '#3730A3');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(reportCode, hX + 42, 64.5, { align: 'center' });

    // ── APROBADO PILL ─────────────────────────────────────────────────────────
    const pillX = hX + 84, pillW = 56, pillH = 17;
    card(doc, pillX, 50, pillW, pillH, 6, '#10B981');

    // White circle for checkmark bg
    setFill(doc, '#0EA572');
    doc.circle(pillX + 11, 58.5, 5.5, 'F');
    setFill(doc, '#FFFFFF');
    doc.circle(pillX + 11, 58.5, 4.5, 'F');

    // Draw checkmark manually
    drawCheckmark(doc, pillX + 11, 58.5, 4, '#10B981', 1.3);

    // APROBADO text
    setColor(doc, '#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('APROBADO', pillX + pillW / 2 + 4, 61, { align: 'center' });

    // Generation date
    setColor(doc, '#A5B4FC');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Generado: ${fmtDate(new Date())}`, hX + hW - 4, 55, { align: 'right' });
    doc.text(fmtTime(new Date()), hX + hW - 4, 63, { align: 'right' });

    // ── SECTION: INFO ─────────────────────────────────────────────────────────
    let y = 82;

    card(doc, hX, y, hW, 8.5, 3, '#EEF2FF');
    setColor(doc, '#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('INFORMACIÓN DEL INCIDENTE', hX + 5, y + 5.8);
    y += 11;

    const rows = [
        ['Tipo de Incidente', INCIDENT_LABELS[report.type] || report.type],
        ['Fecha',             fmtDate(report.timestamp)],
        ['Hora',              fmtTime(report.timestamp)],
        ['Reportado por',     report.userId?.username || 'Usuario desconocido'],
    ];
    if (report.location?.address) rows.push(['Ubicación', report.location.address]);
    else if (report.location?.lat) rows.push(['Coordenadas', `${report.location.lat.toFixed(5)}, ${report.location.lng.toFixed(5)}`]);
    if (report.carInfo?.brand) {
        const v = [report.carInfo.brand, report.carInfo.model, report.carInfo.year, report.carInfo.color].filter(Boolean).join('  ·  ');
        rows.push(['Vehículo', v]);
    }

    const rowH = 9.5;
    const infoH = rows.length * rowH + 5;
    card(doc, hX, y, hW, infoH, 4, '#FFFFFF', '#E2E8F0');

    rows.forEach(([label, value], i) => {
        const ry = y + 5 + i * rowH;
        if (i % 2 === 0) { setFill(doc, '#F8FAFC'); doc.rect(hX + 0.5, ry - 3.8, hW - 1, rowH, 'F'); }

        // Small accent dot
        setFill(doc, '#6366F1');
        doc.circle(hX + 7, ry + 1, 1, 'F');

        setColor(doc, '#94A3B8');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(label, hX + 12, ry + 2);

        setColor(doc, '#0F172A');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(value, hW - 70);
        doc.text(lines, hX + 68, ry + 2);
    });
    y += infoH + 8;

    // ── SECTION: DESCRIPTION ─────────────────────────────────────────────────
    card(doc, hX, y, hW, 8.5, 3, '#EEF2FF');
    setColor(doc, '#4F46E5');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DESCRIPCIÓN DEL INCIDENTE', hX + 5, y + 5.8);
    y += 11;

    const descLines = doc.splitTextToSize(`"${report.description}"`, hW - 22);
    const descH = Math.max(descLines.length * 6.2 + 12, 22);
    card(doc, hX, y, hW, descH, 4, '#FFFFFF', '#E2E8F0');

    // Accent bar
    setFill(doc, '#6366F1');
    doc.roundedRect(hX + 4, y + 5, 2.5, descH - 10, 1.5, 1.5, 'F');

    setColor(doc, '#334155');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.text(descLines, hX + 11, y + 10);
    y += descH + 8;

    // ── SECTION: MODERATOR COMMENT ───────────────────────────────────────────
    if (report.moderatorComment) {
        card(doc, hX, y, hW, 8.5, 3, '#ECFDF5');
        setColor(doc, '#059669');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('NOTA DEL MODERADOR', hX + 5, y + 5.8);
        y += 11;
        const noteLines = doc.splitTextToSize(report.moderatorComment, hW - 16);
        const noteH = noteLines.length * 5.5 + 10;
        card(doc, hX, y, hW, noteH, 4, '#F0FDF4', '#A7F3D0');
        setColor(doc, '#065F46');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(noteLines, hX + 6, y + 7);
        y += noteH + 8;
    }

    // ── SECTION: QR + VERIFICATION ───────────────────────────────────────────
    const qrY = Math.max(y + 4, 204);
    const qrH = 70;

    // Dark outer card
    card(doc, hX, qrY, hW, qrH, 7, '#1E1B4B');

    // Top lighter band with title
    setFill(doc, '#2D2A6E');
    doc.roundedRect(hX, qrY, hW, 18, 7, 7, 'F');
    setFill(doc, '#1E1B4B');
    doc.rect(hX, qrY + 11, hW, 7, 'F');

    // Decorative circles in QR section
    setStroke(doc, '#4338CA');
    doc.setLineWidth(0.3);
    doc.circle(hX + hW - 10, qrY + 10, 18, 'S');
    doc.circle(hX + hW - 10, qrY + 10, 12, 'S');

    // Section title
    setColor(doc, '#E0E7FF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('VERIFICACIÓN DE AUTENTICIDAD', W / 2 + 2, qrY + 8, { align: 'center' });

    setColor(doc, '#818CF8');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Escanea el código QR o visita el enlace para confirmar la veracidad de este documento', W / 2 + 2, qrY + 14, { align: 'center' });

    // QR code — white card
    const qrSize = 38;
    const qrCardPad = 2;
    card(doc, hX + 6, qrY + 20, qrSize + qrCardPad * 2, qrSize + qrCardPad * 2, 4, '#FFFFFF');

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 400, margin: 1,
        color: { dark: '#1E1B4B', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
    });
    doc.addImage(qrDataUrl, 'PNG', hX + 6 + qrCardPad, qrY + 20 + qrCardPad, qrSize, qrSize);

    // Small "Vialidades" label under QR
    setColor(doc, '#6366F1');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('VIALIDADES', hX + 6 + qrSize / 2 + qrCardPad, qrY + 20 + qrSize + qrCardPad * 2 + 3.5, { align: 'center' });

    // Verification text block
    const tx = hX + 6 + qrSize + qrCardPad * 2 + 6;
    const textW = hW - (tx - hX) - 4;

    setColor(doc, '#A5B4FC');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ENLACE DE VERIFICACIÓN', tx, qrY + 26);

    // URL — highlighted
    card(doc, tx, qrY + 29, textW, 9, 3, '#2D2A6E');
    setColor(doc, '#818CF8');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const urlLines = doc.splitTextToSize(verifyUrl, textW - 4);
    doc.text(urlLines, tx + 3, qrY + 34.5);

    setColor(doc, '#6B7ABA');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Generado el ${fmtFull(new Date())}`, tx, qrY + 44);

    setColor(doc, '#4F5A9A');
    doc.setFontSize(6.2);
    const disclaimer = doc.splitTextToSize(
        'Este certificado es emitido oficialmente por la Plataforma Vialidades de Tránsito. Su contenido ha sido verificado y aprobado.',
        textW
    );
    doc.text(disclaimer, tx, qrY + 50);

    // ── PAGE FOOTER ───────────────────────────────────────────────────────────
    setFill(doc, '#3730A3');
    doc.rect(0, H - 11, W, 11, 'F');
    setFill(doc, '#4F46E5');
    doc.rect(0, H - 11, W, 4, 'F');
    setColor(doc, '#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('© 2026 Vialidades de Tránsito  ·  Todos los derechos reservados  ·  vialidades.app', W / 2, H - 4, { align: 'center' });

    doc.save(`Certificado_${reportCode}.pdf`);
}
