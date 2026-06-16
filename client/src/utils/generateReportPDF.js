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

function drawCheck(doc, cx, cy, r) {
    setStroke(doc, '#0F172A');
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, r, 'S');
    doc.setLineWidth(0.9);
    doc.line(cx - r*0.42, cy + r*0.05, cx - r*0.05, cy + r*0.42);
    doc.line(cx - r*0.05, cy + r*0.42, cx + r*0.52, cy - r*0.32);
}

export async function generateReportPDF(report) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const M = 18;
    const CW = W - M * 2;
    const reportCode = `VTI${String(report.reportNumber).padStart(4, '0')}`;
    const verifyUrl  = `${window.location.origin}/verificar/${report._id}`;

    // Background
    setFill(doc, '#FFFFFF');
    doc.rect(0, 0, W, H, 'F');

    // Top accent bar (simple rect — no rounding issues)
    setFill(doc, '#0F172A');
    doc.rect(0, 0, W, 5, 'F');

    // ── HEADER ───────────────────────────────────────────────────────────────
    let y = 16;

    // Date in top-right corner
    setColor(doc, '#64748B');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`${fmtTime(new Date())}  ·  ${fmtDate(new Date())}`, W - M, y - 5, { align: 'right' });

    setColor(doc, '#94A3B8');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('VIALIDADES DE TRÁNSITO  ·  REPÚBLICA DOMINICANA', W / 2, y, { align: 'center' });
    y += 7;

    setColor(doc, '#0F172A');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.text('Certificado Oficial de Reporte Vial', W / 2, y, { align: 'center' });
    y += 5;

    setColor(doc, '#94A3B8');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Documento emitido y verificado por la Plataforma Vialidades', W / 2, y, { align: 'center' });
    y += 7;

    // Divider
    setStroke(doc, '#CBD5E1');
    doc.setLineWidth(0.35);
    doc.line(M, y, W - M, y);
    y += 8;

    // ── META ROW (number | status | date) ────────────────────────────────────
    // Report number box
    setStroke(doc, '#CBD5E1');
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, 50, 15, 3, 3, 'S');
    setColor(doc, '#94A3B8');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('N° DE REPORTE', M + 25, y + 5, { align: 'center' });
    setColor(doc, '#0F172A');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(reportCode, M + 25, y + 12, { align: 'center' });

    // Status box
    const sX = M + 58;
    doc.roundedRect(sX, y, 52, 15, 3, 3, 'S');
    drawCheck(doc, sX + 10, y + 7.5, 4.5);
    setColor(doc, '#0F172A');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('APROBADO', sX + 33, y + 9, { align: 'center' });

    y += 21;

    // Divider
    setStroke(doc, '#E2E8F0');
    doc.setLineWidth(0.25);
    doc.line(M, y, W - M, y);
    y += 8;

    // ── SECTION LABEL HELPER ─────────────────────────────────────────────────
    const sectionLabel = (text, yy) => {
        setFill(doc, '#0F172A');
        doc.rect(M, yy, 2.5, 5.5, 'F');
        setColor(doc, '#0F172A');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(text, M + 5.5, yy + 4.2);
        return yy + 9;
    };

    // ── INFO TABLE ───────────────────────────────────────────────────────────
    y = sectionLabel('INFORMACIÓN DEL INCIDENTE', y);

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

    const rowH = 9;
    const tableH = rows.length * rowH + 3;

    // Table border (simple rect — fills won't escape)
    setStroke(doc, '#CBD5E1');
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, tableH, 'S');

    rows.forEach(([label, value], i) => {
        const ry = y + 2 + i * rowH;

        // Row divider (skip first)
        if (i > 0) {
            setStroke(doc, '#E2E8F0');
            doc.setLineWidth(0.2);
            doc.line(M, ry - 1, M + CW, ry - 1);
        }

        // Vertical divider between label and value
        setStroke(doc, '#E2E8F0');
        doc.setLineWidth(0.2);
        doc.line(M + 62, ry - 1, M + 62, ry + rowH - 1);

        setColor(doc, '#94A3B8');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(label, M + 5, ry + 5.5);

        setColor(doc, '#0F172A');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(value, CW - 68);
        doc.text(lines, M + 65, ry + 5.5);
    });

    y += tableH + 10;

    // ── DESCRIPTION ──────────────────────────────────────────────────────────
    y = sectionLabel('DESCRIPCIÓN DEL INCIDENTE', y);

    const descLines = doc.splitTextToSize(`"${report.description}"`, CW - 16);
    const descH = Math.max(descLines.length * 6 + 12, 20);

    setStroke(doc, '#CBD5E1');
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, descH, 'S');

    // Left accent bar
    setFill(doc, '#CBD5E1');
    doc.rect(M + 5, y + 5, 1.5, descH - 10, 'F');

    setColor(doc, '#334155');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(descLines, M + 10, y + 9);
    y += descH + 10;

    // ── MODERATOR COMMENT ────────────────────────────────────────────────────
    if (report.moderatorComment) {
        y = sectionLabel('NOTA DEL MODERADOR', y);
        const noteLines = doc.splitTextToSize(report.moderatorComment, CW - 12);
        const noteH = noteLines.length * 5.5 + 12;
        setStroke(doc, '#CBD5E1');
        doc.setLineWidth(0.3);
        doc.rect(M, y, CW, noteH, 'S');
        setColor(doc, '#334155');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(noteLines, M + 6, y + 8);
        y += noteH + 10;
    }

    // ── QR + VERIFICATION ────────────────────────────────────────────────────
    const qrH = 68;
    const qrY = Math.max(y + 10, H - qrH - 20);

    // QR card — light bg, simple rect
    setFill(doc, '#F8FAFC');
    doc.rect(M, qrY, CW, qrH, 'F');
    setStroke(doc, '#CBD5E1');
    doc.setLineWidth(0.3);
    doc.rect(M, qrY, CW, qrH, 'S');

    // Top strip inside card
    setFill(doc, '#0F172A');
    doc.rect(M, qrY, CW, 3, 'F');

    // Title
    setColor(doc, '#0F172A');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('VERIFICACIÓN DE AUTENTICIDAD', W / 2, qrY + 11, { align: 'center' });

    setColor(doc, '#94A3B8');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Escanea el código QR o visita el enlace para confirmar la veracidad de este documento', W / 2, qrY + 16.5, { align: 'center' });

    setStroke(doc, '#E2E8F0');
    doc.setLineWidth(0.2);
    doc.line(M + 6, qrY + 19, M + CW - 6, qrY + 19);

    // QR image
    const qrSize = 34;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 400, margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
    });
    setFill(doc, '#FFFFFF');
    doc.rect(M + 5, qrY + 21, qrSize + 4, qrSize + 4, 'F');
    doc.addImage(qrDataUrl, 'PNG', M + 7, qrY + 23, qrSize, qrSize);

    // Right side text
    const tx = M + qrSize + 18;
    const textW = CW - (tx - M) - 4;

    setColor(doc, '#64748B');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Escanea para verificar', tx, qrY + 30);

    setColor(doc, '#94A3B8');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const hint = doc.splitTextToSize(
        'Este código QR contiene un enlace único y seguro que apunta exclusivamente a este reporte. No es posible acceder a otros reportes modificando el enlace.',
        textW
    );
    doc.text(hint, tx, qrY + 37);

    setColor(doc, '#CBD5E1');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Emitido el ${fmtFull(new Date())}`, tx, qrY + 58);

    // ── FOOTER ───────────────────────────────────────────────────────────────
    setStroke(doc, '#E2E8F0');
    doc.setLineWidth(0.3);
    doc.line(M, H - 11, W - M, H - 11);
    setColor(doc, '#94A3B8');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('© 2026 Vialidades de Tránsito  ·  Todos los derechos reservados  ·  vialidades.app', W / 2, H - 6, { align: 'center' });

    doc.save(`Certificado_${reportCode}.pdf`);
}
