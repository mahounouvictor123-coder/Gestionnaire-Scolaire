import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SchoolClass, Subject, Teacher, TimetableSlot, SchoolSettings, School } from '../types';

export interface TimetableExportOptions {
  mode: 'CLASS' | 'TEACHER' | 'ALL_CLASSES';
  currentClass?: SchoolClass;
  currentTeacher?: Teacher;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  slots: TimetableSlot[];
  settings: SchoolSettings;
  currentSchool?: School | null;
  showSignature?: boolean;
  showSubjectSummary?: boolean;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['08h00 - 10h00', '10h15 - 12h15', '13h30 - 15h30', '15h45 - 17h45'];

/**
 * Get friendly display name for a teacher
 */
export function getTeacherDisplayName(teacher?: Teacher | null): string {
  if (!teacher) return '';
  if ((teacher as any).name) return (teacher as any).name;
  return `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Enseignant';
}

/**
 * Helper to compute weekly volume hours for a list of slots
 */
export function calculateTimetableStats(
  slots: TimetableSlot[],
  subjects: Subject[],
  teachers: Teacher[]
) {
  const stats: { [key: string]: { name: string; hours: number; teacherName: string } } = {};

  slots.forEach(slot => {
    const sbj = subjects.find(s => s.id === slot.subjectId);
    const tch = teachers.find(t => t.id === slot.teacherId);
    const name = sbj?.name || slot.customSubject || 'Matière';
    const teacherName = getTeacherDisplayName(tch) || slot.customTeacher || 'Professeur attitré';

    if (!stats[name]) {
      stats[name] = {
        name,
        hours: 0,
        teacherName
      };
    }
    stats[name].hours += 2; // Each slot is 2h standard
  });

  return Object.values(stats);
}

/**
 * EXPORT TIMETABLE TO PDF (.pdf)
 * Generates an official, beautifully styled vector PDF with school header, schedule grid, and signatures.
 */
export function exportTimetableToPdf(options: TimetableExportOptions): void {
  const {
    mode,
    currentClass,
    currentTeacher,
    classes,
    subjects,
    teachers,
    slots,
    settings,
    currentSchool,
    showSignature = true,
    showSubjectSummary = true
  } = options;

  // A4 Landscape is optimal for a 6-day timetable
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const schoolName = (currentSchool?.name && currentSchool.name.trim()) || settings.schoolName || 'ÉTABLISSEMENT SCOLAIRE';
  const academicYear = currentSchool?.academicYear || settings.academicYear || '2025-2026';
  const motto = currentSchool?.motto || settings.motto || 'Discipline • Travail • Rigueur';
  const city = currentSchool?.city || settings.city || 'Bénin';
  const phone = currentSchool?.phone || settings.phone || '';

  // Determine classes to print
  const targetClasses: SchoolClass[] = mode === 'ALL_CLASSES'
    ? classes
    : mode === 'CLASS' && currentClass
    ? [currentClass]
    : classes.length > 0
    ? [classes[0]]
    : [];

  const renderSingleSchedule = (
    cls: SchoolClass | null,
    tch: Teacher | null,
    classSlots: TimetableSlot[],
    isFirstPage: boolean
  ) => {
    if (!isFirstPage) {
      doc.addPage('a4', 'landscape');
    }

    const pageWidth = doc.internal.pageSize.getWidth(); // ~297mm
    let currentY = 10;

    // 1. TOP OFFICIAL HEADER
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    // Left Column: Ministry / Nation
    const ministryLines = (settings.ministryHeader || "RÉPUBLIQUE DU BÉNIN\nMINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE").split('\n');
    let leftY = currentY;
    ministryLines.forEach(line => {
      doc.text(line.trim(), 14, leftY);
      leftY += 3.5;
    });

    // Center / School Title
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolName.toUpperCase(), pageWidth / 2, currentY + 3, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text(`« ${motto} »`, pageWidth / 2, currentY + 7.5, { align: 'center' });

    if (phone || city) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`${city} ${phone ? `• Tél: ${phone}` : ''}`, pageWidth / 2, currentY + 11.5, { align: 'center' });
    }

    // Right Column: Academic Year & Code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Année Scolaire : ${academicYear}`, pageWidth - 14, currentY + 2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Code : ${currentSchool?.officialCode || 'DEC-OFFICIEL'}`, pageWidth - 14, currentY + 6, { align: 'right' });
    doc.text(`Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, currentY + 10, { align: 'right' });

    currentY = Math.max(leftY, currentY + 15) + 2;

    // Top dividing decorative line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 4;

    // 2. DOCUMENT TITLE BANNER
    const titleText = mode === 'TEACHER'
      ? `EMPLOI DU TEMPS INDIVIDUEL — ENSEIGNANT : ${getTeacherDisplayName(tch).toUpperCase()}`
      : `EMPLOI DU TEMPS OFFICIEL — CLASSE DE : ${(cls?.name || 'CLASSE').toUpperCase()}`;

    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(14, currentY, pageWidth - 28, 9, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(titleText, pageWidth / 2, currentY + 6, { align: 'center' });
    currentY += 12;

    // Sub-info bar (Salle, effectif, total heures)
    const stats = calculateTimetableStats(classSlots, subjects, teachers);
    const totalHours = stats.reduce((acc, s) => acc + s.hours, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const subInfoParts = [];
    if (mode !== 'TEACHER' && cls) {
      subInfoParts.push(`Salle attitrée : ${cls.room || (cls as any).roomNumber || 'Salle 101'}`);
      subInfoParts.push(`Effectif : ${cls.studentCount || 40} élèves`);
    }
    subInfoParts.push(`Volume Hebdomadaire : ${totalHours} Heures / Semaine`);
    doc.text(subInfoParts.join('     •     '), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    // 3. MAIN TIMETABLE GRID TABLE (AutoTable)
    const tableHead = [['Horaires', ...DAYS]];
    const tableBody: string[][] = [];

    HOURS.forEach(hourStr => {
      const startH = hourStr.split(' - ')[0];
      const row: string[] = [hourStr];

      DAYS.forEach(dayStr => {
        const slot = classSlots.find(
          s => (s.dayOfWeek === dayStr || s.day === dayStr) &&
               (s.startTime === startH || s.startTime?.startsWith(startH.substring(0, 2)))
        );

        if (slot) {
          const sbj = subjects.find(s => s.id === slot.subjectId);
          const teacherObj = teachers.find(t => t.id === slot.teacherId);
          const assignedClass = classes.find(c => c.id === slot.classId);

          const subjectTitle = sbj?.name || slot.customSubject || 'Matière';
          const secondaryInfo = mode === 'TEACHER'
            ? `Cl: ${assignedClass?.name || 'Général'}`
            : (getTeacherDisplayName(teacherObj) || slot.customTeacher || 'Professeur');
          const roomInfo = `[${slot.room || cls?.room || (cls as any)?.roomNumber || 'Salle'}]`;

          row.push(`${subjectTitle}\n${secondaryInfo}\n${roomInfo}`);
        } else {
          row.push('— Libre —');
        }
      });

      tableBody.push(row);
    });

    autoTable(doc, {
      startY: currentY,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: 'middle',
        halign: 'center',
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      columnStyles: {
        0: {
          cellWidth: 32,
          fontStyle: 'bold',
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42]
        }
      },
      didParseCell: (data) => {
        // Highlight active courses vs empty slots
        if (data.section === 'body' && data.column.index > 0) {
          const text = data.cell.text.join(' ');
          if (text.includes('— Libre —')) {
            data.cell.styles.textColor = [148, 163, 184];
            data.cell.styles.fontStyle = 'italic';
            data.cell.styles.fillColor = [255, 255, 255];
          } else {
            data.cell.styles.textColor = [15, 23, 42];
            data.cell.styles.fillColor = [239, 246, 255]; // light blue
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 60;
    let nextY = finalY + 4;

    // 4. SUBJECT SUMMARY (Optional)
    if (showSubjectSummary && stats.length > 0 && nextY < 165) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(`RÉCAPITULATIF DES VOLUMES HORAIRES (${totalHours}h / semaine) :`, 14, nextY);
      nextY += 3.5;

      const summaryParts = stats.map(s => `${s.name} : ${s.hours}h (${s.teacherName})`);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);

      // Split summary into two lines if long
      const half = Math.ceil(summaryParts.length / 2);
      const line1 = summaryParts.slice(0, half).join('   |   ');
      const line2 = summaryParts.slice(half).join('   |   ');

      doc.text(line1, 14, nextY);
      if (line2) {
        doc.text(line2, 14, nextY + 3.5);
        nextY += 3.5;
      }
      nextY += 4;
    }

    // 5. OFFICIAL SIGNATURES BLOCK (at bottom)
    if (showSignature) {
      const sigY = Math.max(nextY, 175);
      const colWidth = (pageWidth - 28) / 3;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, sigY - 2, pageWidth - 14, sigY - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      // Col 1: Censeur / Dir Études
      doc.text('LE CENSEUR / DIR. ÉTUDES', 14 + colWidth / 2, sigY + 2, { align: 'center' });
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Visa Pédagogique', 14 + colWidth / 2, sigY + 5.5, { align: 'center' });

      // Col 2: Professeur / Titulaire
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const titularTitle = cls?.level === 'PRIMAIRE' ? 'LE MAÎTRE TITULAIRE' : 'LE CONSEIL DES PROFESSEURS';
      doc.text(titularTitle, 14 + colWidth + colWidth / 2, sigY + 2, { align: 'center' });
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Pour Information & Exécution', 14 + colWidth + colWidth / 2, sigY + 5.5, { align: 'center' });

      // Col 3: Directeur Général
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('LE DIRECTEUR GÉNÉRAL', 14 + colWidth * 2 + colWidth / 2, sigY + 2, { align: 'center' });
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Cachet & Signature Officielle', 14 + colWidth * 2 + colWidth / 2, sigY + 5.5, { align: 'center' });
    }
  };

  // Render for selected mode
  if (mode === 'TEACHER') {
    renderSingleSchedule(null, currentTeacher || null, slots, true);
  } else if (mode === 'ALL_CLASSES') {
    targetClasses.forEach((cls, idx) => {
      const classSlots = slots.filter(s => s.classId === cls.id);
      renderSingleSchedule(cls, null, classSlots, idx === 0);
    });
  } else {
    const cls = targetClasses[0] || null;
    const classSlots = cls ? slots.filter(s => s.classId === cls.id) : slots;
    renderSingleSchedule(cls, null, classSlots, true);
  }

  // Generate clean filename and trigger browser download
  let safeName = 'Officiel';
  if (mode === 'TEACHER' && currentTeacher) {
    safeName = `Enseignant_${getTeacherDisplayName(currentTeacher).replace(/\s+/g, '_')}`;
  } else if (mode === 'CLASS' && currentClass) {
    safeName = `Classe_${currentClass.name.replace(/\s+/g, '_')}`;
  } else if (mode === 'ALL_CLASSES') {
    safeName = `Toutes_Classes_Pack`;
  }

  const fileName = `Emploi_du_temps_${safeName}_${academicYear.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  doc.save(fileName);
}

/**
 * EXPORT TIMETABLE TO MICROSOFT WORD (.doc)
 * Generates an official Microsoft Word compatible document with header, table, and formatting.
 */
export function exportTimetableToWord(options: TimetableExportOptions): void {
  const {
    mode,
    currentClass,
    currentTeacher,
    classes,
    subjects,
    teachers,
    slots,
    settings,
    currentSchool,
    showSignature = true,
    showSubjectSummary = true
  } = options;

  const schoolName = (currentSchool?.name && currentSchool.name.trim()) || settings.schoolName || 'ÉTABLISSEMENT SCOLAIRE';
  const academicYear = currentSchool?.academicYear || settings.academicYear || '2025-2026';
  const motto = currentSchool?.motto || settings.motto || 'Discipline • Travail • Rigueur';
  const city = currentSchool?.city || settings.city || 'Bénin';
  const phone = currentSchool?.phone || settings.phone || '';

  const targetClasses: SchoolClass[] = mode === 'ALL_CLASSES'
    ? classes
    : mode === 'CLASS' && currentClass
    ? [currentClass]
    : classes.length > 0
    ? [classes[0]]
    : [];

  const buildSingleScheduleHtml = (cls: SchoolClass | null, tch: Teacher | null, classSlots: TimetableSlot[]) => {
    const stats = calculateTimetableStats(classSlots, subjects, teachers);
    const totalHours = stats.reduce((acc, s) => acc + s.hours, 0);

    const titleText = mode === 'TEACHER'
      ? `EMPLOI DU TEMPS INDIVIDUEL — ENSEIGNANT : ${getTeacherDisplayName(tch).toUpperCase()}`
      : `EMPLOI DU TEMPS OFFICIEL — CLASSE DE : ${(cls?.name || 'CLASSE').toUpperCase()}`;

    // Table rows
    const rowsHtml = HOURS.map((hourStr, idx) => {
      const startH = hourStr.split(' - ')[0];
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      const cellsHtml = DAYS.map(dayStr => {
        const slot = classSlots.find(
          s => (s.dayOfWeek === dayStr || s.day === dayStr) &&
               (s.startTime === startH || s.startTime?.startsWith(startH.substring(0, 2)))
        );

        if (slot) {
          const sbj = subjects.find(s => s.id === slot.subjectId);
          const teacherObj = teachers.find(t => t.id === slot.teacherId);
          const assignedClass = classes.find(c => c.id === slot.classId);

          const subjectTitle = sbj?.name || slot.customSubject || 'Matière';
          const secondaryInfo = mode === 'TEACHER'
            ? `Classe : ${assignedClass?.name || 'Général'}`
            : (getTeacherDisplayName(teacherObj) || slot.customTeacher || 'Professeur');
          const roomInfo = `[${slot.room || cls?.room || (cls as any)?.roomNumber || 'Salle 101'}]`;

          return `
            <td style="border:1.5pt solid #1e293b; padding:6pt; text-align:center; background-color:#eff6ff; vertical-align:middle;">
              <div style="font-weight:bold; font-size:10pt; color:#1e3a8a; text-transform:uppercase;">${subjectTitle}</div>
              <div style="font-size:8.5pt; color:#334155; margin-top:2pt;">${secondaryInfo}</div>
              <div style="font-size:7.5pt; color:#64748b; font-family:Consolas, monospace;">${roomInfo}</div>
            </td>
          `;
        } else {
          return `
            <td style="border:1.5pt solid #1e293b; padding:6pt; text-align:center; color:#94a3b8; font-style:italic; font-size:9pt; vertical-align:middle;">
              — Libre —
            </td>
          `;
        }
      }).join('');

      return `
        <tr style="background-color:${bgColor};">
          <td style="border:1.5pt solid #1e293b; padding:6pt; text-align:center; font-weight:bold; background-color:#f1f5f9; font-size:9pt; white-space:nowrap;">
            ${hourStr}<br/><span style="font-size:7.5pt; color:#64748b; font-weight:normal;">(2 heures)</span>
          </td>
          ${cellsHtml}
        </tr>
      `;
    }).join('');

    // Summary Html
    const summaryHtml = (showSubjectSummary && stats.length > 0) ? `
      <div style="margin-top:14pt; padding:8pt; border:1pt solid #cbd5e1; background-color:#f8fafc; font-size:9pt;">
        <div style="font-weight:bold; color:#0f172a; margin-bottom:4pt; text-transform:uppercase;">
          Récapitulatif des Volumes Horaires Hebdomadaires — Total : ${totalHours}h / semaine
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:8.5pt;">
          <tr>
            ${stats.map((s, i) => `
              <td style="padding:3pt 6pt; border:0.5pt solid #e2e8f0; background-color:#ffffff;">
                <strong>${s.name}</strong> : ${s.hours}h <span style="color:#64748b;">(${s.teacherName})</span>
              </td>
              ${(i + 1) % 3 === 0 ? '</tr><tr>' : ''}
            `).join('')}
          </tr>
        </table>
      </div>
    ` : '';

    // Signature Html
    const signatureHtml = showSignature ? `
      <table style="width:100%; margin-top:24pt; border-top:1.5pt solid #cbd5e1; padding-top:10pt; text-align:center; font-size:9pt;">
        <tr>
          <td style="width:33%; vertical-align:top;">
            <div style="font-weight:bold; text-transform:uppercase;">Le Censeur / Dir. Études</div>
            <div style="font-style:italic; color:#64748b; font-size:8pt;">Visa Pédagogique</div>
            <div style="height:50pt; padding-top:20pt; color:#94a3b8; font-style:italic;">[Signature & Date]</div>
          </td>
          <td style="width:33%; vertical-align:top;">
            <div style="font-weight:bold; text-transform:uppercase;">
              ${cls?.level === 'PRIMAIRE' ? 'Le Maître Titulaire' : 'Le Conseil des Professeurs'}
            </div>
            <div style="font-style:italic; color:#64748b; font-size:8pt;">Pour Information & Exécution</div>
            <div style="height:50pt; padding-top:20pt; color:#94a3b8; font-style:italic;">[Vu & Approuvé]</div>
          </td>
          <td style="width:34%; vertical-align:top;">
            <div style="font-weight:bold; text-transform:uppercase;">Le Directeur Général</div>
            <div style="font-style:italic; color:#64748b; font-size:8pt;">Cachet & Signature Officielle</div>
            <div style="height:50pt; padding-top:15pt;">
              ${(currentSchool?.signatureUrl || settings.signatureUrl) ? `
                <img src="${currentSchool?.signatureUrl || settings.signatureUrl}" height="45" style="vertical-align:middle;"/>
              ` : `
                <span style="color:#94a3b8; font-style:italic;">[Cachet de l'Établissement]</span>
              `}
            </div>
          </td>
        </tr>
      </table>
    ` : '';

    return `
      <div style="page-break-after:always; margin-bottom:20pt;">
        <!-- HEADER TABLE -->
        <table style="width:100%; border-bottom:2pt solid #0f172a; padding-bottom:8pt; margin-bottom:12pt;">
          <tr>
            <td style="width:35%; font-size:8.5pt; font-weight:bold; color:#1e293b; vertical-align:top;">
              ${(settings.ministryHeader || "RÉPUBLIQUE DU BÉNIN<br/>MINISTÈRE DES ENSEIGNEMENTS SECONDAIRE").replace(/\n/g, '<br/>')}
            </td>
            <td style="width:40%; text-align:center; vertical-align:top;">
              <div style="font-size:13pt; font-weight:bold; color:#0f172a; text-transform:uppercase;">${schoolName}</div>
              <div style="font-size:8.5pt; font-style:italic; color:#475569;">« ${motto} »</div>
              <div style="font-size:7.5pt; color:#64748b;">${city} ${phone ? `• Tél: ${phone}` : ''}</div>
            </td>
            <td style="width:25%; text-align:right; font-size:8.5pt; vertical-align:top;">
              <div><strong>Année Scolaire :</strong> ${academicYear}</div>
              <div style="color:#64748b; font-size:7.5pt;">Code : ${currentSchool?.officialCode || 'DEC-OFFICIEL'}</div>
            </td>
          </tr>
        </table>

        <!-- TITLE BANNER -->
        <div style="background-color:#0f172a; color:#ffffff; padding:7pt; text-align:center; font-weight:bold; font-size:11pt; border-radius:4pt; margin-bottom:8pt; text-transform:uppercase;">
          ${titleText}
        </div>

        <div style="text-align:center; font-size:8.5pt; color:#475569; margin-bottom:10pt;">
          ${mode !== 'TEACHER' && cls ? `Salle : <strong>${cls.room || (cls as any).roomNumber || 'Salle 101'}</strong> &bull; Effectif : <strong>${cls.studentCount || 40} élèves</strong> &bull; ` : ''}
          Total Heures : <strong style="color:#1e3a8a;">${totalHours} Heures / Semaine</strong>
        </div>

        <!-- TIMETABLE TABLE -->
        <table style="width:100%; border-collapse:collapse; border:2pt solid #0f172a; font-family:'Segoe UI', Arial, sans-serif;">
          <thead>
            <tr style="background-color:#0f172a; color:#ffffff; font-weight:bold; font-size:9.5pt; text-transform:uppercase;">
              <th style="border:1.5pt solid #0f172a; padding:6pt; width:14%;">Horaires</th>
              ${DAYS.map(d => `<th style="border:1.5pt solid #0f172a; padding:6pt; width:14.3%;">${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        ${summaryHtml}
        ${signatureHtml}
      </div>
    `;
  };

  let allSchedulesHtml = '';
  if (mode === 'TEACHER') {
    allSchedulesHtml = buildSingleScheduleHtml(null, currentTeacher || null, slots);
  } else if (mode === 'ALL_CLASSES') {
    allSchedulesHtml = targetClasses.map(cls => {
      const classSlots = slots.filter(s => s.classId === cls.id);
      return buildSingleScheduleHtml(cls, null, classSlots);
    }).join('');
  } else {
    const cls = targetClasses[0] || null;
    const classSlots = cls ? slots.filter(s => s.classId === cls.id) : slots;
    allSchedulesHtml = buildSingleScheduleHtml(cls, null, classSlots);
  }

  const wordDocContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Emploi du Temps</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 841.9pt 595.3pt; /* A4 Landscape */
          mso-page-orientation: landscape;
          margin: 28pt 28pt 28pt 28pt;
        }
        body {
          font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
          margin: 0;
          padding: 0;
          color: #0f172a;
        }
        table { border-collapse: collapse; }
      </style>
    </head>
    <body>
      ${allSchedulesHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocContent], {
    type: 'application/msword;charset=utf-8'
  });

  let safeName = 'Officiel';
  if (mode === 'TEACHER' && currentTeacher) {
    safeName = `Enseignant_${getTeacherDisplayName(currentTeacher).replace(/\s+/g, '_')}`;
  } else if (mode === 'CLASS' && currentClass) {
    safeName = `Classe_${currentClass.name.replace(/\s+/g, '_')}`;
  } else if (mode === 'ALL_CLASSES') {
    safeName = `Toutes_Classes_Pack`;
  }

  const fileName = `Emploi_du_temps_${safeName}_${academicYear.replace(/[^a-zA-Z0-9]/g, '-')}.doc`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * EXPORT TIMETABLE TO EXCEL / CSV (.csv)
 * Clean UTF-8 CSV with BOM for spreadsheet software.
 */
export function exportTimetableToExcel(options: TimetableExportOptions): void {
  const {
    mode,
    currentClass,
    currentTeacher,
    classes,
    subjects,
    teachers,
    slots,
    settings,
    currentSchool
  } = options;

  const schoolName = (currentSchool?.name && currentSchool.name.trim()) || settings.schoolName || 'ÉTABLISSEMENT SCOLAIRE';
  const academicYear = currentSchool?.academicYear || settings.academicYear || '2025-2026';

  let csvContent = '\ufeff'; // BOM for UTF-8 Excel support

  if (mode === 'TEACHER') {
    csvContent += `EMPLOI DU TEMPS ENSEIGNANT - ${getTeacherDisplayName(currentTeacher)}\r\n`;
    csvContent += `Établissement: ${schoolName}\r\n`;
    csvContent += `Année Académique: ${academicYear}\r\n\r\n`;
    csvContent += 'Horaire,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi\r\n';

    HOURS.forEach(h => {
      const startH = h.split(' - ')[0];
      const row = [h];
      DAYS.forEach(d => {
        const slot = slots.find(
          s => (s.dayOfWeek === d || s.day === d) &&
               (s.startTime === startH || s.startTime?.startsWith(startH.substring(0, 2)))
        );
        if (slot) {
          const cls = classes.find(c => c.id === slot.classId);
          const sbj = subjects.find(s => s.id === slot.subjectId);
          row.push(`"${sbj?.name || slot.customSubject || ''} (${cls?.name || ''}) [${slot.room || ''}]"`);
        } else {
          row.push('""');
        }
      });
      csvContent += row.join(',') + '\r\n';
    });
  } else {
    csvContent += `EMPLOI DU TEMPS OFFICIEL - ${currentClass?.name || 'Classe'}\r\n`;
    csvContent += `Établissement: ${schoolName}\r\n`;
    csvContent += `Année Académique: ${academicYear}\r\n`;
    csvContent += `Salle: ${currentClass?.room || (currentClass as any)?.roomNumber || 'Salle 101'}\r\n\r\n`;
    csvContent += 'Horaire,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi\r\n';

    HOURS.forEach(h => {
      const startH = h.split(' - ')[0];
      const row = [h];
      DAYS.forEach(d => {
        const slot = slots.find(
          s => (s.dayOfWeek === d || s.day === d) &&
               (s.startTime === startH || s.startTime?.startsWith(startH.substring(0, 2)))
        );
        if (slot) {
          const sbj = subjects.find(s => s.id === slot.subjectId);
          const tch = teachers.find(t => t.id === slot.teacherId);
          row.push(`"${sbj?.name || slot.customSubject || ''} - ${getTeacherDisplayName(tch) || slot.customTeacher || ''} [${slot.room || currentClass?.room || (currentClass as any)?.roomNumber || ''}]"`);
        } else {
          row.push('""');
        }
      });
      csvContent += row.join(',') + '\r\n';
    });
  }

  let safeName = 'Officiel';
  if (mode === 'TEACHER' && currentTeacher) {
    safeName = `Enseignant_${getTeacherDisplayName(currentTeacher).replace(/\s+/g, '_')}`;
  } else if (currentClass) {
    safeName = `Classe_${currentClass.name.replace(/\s+/g, '_')}`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Emploi_du_temps_${safeName}_${academicYear.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
