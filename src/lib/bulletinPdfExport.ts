import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolClass, School, SchoolSettings, BulletinTemplate } from '../types';
import { StudentRankResult, ClassRankSummary } from './gradingUtils';

export interface BulletinPdfOptions {
  studentRank: StudentRankResult;
  classSummary?: ClassRankSummary;
  schoolClass?: SchoolClass;
  school?: School | null;
  settings: SchoolSettings;
  trimester: 1 | 2 | 3 | number;
  template?: BulletinTemplate;
  showSignature?: boolean;
}

/**
 * Clean string for PDF to avoid encoding issues
 */
function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  return text.trim();
}

/**
 * Generate a single student's bulletin page in the jsPDF document
 */
export function addBulletinPageToPdf(
  doc: jsPDF,
  options: BulletinPdfOptions,
  isFirstPage: boolean = true
) {
  if (!isFirstPage) {
    doc.addPage('a4', 'portrait');
  }

  const {
    studentRank,
    classSummary,
    schoolClass,
    school,
    settings,
    trimester,
    template,
    showSignature = true
  } = options;

  const student = studentRank.student;
  const schoolName = cleanText(school?.name || settings.schoolName || 'ÉTABLISSEMENT SCOLAIRE');
  const motto = cleanText(school?.motto || settings.motto || 'Discipline - Travail - Succès');
  const address = cleanText(school?.address || settings.address || '');
  const phone = cleanText(school?.phone || settings.phone || '');
  const city = cleanText(school?.city || (settings.city ? settings.city.split('-')[0].trim() : ''));
  const academicYear = cleanText(settings.academicYear || '2025-2026');
  const className = cleanText(schoolClass?.name || student.level || 'Classe');
  const headerTitle = cleanText(template?.headerTitle || `BULLETIN TRIMESTRIEL DE NOTES - TRIMESTRE ${trimester}`);
  const directorTitle = cleanText(template?.directorTitle || 'Le Directeur Général');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // 1. Watermark Filigrane (School name angled in light gray)
  doc.saveGraphicsState();
  doc.setTextColor(242, 244, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  // Center diagonal watermark
  const watermarkText = schoolName.length > 25 ? schoolName.substring(0, 25) + '...' : schoolName;
  doc.text(watermarkText.toUpperCase(), pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 35
  });
  doc.restoreGraphicsState();

  // 2. Official Header
  // Top border line
  doc.setDrawColor(26, 54, 93); // Dark Navy Blue
  doc.setLineWidth(1.5);
  doc.line(margin, margin + 26, pageWidth - margin, margin + 26);

  // School Information (Left)
  doc.setTextColor(26, 54, 93);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(schoolName.toUpperCase(), margin, margin + 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(5, 122, 85); // Emerald Green
  doc.text(motto, margin, margin + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 105);
  const contactLine = [address, phone ? `Tél: ${phone}` : '', city].filter(Boolean).join(' • ');
  doc.text(contactLine, margin, margin + 15);

  // Bulletin Title & Academic Year (Right)
  doc.setFillColor(26, 54, 93);
  doc.roundedRect(pageWidth - margin - 72, margin + 1, 72, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(headerTitle.toUpperCase(), pageWidth - margin - 36, margin + 6, { align: 'center' });

  doc.setTextColor(26, 54, 93);
  doc.setFontSize(8);
  doc.text(`Année Scolaire : ${academicYear}`, pageWidth - margin, margin + 14, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 70, 160);
  doc.text(`Trimestre ${trimester} • Classe de ${className}`, pageWidth - margin, margin + 19, { align: 'right' });

  // 3. Student Identification Card Block
  const idBoxY = margin + 29;
  const idBoxHeight = 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, idBoxY, pageWidth - (margin * 2), idBoxHeight, 2, 2, 'FD');

  const colWidth = (pageWidth - (margin * 2)) / 4;

  // Col 1: Student Name & Matricule
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NOM ET PRÉNOMS DE L'ÉLÈVE", margin + 3, idBoxY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const fullName = `${student.lastName.toUpperCase()} ${student.firstName}`;
  doc.text(fullName.length > 28 ? fullName.substring(0, 28) + '...' : fullName, margin + 3, idBoxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Matricule : ", margin + 3, idBoxY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 93);
  doc.text(student.registrationNumber || 'N/A', margin + 16, idBoxY + 17);

  // Col 2: Classe & Sexe / Date Naissance
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("CLASSE & CARACTÉRISTIQUES", margin + colWidth + 3, idBoxY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Classe : ${className}`, margin + colWidth + 3, idBoxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 105);
  doc.text(`Sexe : ${student.gender || 'M'} | Né(e) : ${student.dateOfBirth || '-'}`, margin + colWidth + 3, idBoxY + 17);

  // Col 3: Official Class Rank
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("RANG DANS LA CLASSE", margin + (colWidth * 2) + 3, idBoxY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217); // Purple
  doc.text(`RANG : ${studentRank.rank || '-'}`, margin + (colWidth * 2) + 3, idBoxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`sur ${classSummary?.totalStudents || 1} élève(s)`, margin + (colWidth * 2) + 3, idBoxY + 17);

  // Col 4: Legal Parent / Responsable
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("PARENT / TUTEUR LÉGAL", margin + (colWidth * 3) + 3, idBoxY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const parentName = student.parentName || 'Parent / Tuteur';
  doc.text(parentName.length > 22 ? parentName.substring(0, 22) + '...' : parentName, margin + (colWidth * 3) + 3, idBoxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tél : ${student.parentPhone || '-'}`, margin + (colWidth * 3) + 3, idBoxY + 17);

  // 4. Grades Table using autoTable
  const tableStartY = idBoxY + idBoxHeight + 4;

  const showCoeff = template?.columns?.showCoefficients !== false;
  const showInterro = template?.columns?.showInterroAverage !== false;
  const showDevoir = template?.columns?.showDevoirMark !== false;
  const showCompo = template?.columns?.showCompoMark !== false;
  const showRank = template?.columns?.showSubjectRank !== false;
  const showAppreciation = template?.columns?.showTeacherAppreciation !== false;

  const headRow: string[] = ['DISCIPLINES / MATIÈRES'];
  if (showCoeff) headRow.push('COEFF');
  if (showInterro) headRow.push('INTERRO');
  if (showDevoir) headRow.push('DEVOIR');
  if (showCompo) headRow.push('COMPO');
  headRow.push('MOY. /20');
  if (showRank) headRow.push('RANG');
  if (showAppreciation) headRow.push('APPRÉCIATION DE L\'ENSEIGNANT');

  const tableBody = studentRank.subjectResults.map(item => {
    const row: string[] = [item.subject.name];
    if (showCoeff) row.push(String(item.coefficient || 1));
    if (showInterro) {
      row.push(item.interroAverage !== undefined ? item.interroAverage.toFixed(2) : '-');
    }
    if (showDevoir) {
      row.push(item.devoirMark !== undefined ? item.devoirMark.toFixed(2) : '-');
    }
    if (showCompo) {
      row.push(item.compoMark !== undefined ? item.compoMark.toFixed(2) : '-');
    }
    row.push(item.grades.length > 0 ? item.average.toFixed(2) : '-');
    if (showRank) {
      row.push(item.grades.length > 0 ? (item.subjectRank || '-') : '-');
    }
    if (showAppreciation) {
      const teacherSuffix = item.teacherName ? ` (${item.teacherName})` : '';
      row.push(item.grades.length > 0 ? `${item.appreciation}${teacherSuffix}` : '-');
    }
    return row;
  });

  // Footer Row
  const footRow: string[] = ['TOTAL GÉNÉRAL'];
  if (showCoeff) footRow.push(String(studentRank.totalCoefficients || 1));
  const middleSpanCount = (showInterro ? 1 : 0) + (showDevoir ? 1 : 0) + (showCompo ? 1 : 0);
  for (let i = 0; i < middleSpanCount; i++) {
    footRow.push('');
  }
  footRow.push(`MOYENNE : ${studentRank.overallAverage > 0 ? studentRank.overallAverage.toFixed(2) : '-'} / 20`);
  if (showRank) footRow.push(`RANG : ${studentRank.rank}`);
  if (showAppreciation) footRow.push(`MENTION : ${studentRank.mention}`);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [headRow],
    body: tableBody,
    foot: [footRow],
    theme: 'grid',
    headStyles: {
      fillColor: [26, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [26, 54, 93],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 3;

  // 5. Class Statistics Summary Strip
  if (classSummary) {
    const statBoxHeight = 8;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, finalY, pageWidth - (margin * 2), statBoxHeight, 1.5, 1.5, 'FD');

    const statCol = (pageWidth - (margin * 2)) / 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 58, 138);

    doc.text(`Moyenne Classe : ${classSummary.classAverage.toFixed(2)} / 20`, margin + 4, finalY + 5.5);
    doc.text(`Plus Forte Moyenne : ${classSummary.highestAverage.toFixed(2)} / 20`, margin + statCol + 4, finalY + 5.5);
    doc.text(`Plus Faible Moyenne : ${classSummary.lowestAverage.toFixed(2)} / 20`, margin + (statCol * 2) + 4, finalY + 5.5);
    doc.text(`Taux de Réussite : ${classSummary.passRate.toFixed(1)}% (${classSummary.passedCount} admis)`, margin + (statCol * 3) + 4, finalY + 5.5);
  }

  // 6. Council Appreciation & Director Signature
  const footerY = finalY + (classSummary ? 11 : 3);
  const footerBoxWidth = (pageWidth - (margin * 2) - 8) / 2;

  // Left Box: Conseil de classe
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, footerY, footerBoxWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(26, 54, 93);
  doc.text("APPRÉCIATION DU CONSEIL DE CLASSE", margin + 3, footerY + 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const appreciationText = studentRank.generalAppreciation || "Travail régulier, poursuivez vos efforts.";
  const splitAppreciation = doc.splitTextToSize(`"${appreciationText}"`, footerBoxWidth - 6);
  doc.text(splitAppreciation, margin + 3, footerY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 122, 85);
  doc.text(`DÉCISION : ${studentRank.mention}`, margin + 3, footerY + 20);

  // Right Box: Date & Signature
  const rightBoxX = margin + footerBoxWidth + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const dateFormatted = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Fait à ${city || 'la Direction'}, le ${dateFormatted}`, rightBoxX + (footerBoxWidth / 2), footerY + 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 54, 93);
  doc.text(directorTitle.toUpperCase(), rightBoxX + (footerBoxWidth / 2), footerY + 11, { align: 'center' });

  // Signature & Cachet stamp box
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(rightBoxX + 10, footerY + 14, footerBoxWidth - 20, 10, 1.5, 1.5, 'D');
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('[ Signature & Cachet Officiel ]', rightBoxX + (footerBoxWidth / 2), footerY + 20, { align: 'center' });

  // Bottom Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document officiel généré par le Système de Gestion Scolaire • Tous droits réservés • Édition du ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );
}

/**
 * Download a single student's report card as PDF
 */
export function downloadSingleBulletinPdf(options: BulletinPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  addBulletinPageToPdf(doc, options, true);

  const studentName = cleanText(`${options.studentRank.student.lastName}_${options.studentRank.student.firstName}`)
    .replace(/\s+/g, '_')
    .toUpperCase();
  const className = cleanText(options.schoolClass?.name || options.studentRank.student.level || 'Classe')
    .replace(/\s+/g, '_');
  const filename = `Bulletin_${studentName}_${className}_Trimestre_${options.trimester}.pdf`;

  doc.save(filename);
}

/**
 * Download all students' report cards of a class in a single multi-page PDF
 */
export function downloadClassBulletinsPdf(
  rankings: StudentRankResult[],
  classSummary: ClassRankSummary,
  schoolClass: SchoolClass | undefined,
  school: School | null | undefined,
  settings: SchoolSettings,
  trimester: 1 | 2 | 3 | number,
  template?: BulletinTemplate
) {
  if (!rankings || rankings.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  rankings.forEach((studentRank, idx) => {
    addBulletinPageToPdf(
      doc,
      {
        studentRank,
        classSummary,
        schoolClass,
        school,
        settings,
        trimester,
        template,
        showSignature: true
      },
      idx === 0
    );
  });

  const className = cleanText(schoolClass?.name || 'Classe').replace(/\s+/g, '_');
  const filename = `Bulletins_Complets_${className}_Trimestre_${trimester}.pdf`;

  doc.save(filename);
}
