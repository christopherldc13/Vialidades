import { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { User, Trophy, ThumbsUp, Minus, AlertTriangle, Camera, Edit2, Check, X, Star, CheckCircle, Trash2, Download, Pencil, Eye, EyeOff, ImagePlus, KeyRound } from 'lucide-react';
import { FaPhoneAlt, FaUserEdit } from "react-icons/fa";
import { LiaIdCard, LiaBirthdayCakeSolid } from "react-icons/lia";
import { BsGenderFemale, BsGenderMale } from "react-icons/bs";
import { RiUserLocationLine } from "react-icons/ri";
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Skeleton, Box } from '@mui/material';

const parseLocalDate = (dobString) => {
    if (!dobString) return null;
    const [y, m, d] = dobString.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
};

const calculateAge = (dobString) => {
    if (!dobString) return '';
    const today = new Date();
    const dob = parseLocalDate(dobString);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

const Profile = () => {
    const { user, setUser, logout, loading } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="auth-container profile-container">
                    <div className="card profile-card">
                        {/* Avatar Skeleton */}
                        <Box sx={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                            <Skeleton variant="circular" width={120} height={120} animation="wave" />
                        </Box>

                        {/* Name & Email Skeletons */}
                        <Box sx={{ mb: 4 }}>
                            <Skeleton variant="text" width="40%" height={40} sx={{ mx: 'auto', mb: 1 }} animation="wave" />
                            <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto' }} animation="wave" />
                        </Box>

                        {/* Info Grid Skeletons */}
                        <div className="profile-info-grid">
                            {Array.from(new Array(5)).map((_, i) => (
                                <Box key={i} className="profile-info-item">
                                    <Skeleton variant="text" width="40%" height={15} sx={{ mb: 1 }} animation="wave" />
                                    <Skeleton variant="text" width="80%" height={25} animation="wave" />
                                </Box>
                            ))}
                        </div>

                        {/* Stats Grid Skeletons */}
                        <div className="stats-grid" style={{ marginTop: '2rem' }}>
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius)' }} animation="wave" />
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius)' }} animation="wave" />
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius)' }} animation="wave" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Por favor inicia sesión para ver el perfil.</p>
            </div>
        );
    }

    const getReputationData = (score) => {
        const s = score || 0;
        if (s >= 90) return { icon: <Trophy size={32} />, label: 'Excelente', class: 'rep-excellent' };
        if (s >= 70) return { icon: <ThumbsUp size={32} />, label: 'Bueno', class: 'rep-good' };
        if (s >= 50) return { icon: <Minus size={32} />, label: 'Promedio', class: 'rep-average' };
        return { icon: <AlertTriangle size={32} />, label: 'Bajo', class: 'rep-bad' };
    };

    const repData = getReputationData(user.reputation);

    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const [avatarMenuPos, setAvatarMenuPos] = useState({ top: 0, left: 0 });
    const avatarMenuRef = useRef(null);
    const pencilBtnRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPwdModal, setShowPwdModal] = useState(false);
    const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
    const [pwdShow, setPwdShow] = useState({ current: false, newPwd: false, confirm: false });
    const [pwdFocused, setPwdFocused] = useState(null);
    const [pwdSaving, setPwdSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        cedula: user?.cedula || '',
        gender: user?.gender || '',
        birthDate: user?.birthDate ? user.birthDate.split('T')[0] : '',
        birthProvince: user?.birthProvince || ''
    });

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const { firstName, lastName, ...editableFields } = editForm;
            const res = await axios.patch('/api/auth/profile', editableFields, {
                headers: {
                    'x-auth-token': token
                }
            });
            // Sync local state immediately
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));

            // Give user visual feedback
            setIsEditing(false);
            setSaving(false);
            toast.success('Perfil actualizado con éxito.');
        } catch (error) {
            setSaving(false);
            console.error('Error saving profile:', error);
            toast.error('Error al guardar el perfil: ' + (error.response?.data?.msg || error.message));
        }
    };

    // Helper to trigger file input
    const triggerFileInput = () => {
        document.getElementById('avatarInput').click();
    };

    useEffect(() => {
        const handler = (e) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
                setAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleRemoveAvatar = async () => {
        const result = await Swal.fire({
            title: 'Eliminar foto',
            text: '¿Seguro que deseas quitar tu foto de perfil?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
        });
        if (!result.isConfirmed) return;
        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const res = await axios.delete('/api/auth/avatar', { headers: { 'x-auth-token': token } });
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            toast.success('Foto eliminada');
        } catch {
            toast.error('No se pudo eliminar la foto');
        } finally {
            setUploading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        // Optional: Sending username/email again isn't strictly necessary if backend allows partial updates
        // but backend logic checks if(username) etc. so sending just avatar is fine.

        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const res = await axios.patch('/api/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token
                }
            });

            // Sync local state immediately
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));

            setUploading(false);
            Swal.fire({
                icon: 'success',
                title: '¡Foto Actualizada!',
                text: 'Tu imagen de perfil se ha cambiado con éxito.',
                confirmButtonText: 'Genial',
                confirmButtonColor: 'var(--primary)'
            });

            // Reload user data from context or update locally after delay or modal close
            // For now, we wait for user to close modal to reload
        } catch (err) {
            setUploading(false);
            console.error("Upload error", err);
            const msg = err.response?.data?.msg || err.message || "Error al subir la imagen";
            toast.error(`Error: ${msg}`);
        }
    };

    const fetchExportData = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/export', { headers: { 'x-auth-token': token } });
        return res.data;
    };

    const handleDownloadJSON = async () => {
        try {
            const data = await fetchExportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vialidades_${user.username}_datos.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Error al exportar JSON: ' + (err.response?.data?.msg || err.message));
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const data = await fetchExportData();
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const NAVY     = [15, 23, 42];      // #0f1722 — header fondo
            const ACCENT   = [30, 64, 175];     // #1e40af — azul marino acento
            const DARK     = [15, 23, 42];
            const MUTED    = [100, 116, 139];
            const ROW_ALT  = [247, 248, 250];
            const HEAD_BG  = [241, 245, 249];
            const W = doc.internal.pageSize.getWidth();

            // ── Cargar Icono Sistema.png via canvas ──────────────────────
            let logoData = null;
            try {
                logoData = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = reject;
                    img.src = '/Icono Sistema.png';
                });
            } catch { /* fallback */ }

            // ── HEADER ──────────────────────────────────────────────────
            // Fondo oscuro principal
            doc.setFillColor(...NAVY);
            doc.rect(0, 0, W, 32, 'F');
            // Franja de acento azul abajo del header
            doc.setFillColor(...ACCENT);
            doc.rect(0, 32, W, 3, 'F');

            // Logo
            if (logoData) {
                doc.addImage(logoData, 'PNG', 10, 6, 16, 16);
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('VIALIDADES DE TRÁNSITO', 30, 14);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(148, 163, 184);  // slate-400
                doc.text('Informe oficial de datos del usuario', 30, 21);
            } else {
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('VIALIDADES DE TRÁNSITO', 14, 14);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(148, 163, 184);
                doc.text('Informe oficial de datos del usuario', 14, 21);
            }

            // Fecha + usuario (derecha)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Generado: ${new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}`,
                W - 10, 13, { align: 'right' }
            );
            doc.text(`@${user.username}`, W - 10, 21, { align: 'right' });

            let y = 42;

            // ── SECTION HELPER ──────────────────────────────────────────
            const section = (title) => {
                if (y > doc.internal.pageSize.getHeight() - 30) {
                    doc.addPage();
                    y = 16;
                }
                doc.setFillColor(...NAVY);
                doc.rect(14, y, W - 28, 7, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 17, y + 5);
                y += 10;
                doc.setTextColor(...DARK);
            };

            // ── PERFIL ──────────────────────────────────────────────────
            section('DATOS DEL PERFIL');
            const p = data.perfil;
            autoTable(doc, {
                startY: y,
                margin: { left: 14, right: 14 },
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: HEAD_BG, textColor: MUTED, fontStyle: 'bold', fontSize: 8 },
                alternateRowStyles: { fillColor: ROW_ALT },
                columns: [{ dataKey: 'campo', header: 'CAMPO' }, { dataKey: 'valor', header: 'VALOR' }],
                body: [
                    { campo: 'Nombre completo', valor: p.nombre },
                    { campo: 'Usuario',          valor: `@${p.username}` },
                    { campo: 'Correo',           valor: p.email },
                    { campo: 'Teléfono',         valor: p.telefono },
                    { campo: 'Cédula',           valor: p.cedula },
                    { campo: 'Género',           valor: p.genero },
                    { campo: 'Fecha de nac.',    valor: p.fechaNacimiento ? new Date(p.fechaNacimiento).toLocaleDateString('es-DO') : '-' },
                    { campo: 'Provincia',        valor: p.provincia },
                    { campo: 'Miembro desde',    valor: p.miembroDesde ? new Date(p.miembroDesde).toLocaleDateString('es-DO') : '-' },
                    { campo: 'Cuenta verificada',valor: p.cuentaVerificada ? 'Sí' : 'No' },
                ],
                columnStyles: { campo: { fontStyle: 'bold', cellWidth: 50 } }
            });
            y = doc.lastAutoTable.finalY + 8;

            // ── ESTADÍSTICAS ────────────────────────────────────────────
            section('ESTADÍSTICAS');
            const r = data.resumen;
            autoTable(doc, {
                startY: y,
                margin: { left: 14, right: 14 },
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK, halign: 'center' },
                headStyles: { fillColor: HEAD_BG, textColor: MUTED, fontStyle: 'bold', fontSize: 8, halign: 'center' },
                alternateRowStyles: { fillColor: ROW_ALT },
                head: [['REPUTACIÓN', 'SANCIONES', 'TOTAL REP.', 'APROBADOS', 'RECHAZADOS', 'PENDIENTES']],
                body: [[p.reputacion, p.sanciones, r.totalReportes, r.aprobados, r.rechazados, r.pendientes]],
            });
            y = doc.lastAutoTable.finalY + 8;

            // ── REPORTES ────────────────────────────────────────────────
            section('HISTORIAL DE REPORTES');
            if (data.reportes.length === 0) {
                doc.setFontSize(9);
                doc.setTextColor(...MUTED);
                doc.text('No hay reportes registrados.', 14, y + 4);
                y += 10;
            } else {
                const statusLabel = { approved: 'Aprobado', rejected: 'Rechazado', pending: 'Pendiente', 'In Process': 'En proceso', needs_review: 'En revisión' };
                autoTable(doc, {
                    startY: y,
                    margin: { left: 14, right: 14 },
                    theme: 'striped',
                    styles: { fontSize: 8, cellPadding: 3, textColor: DARK, overflow: 'linebreak' },
                    headStyles: { fillColor: NAVY, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
                    columns: [
                        { dataKey: 'tipo',    header: 'TIPO' },
                        { dataKey: 'desc',    header: 'DESCRIPCIÓN' },
                        { dataKey: 'dir',     header: 'DIRECCIÓN' },
                        { dataKey: 'estado',  header: 'ESTADO' },
                        { dataKey: 'fecha',   header: 'FECHA' },
                    ],
                    body: data.reportes.map(rep => ({
                        tipo:   ({ Traffic: 'Tráfico Pesado', Accident: 'Accidente de Tránsito', Violation: 'Infracción Vial', Hazard: 'Peligro en la Vía', RoadWork: 'Obra en la Vía', Pothole: 'Bache Peligroso', Flood: 'Inundación' })[rep.tipo] || rep.tipo,
                        desc:   rep.descripcion?.length > 60 ? rep.descripcion.slice(0, 57) + '…' : rep.descripcion,
                        dir:    rep.ubicacion?.address || `${rep.ubicacion?.lat?.toFixed(4)}, ${rep.ubicacion?.lng?.toFixed(4)}`,
                        estado: statusLabel[rep.estado] || rep.estado,
                        fecha:  rep.fecha ? new Date(rep.fecha).toLocaleDateString('es-DO') : '-',
                    })),
                    columnStyles: { desc: { cellWidth: 55 }, dir: { cellWidth: 45 } },
                    didParseCell: (d) => {
                        if (d.column.dataKey === 'estado') {
                            const colors = { Aprobado:[34,197,94], Rechazado:[239,68,68], Pendiente:[245,158,11], 'En proceso':[59,130,246], 'En revisión':[168,85,247] };
                            const c = colors[d.cell.raw];
                            if (c) d.cell.styles.textColor = c;
                        }
                    }
                });
                y = doc.lastAutoTable.finalY + 8;
            }

            // ── FOOTER en cada página ────────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                const H = doc.internal.pageSize.getHeight();
                // Línea separadora
                doc.setDrawColor(...ACCENT);
                doc.setLineWidth(0.5);
                doc.line(14, H - 12, W - 14, H - 12);
                doc.setFillColor(248, 249, 250);
                doc.rect(0, H - 11, W, 11, 'F');
                doc.setFontSize(7);
                doc.setTextColor(...MUTED);
                doc.text('© 2026 Vialidades de Tránsito · Documento oficial · Información confidencial', 14, H - 5);
                doc.setTextColor(...ACCENT);
                doc.text(`Pág. ${i} / ${totalPages}`, W - 14, H - 5, { align: 'right' });
            }

            doc.save(`vialidades_${user.username}_informe.pdf`);
        } catch (err) {
            console.error(err);
            toast.error('Error al generar el PDF: ' + err.message);
        }
    };

    const handleDownloadModal = () => {
        const isDark = theme === 'dark';
        const bg       = isDark ? '#1e2025' : '#ffffff';
        const cardBg   = isDark ? '#2a2d35' : '#f8fafc';
        const textMain = isDark ? '#f1f5f9'  : '#1e293b';
        const textMuted= isDark ? '#94a3b8'  : '#64748b';
        const border   = isDark ? '#374151'  : '#e2e8f0';

        Swal.fire({
            title: '<span style="font-size:1.15rem;font-weight:700">Descargar información</span>',
            html: `
                <p style="color:${textMuted};font-size:0.85rem;margin:0 0 20px">Elige el formato en que deseas descargar tu información personal y reportes.</p>
                <div style="display:flex;gap:12px">
                    <button id="btn-json" class="dl-btn-json">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span>JSON</span>
                        <span class="dl-btn-sub">Datos en crudo</span>
                    </button>
                    <button id="btn-pdf" class="dl-btn-pdf">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        <span>PDF</span>
                        <span class="dl-btn-sub">Informe con formato</span>
                    </button>
                </div>
            `,
            background: bg,
            color: textMain,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'dl-popup', closeButton: 'dl-close-btn' },
            didOpen: () => {
                // Inyectar CSS con alta especificidad para vencer el CSS global
                // Eliminar estilo previo y recrear con los colores del tema actual
                const prev = document.getElementById('dl-modal-style');
                if (prev) prev.remove();
                const s = document.createElement('style');
                s.id = 'dl-modal-style';
                s.textContent = `
                    .dl-popup { position: relative !important; overflow: visible !important; }
                    .dl-close-btn {
                        position: absolute !important; top: 10px !important; right: 14px !important;
                        left: auto !important; background: transparent !important; border: none !important;
                        box-shadow: none !important; font-size: 1.2rem !important; color: ${textMuted} !important;
                        cursor: pointer !important; width: auto !important; height: auto !important;
                        line-height: 1 !important; padding: 4px 6px !important; margin: 0 !important;
                        display: block !important; transform: none !important;
                    }
                    .dl-close-btn:hover { color: ${textMain} !important; background: transparent !important; }
                    .dl-btn-json {
                        flex: 1; padding: 1.1rem 0.5rem; border-radius: 12px !important;
                        border: 2px solid #6366f1 !important; background: ${cardBg} !important;
                        color: #6366f1 !important; font-size: 0.875rem; font-weight: 700;
                        cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px;
                        transition: all 0.2s !important; box-shadow: none !important;
                    }
                    .dl-btn-json:hover { background: #6366f1 !important; color: #fff !important; }
                    .dl-btn-pdf {
                        flex: 1; padding: 1.1rem 0.5rem; border-radius: 12px !important;
                        border: 2px solid #10b981 !important; background: ${cardBg} !important;
                        color: #10b981 !important; font-size: 0.875rem; font-weight: 700;
                        cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px;
                        transition: all 0.2s !important; box-shadow: none !important;
                    }
                    .dl-btn-pdf:hover { background: #10b981 !important; color: #fff !important; }
                    .dl-btn-sub { font-size: 0.72rem; font-weight: 400; color: ${textMuted} !important; }
                `;
                document.head.appendChild(s);

                const btnJson = document.getElementById('btn-json');
                const btnPdf  = document.getElementById('btn-pdf');
                btnJson.addEventListener('click', () => { Swal.close(); handleDownloadJSON(); });
                btnPdf.addEventListener('click',  () => { Swal.close(); handleDownloadPDF(); });
            }
        });
    };

    const handleChangePassword = () => {
        setPwdForm({ current: '', newPwd: '', confirm: '' });
        setPwdShow({ current: false, newPwd: false, confirm: false });
        setShowPwdModal(true);
    };

    const submitChangePassword = async () => {
        const { current, newPwd, confirm } = pwdForm;
        if (!current || !newPwd || !confirm) { toast.error('Completa todos los campos'); return; }
        if (newPwd.length < 6) { toast.error('La nueva contraseña debe tener al menos 6 caracteres'); return; }
        if (newPwd !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
        setPwdSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/auth/change-password', { currentPassword: current, newPassword: newPwd }, { headers: { 'x-auth-token': token } });
            toast.success('Contraseña actualizada correctamente');
            setShowPwdModal(false);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al cambiar la contraseña');
        } finally {
            setPwdSaving(false);
        }
    };

    const getPwdStrength = (p) => {
        if (!p) return null;
        const checks = { length: p.length >= 6, upper: /[A-Z]/.test(p), number: /[0-9]/.test(p), symbol: /[^A-Za-z0-9]/.test(p) };
        let score = 0;
        if (checks.length) score++;
        if (p.length >= 10) score++;
        if (checks.upper) score++;
        if (checks.number) score++;
        if (checks.symbol) score++;
        const missing = [!checks.length && 'Mín. 6 car.', !checks.upper && 'Mayúscula', !checks.number && 'Número', !checks.symbol && 'Símbolo'].filter(Boolean);
        if (score <= 2) return { label: 'Débil', color: '#ef4444', width: '33%', missing };
        if (score <= 4) return { label: 'Media', color: '#f59e0b', width: '66%', missing };
        return { label: 'Fuerte', color: '#10b981', width: '100%', missing };
    };

    const handleDeleteAccount = async () => {
        const isDark   = theme === 'dark';
        const bg       = isDark ? '#1e2025' : '#ffffff';
        const textMain = isDark ? '#f1f5f9'  : '#1e293b';
        const textMuted= isDark ? '#94a3b8'  : '#64748b';
        const inputBg  = isDark ? '#2a2d35'  : '#ffffff';
        const inputBdr = isDark ? '#374151'  : '#e2e8f0';
        const cancelBg = isDark ? '#2a2d35'  : '#f1f5f9';

        const { value: confirm } = await Swal.fire({
            title: 'Eliminar cuenta',
            html: `
                <p style="margin-bottom:8px;color:${textMuted};font-size:0.875rem">Al eliminar tu cuenta perderás acceso permanentemente a todos tus datos, reportes e historial. Esta acción es <strong style="color:${textMain}">irreversible</strong>.</p>
                <p style="margin-bottom:4px;color:${textMuted};font-size:0.875rem">Escribe <strong style="color:${textMain}">ELIMINAR</strong> para confirmar:</p>
            `,
            input: 'text',
            inputPlaceholder: 'ELIMINAR',
            inputAttributes: { autocomplete: 'off' },
            showCancelButton: true,
            confirmButtonText: 'Eliminar mi cuenta',
            cancelButtonText: 'Cancelar',
            icon: 'warning',
            background: bg,
            color: textMain,
            didOpen: () => {
                const input      = Swal.getInput();
                const confirmBtn = Swal.getConfirmButton();
                const cancelBtn  = Swal.getCancelButton();

                if (input) {
                    input.style.cssText = `display:block;width:100%;box-sizing:border-box;padding:0.6rem 0.9rem;border:1.5px solid ${inputBdr};border-radius:8px;font-size:0.9rem;outline:none;box-shadow:none;color:${textMain};background:${inputBg};margin:4px 0 0 0`;
                    input.addEventListener('focus', () => { input.style.borderColor = '#6366f1'; });
                    input.addEventListener('blur',  () => { input.style.borderColor = input.value === 'ELIMINAR' ? '#22c55e' : inputBdr; });
                }

                const updateBtn = () => {
                    const valid = input?.value === 'ELIMINAR';
                    if (confirmBtn) {
                        confirmBtn.disabled = !valid;
                        confirmBtn.style.cssText = `background:${valid ? '#ef4444' : '#fca5a5'};color:#fff;border:none;padding:0.65rem 1.5rem;border-radius:8px;font-weight:700;font-size:0.9rem;cursor:${valid ? 'pointer' : 'not-allowed'};opacity:${valid ? '1' : '0.7'};transition:all 0.2s`;
                    }
                };

                if (confirmBtn) confirmBtn.disabled = true;
                updateBtn();
                input?.addEventListener('input', updateBtn);

                if (cancelBtn) {
                    cancelBtn.style.cssText = `background:${cancelBg};color:${textMuted};border:none;padding:0.65rem 1.5rem;border-radius:8px;font-weight:600;font-size:0.9rem;cursor:pointer`;
                }
            },
            preConfirm: (val) => {
                if (val !== 'ELIMINAR') {
                    Swal.showValidationMessage('Debes escribir ELIMINAR exactamente para continuar.');
                }
            }
        });

        if (confirm !== 'ELIMINAR') return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete('/api/auth/account', {
                headers: { 'x-auth-token': token }
            });
            logout();
            await Swal.fire({
                icon: 'success',
                title: 'Cuenta eliminada',
                text: 'Tu cuenta ha sido eliminada exitosamente.',
                confirmButtonColor: '#6366f1',
                confirmButtonText: 'Aceptar'
            });
        } catch (err) {
            toast.error('Error al eliminar la cuenta: ' + (err.response?.data?.msg || err.message));
        }
    };

    const provinces = ['Azua','Baoruco','Barahona','Dajabón','Distrito Nacional','Duarte','El Seibo','Elías Piña','Espaillat','Hato Mayor','Hermanas Mirabal','Independencia','La Altagracia','La Romana','La Vega','María Trinidad Sánchez','Monseñor Nouel','Monte Cristi','Monte Plata','Pedernales','Peravia','Puerto Plata','Samaná','San Cristóbal','San José de Ocoa','San Juan','San Pedro de Macorís','Sánchez Ramírez','Santiago','Santiago Rodríguez','Santo Domingo','Valverde'];

    const isFemale = user.gender === 'F' || user.gender === 'femenino';
    const genderLabel = user.gender === 'M' || user.gender === 'masculino' ? 'Masculino' : user.gender === 'F' || user.gender === 'femenino' ? 'Femenino' : user.gender || 'No especificado';

    const InfoRow = ({ icon, label, children }) => (
        <div className="pf-info-row">
            <div className="pf-info-icon">{icon}</div>
            <div className="pf-info-content">
                <span className="pf-info-label">{label}</span>
                <div className="pf-info-value">{children}</div>
            </div>
        </div>
    );

    const menuItemStyle = {
        display: 'flex', alignItems: 'center', gap: '0.65rem',
        width: '100%', padding: '0.5rem 0.6rem',
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-main)',
        textAlign: 'left', borderRadius: '9px',
        transition: 'background 0.15s',
        fontFamily: 'inherit',
    };

    return (
        <>
        <div className="pf-page">
            <Navbar />
            <style>{`@keyframes pf-spin { to { transform: rotate(360deg); } }`}</style>

            <div className="pf-body">

                {/* ── LEFT COLUMN ── */}
                <div className="pf-left">

                    {/* Avatar card */}
                    <div className="pf-card pf-avatar-card">
                        <div className="pf-avatar-wrap">
                            <div className="pf-avatar-ring">
                                {uploading && (
                                    <div className="pf-avatar-overlay">
                                        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pf-spin 0.8s linear infinite' }} />
                                    </div>
                                )}
                                {user.avatar
                                    ? <img src={user.avatar} alt="Avatar" className="pf-avatar-img" />
                                    : <User size={56} color="var(--text-muted)" />
                                }
                            </div>
                            <input type="file" id="avatarInput" className="avatar-input-hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />

                            {/* Pencil button + dropdown */}
                            <div style={{ position: 'absolute', bottom: 2, right: 2, zIndex: 20 }}>
                                <button
                                    ref={pencilBtnRef}
                                    className="pf-cam-btn"
                                    onClick={() => {
                                        if (!avatarMenuOpen && pencilBtnRef.current) {
                                            const r = pencilBtnRef.current.getBoundingClientRect();
                                            setAvatarMenuPos({ top: r.bottom + 8, left: r.right });
                                        }
                                        setAvatarMenuOpen(o => !o);
                                    }}
                                    disabled={uploading}
                                    title="Opciones de foto"
                                    style={{ background: uploading ? 'var(--text-muted)' : 'var(--primary)', cursor: uploading ? 'default' : 'pointer' }}
                                >
                                    <Pencil size={14} color="#fff" />
                                </button>

                                {avatarMenuOpen && (
                                    <div ref={avatarMenuRef} style={{
                                        position: 'fixed',
                                        top: avatarMenuPos.top,
                                        left: avatarMenuPos.left,
                                        transform: 'translateX(-100%)',
                                        background: 'var(--surface-solid, #ffffff)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(99,102,241,0.08)',
                                        minWidth: '190px', zIndex: 9000,
                                        overflow: 'hidden',
                                        animation: 'menuPop 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                                    }}>
                                        {/* Header label */}
                                        <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-color)' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Foto de perfil</span>
                                        </div>

                                        <div style={{ padding: '6px' }}>
                                        {user.avatar && (
                                            <button
                                                onClick={() => { setAvatarPreview(true); setAvatarMenuOpen(false); }}
                                                style={menuItemStyle}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', color: '#6366f1', borderRadius: '8px', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Eye size={14} />
                                                </span>
                                                Ver foto
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { triggerFileInput(); setAvatarMenuOpen(false); }}
                                            style={menuItemStyle}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', color: '#6366f1', borderRadius: '8px', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <ImagePlus size={14} />
                                            </span>
                                            {user.avatar ? 'Cambiar foto' : 'Agregar foto'}
                                        </button>
                                        </div>

                                        {user.avatar && (
                                            <div style={{ borderTop: '1px solid var(--border-color)', padding: '6px' }}>
                                                <button
                                                    onClick={() => { handleRemoveAvatar(); setAvatarMenuOpen(false); }}
                                                    style={{ ...menuItemStyle, color: '#ef4444' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: '8px', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Trash2 size={14} />
                                                    </span>
                                                    Eliminar foto
                                                </button>
                                            </div>
                                        )}
                                        <style>{`@keyframes menuPop { from { opacity:0; transform:translateX(-100%) scale(0.93) } to { opacity:1; transform:translateX(-100%) scale(1) } }`}</style>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isEditing ? (
                            <div className="pf-identity">
                                <div className="pf-identity-name">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                    <button onClick={() => setIsEditing(true)} className="pf-edit-icon-btn" title="Editar perfil">
                                        <Edit2 size={15} />
                                    </button>
                                </div>
                                <div className="pf-identity-user">@{user.username}</div>
                                <div className="pf-identity-email">{user.email}</div>
                                {user.role && user.role !== 'user' && (
                                    <span className="pf-role-badge">{user.role}</span>
                                )}
                            </div>
                        ) : (
                            <div className="pf-edit-name-block">
                                <div style={{ textAlign: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.95rem', border: '1px solid var(--border-color)', cursor: 'not-allowed' }}>
                                    {editForm.firstName}
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.95rem', border: '1px solid var(--border-color)', cursor: 'not-allowed' }}>
                                    {editForm.lastName}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats — solo para usuarios normales */}
                    {(!user.role || user.role === 'user') && <div className="pf-card pf-stats-card">
                        <div className="pf-stat" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.07)' }}>
                            <Star size={22} color="var(--success)" />
                            <div className="pf-stat-body">
                                <span className="pf-stat-label">Reputación</span>
                                <span className="pf-stat-value" style={{ color: 'var(--success)' }}>{user.reputation || 0}</span>
                            </div>
                        </div>
                        <div className="pf-stat" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)' }}>
                            <AlertTriangle size={22} color="var(--error)" />
                            <div className="pf-stat-body">
                                <span className="pf-stat-label">Sanciones</span>
                                <span className="pf-stat-value" style={{ color: 'var(--error)' }}>{user.sanctions || 0}</span>
                            </div>
                        </div>
                        <div className="pf-stat" style={{ borderColor: user.isVerified ? 'rgba(99,102,241,0.25)' : 'var(--border-color)', background: user.isVerified ? 'rgba(99,102,241,0.07)' : 'var(--bg-input)' }}>
                            <CheckCircle size={22} color={user.isVerified ? 'var(--primary)' : 'var(--text-muted)'} />
                            <div className="pf-stat-body">
                                <span className="pf-stat-label">Cuenta</span>
                                <span className="pf-stat-value" style={{ color: user.isVerified ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {user.isVerified ? 'Verificada' : 'Sin verificar'}
                                </span>
                            </div>
                        </div>
                    </div>}
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="pf-right" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="pf-card">
                        <div className="pf-card-header">
                            <div className="pf-card-title">
                                <FaUserEdit size={17} color="var(--primary)" />
                                Información Personal
                            </div>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="pf-edit-btn">
                                    <Edit2 size={14} /> Editar
                                </button>
                            )}
                        </div>

                        <div className="pf-info-list">
                            <InfoRow icon={<FaPhoneAlt size={14} color="var(--primary)" />} label="Teléfono">
                                {isEditing
                                    ? <input type="tel" name="phone" value={editForm.phone} onChange={handleEditChange} className="pf-field-input" />
                                    : <span>{user.phone || 'No especificado'}</span>
                                }
                            </InfoRow>

                            <InfoRow icon={<LiaIdCard size={18} color="var(--primary)" />} label="Cédula">
                                {isEditing
                                    ? <input type="text" value={user.cedula || ''} disabled className="pf-field-input" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                                    : <span>{user.cedula || 'No especificada'}</span>
                                }
                            </InfoRow>

                            <InfoRow icon={isFemale ? <BsGenderFemale size={17} color="#ec4899" /> : <BsGenderMale size={17} color="#3b82f6" />} label="Sexo">
                                {isEditing
                                    ? <select disabled className="pf-field-input" style={{ opacity: 0.5, cursor: 'not-allowed' }}><option>{genderLabel}</option></select>
                                    : <span>{genderLabel}</span>
                                }
                            </InfoRow>

                            <InfoRow icon={<LiaBirthdayCakeSolid size={17} color="var(--primary)" />} label="Fecha de Nacimiento">
                                {isEditing
                                    ? <input type="date" name="birthDate" value={editForm.birthDate} onChange={handleEditChange} className="pf-field-input" />
                                    : <span>
                                        {user.birthDate
                                            ? <>{parseLocalDate(user.birthDate).toLocaleDateString('es-DO')} <strong style={{ color: 'var(--primary)' }}>· {calculateAge(user.birthDate)} años</strong></>
                                            : 'No especificada'
                                        }
                                    </span>
                                }
                            </InfoRow>

                            <InfoRow icon={<RiUserLocationLine size={17} color="var(--primary)" />} label="Provincia">
                                {isEditing
                                    ? <select name="birthProvince" value={editForm.birthProvince} onChange={handleEditChange} className="pf-field-input">
                                        <option value="">Selecciona...</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    : <span>{user.birthProvince || 'No especificada'}</span>
                                }
                            </InfoRow>
                        </div>

                        {isEditing && (
                            <div className="pf-edit-footer">
                                <button onClick={handleSaveProfile} disabled={saving} className="pf-btn-save">
                                    <Check size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                                <button onClick={() => setIsEditing(false)} disabled={saving} className="pf-btn-cancel">
                                    <X size={15} /> Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                        <button
                            onClick={handleDownloadModal}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '0.6rem 1.2rem', borderRadius: '8px',
                                border: '1.5px solid var(--primary)', background: 'transparent',
                                color: 'var(--primary)', fontSize: '0.875rem', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
                        >
                            <Download size={15} /> Descargar información
                        </button>
                        <button
                            onClick={handleChangePassword}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '0.6rem 1.2rem', borderRadius: '8px',
                                border: '1.5px solid var(--primary)', background: 'transparent',
                                color: 'var(--primary)', fontSize: '0.875rem', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
                        >
                            <KeyRound size={15} /> Cambiar contraseña
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '0.6rem 1.2rem', borderRadius: '8px',
                                border: '1.5px solid #ef4444', background: 'transparent',
                                color: '#ef4444', fontSize: '0.875rem', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                        >
                            <Trash2 size={15} /> Eliminar mi cuenta
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* ── Change Password Modal ── */}
        {showPwdModal && createPortal((() => {
            const dk = theme === 'dark';
            const C = {
                card:    dk ? '#1a1a2e' : '#ffffff',
                border:  dk ? '#2d2d4e' : '#e2e8f0',
                inputBg: dk ? '#12122a' : '#f8fafc',
                text:    dk ? '#e8e8f2' : '#1e293b',
                muted:   dk ? '#8888aa' : '#64748b',
                primary: '#6366f1',
            };
            const strength = getPwdStrength(pwdForm.newPwd);

            const pwdField = (label, fieldKey) => (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>{label}</div>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={pwdShow[fieldKey] ? 'text' : 'password'}
                            placeholder={label}
                            value={pwdForm[fieldKey]}
                            onChange={e => setPwdForm(p => ({ ...p, [fieldKey]: e.target.value }))}
                            onFocus={() => setPwdFocused(fieldKey)}
                            onBlur={() => setPwdFocused(null)}
                            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '0.75rem 2.8rem 0.75rem 0.9rem', border: `1.5px solid ${pwdFocused === fieldKey ? C.primary : C.border}`, borderRadius: 10, background: C.inputBg, color: C.text, fontSize: '0.92rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                        />
                        <span
                            onMouseDown={e => { e.preventDefault(); setPwdShow(p => ({ ...p, [fieldKey]: !p[fieldKey] })); }}
                            style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: pwdShow[fieldKey] ? C.primary : C.muted, display: 'flex', lineHeight: 0, userSelect: 'none' }}
                        >
                            {pwdShow[fieldKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </span>
                    </div>
                </div>
            );

            return (
                <div onClick={() => setShowPwdModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', fontFamily: 'inherit' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <KeyRound size={20} color={C.primary} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: C.text, lineHeight: 1.2 }}>Cambiar contraseña</div>
                                <div style={{ fontSize: '0.82rem', color: C.muted, marginTop: 3 }}>Actualiza tu clave de acceso</div>
                            </div>
                        </div>

                        {pwdField('Contraseña actual', 'current')}
                        {pwdField('Nueva contraseña', 'newPwd')}

                        {strength && (
                            <div style={{ marginTop: '-0.4rem', marginBottom: '1rem' }}>
                                <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                                    <div style={{ height: '100%', borderRadius: 99, background: strength.color, width: strength.width, transition: 'width 0.3s,background 0.3s' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: strength.missing.length ? C.muted : '#10b981' }}>
                                        {strength.missing.length ? `Falta: ${strength.missing.join(', ')}` : '✓ Contraseña segura'}
                                    </span>
                                    <span style={{ fontWeight: 700, color: strength.color }}>{strength.label}</span>
                                </div>
                            </div>
                        )}

                        {pwdField('Confirmar nueva contraseña', 'confirm')}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                            <button type="button" onClick={() => setShowPwdModal(false)} style={{ flex: 1, padding: '0.72rem', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text, fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancelar
                            </button>
                            <button type="button" onClick={submitChangePassword} disabled={pwdSaving} style={{ flex: 1, padding: '0.72rem', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: pwdSaving ? 'not-allowed' : 'pointer', opacity: pwdSaving ? 0.7 : 1, fontFamily: 'inherit' }}>
                                {pwdSaving ? 'Guardando…' : 'Cambiar'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        })(), document.body)}

        {/* Avatar preview modal */}
        {avatarPreview && user.avatar && (
            <div
                onClick={() => setAvatarPreview(false)}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(8, 8, 20, 0.82)',
                    backdropFilter: 'blur(16px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'avFadeIn 0.22s ease',
                }}
            >
                {/* Close button top-right */}
                <button
                    onClick={() => setAvatarPreview(false)}
                    style={{
                        position: 'fixed', top: '1.25rem', right: '1.25rem',
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.18)',
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', animation: 'avPopIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>

                    {/* Glow rings */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.25)', animation: 'avPulse 2.5s ease-in-out infinite' }} />
                        <div style={{ position: 'absolute', width: 290, height: 290, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.15)' }} />

                        {/* Photo circle */}
                        <div style={{
                            width: 260, height: 260,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 0 0 6px rgba(99,102,241,0.2), 0 32px 80px rgba(0,0,0,0.6)',
                        }}>
                            <img src={user.avatar} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>

                    {/* Name + username */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: '2px' }}>
                            @{user.username}
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes avFadeIn { from { opacity:0 } to { opacity:1 } }
                    @keyframes avPopIn  { from { transform:scale(0.8) translateY(20px); opacity:0 } to { transform:scale(1) translateY(0); opacity:1 } }
                    @keyframes avPulse  { 0%,100% { transform:scale(1); opacity:0.6 } 50% { transform:scale(1.04); opacity:1 } }
                `}</style>
            </div>
        )}
        </>
    );
};

export default Profile;
