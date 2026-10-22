import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolClass, School, SchoolSettings, BulletinTemplate } from '../types';
import { 
  StudentRankResult, 
  ClassRankSummary,
  groupSubjectResults,
  getCouncilDecisionMentions
} from './gradingUtils';

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
  const schoolName = cleanText((settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (school?.name || 'COMPLEXE SCOLAIRE LE TEMPLE DU SAVOIR'));
  const motto = cleanText(school?.motto || settings.motto || 'SAVOIR - AGIR - ETRE - FAIRE');
  const arrêté = cleanText(school?.officialCode || 'Arr: 417/MESFTPRIJ/DC/SGM/DESG/DEP/DPP/SGSI/SA du 05/12/2014');
  const phone = cleanText(school?.phone || settings.phone || '+229 95 05 65 92 / 96 28 75 45');
  const city = cleanText(school?.city || (settings.city ? settings.city.split('-')[0].trim() : 'Godomey'));
  const academicYear = cleanText(settings.academicYear || '2023-2024');
  const className = cleanText(schoolClass?.name || student.level || '6ème');
  const directorTitle = cleanText(template?.directorTitle || 'Le Directeur Général');
  const directorName = cleanText(school?.directorName || settings.directorName || 'Adébayo I. BAKARY');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Watermark Filigrane (Repeated subtle WEXOMIN in background)
  doc.saveGraphicsState();
  doc.setTextColor(242, 243, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('WEXOMIN', pageWidth / 2, pageHeight / 2 - 30, { align: 'center', angle: 30 });
  doc.text('WEXOMIN', pageWidth / 2, pageHeight / 2 + 30, { align: 'center', angle: 30 });
  doc.restoreGraphicsState();

  // 2. Official Header (République du Bénin & Ministère & Complexe Scolaire)
  // Left: Circular Logo box
  const logoBoxWidth = 32;
  const headerCenterWidth = contentWidth - logoBoxWidth;

  // School crest circular representation
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.circle(margin + 16, margin + 12, 10, 'S');
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('COMPLEXE', margin + 16, margin + 9, { align: 'center' });
  doc.text('SCOLAIRE', margin + 16, margin + 12, { align: 'center' });
  doc.text('SAVOIR', margin + 16, margin + 15, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(motto, margin + 16, margin + 25, { align: 'center' });
  doc.setFontSize(5);
  doc.text('DISCIPLINE • TRAVAIL', margin + 16, margin + 28, { align: 'center' });

  // Center: Header Texts
  const headerCenterX = margin + logoBoxWidth + (headerCenterWidth / 2);
  let curY = margin + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉPUBLIQUE DU BÉNIN', headerCenterX, curY, { align: 'center' });
  curY += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('************', headerCenterX, curY, { align: 'center' });
  curY += 3;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    'Ministère des Enseignements Secondaire, Technique et de la Formation Professionnelle,',
    headerCenterX,
    curY,
    { align: 'center' }
  );
  curY += 2.5;
  doc.text(
    "de la Reconversion et de l'Insertion des Jeunes",
    headerCenterX,
    curY,
    { align: 'center' }
  );
  curY += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('************', headerCenterX, curY, { align: 'center' });
  curY += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolName.toUpperCase(), headerCenterX, curY, { align: 'center' });
  curY += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(arrêté, headerCenterX, curY, { align: 'center' });
  curY += 2.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(city, headerCenterX, curY, { align: 'center' });
  curY += 2.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tél: ${phone}`, headerCenterX, curY, { align: 'center' });
  curY += 3;

  // Header separator line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, curY, margin + contentWidth, curY);
  curY += 3.5;

  // 3. Bulletin Title & Subtitle Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BULLETIN DE NOTES', pageWidth / 2, curY, { align: 'center' });
  curY += 3.5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `ANNÉE SCOLAIRE: ${academicYear}      CLASSE: ${className}      ${trimester} ème TRIMESTRE`,
    pageWidth / 2,
    curY,
    { align: 'center' }
  );
  curY += 3;

  // 4. Student Identification Box (Left) & Nouveau / Redoublant (Right)
  const idBoxY = curY;
  const idBoxHeight = 16;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(margin, idBoxY, contentWidth, idBoxHeight, 'FD');

  const idLeftWidth = contentWidth * 0.65;
  const idRightWidth = contentWidth * 0.35;
  doc.line(margin + idLeftWidth, idBoxY, margin + idLeftWidth, idBoxY + idBoxHeight);

  // Left Details: Nom, Prénoms, Matricule, Sexe
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Nom :', margin + 3, idBoxY + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.lastName.toUpperCase(), margin + 24, idBoxY + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Prénoms :', margin + 3, idBoxY + 7.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.firstName, margin + 24, idBoxY + 7.6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('N° Matricule :', margin + 3, idBoxY + 11.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.registrationNumber || '2361077', margin + 24, idBoxY + 11.4);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Sexe :', margin + 3, idBoxY + 14.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.gender || 'M', margin + 24, idBoxY + 14.8);

  // Right Details: Nouveau / Redoublant & Effectif
  const isRedoublant = student.status === 'TRANSFERE' || (student.medicalNotes && student.medicalNotes.toLowerCase().includes('redoubl'));
  const rightX = margin + idLeftWidth + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('NOUVEAU', rightX, idBoxY + 4.5);
  doc.rect(rightX + 30, idBoxY + 2.2, 3, 3);
  if (!isRedoublant) {
    doc.text('X', rightX + 30.7, idBoxY + 4.5);
  }

  doc.text('REDOUBLANT', rightX, idBoxY + 9);
  doc.rect(rightX + 30, idBoxY + 6.7, 3, 3);
  if (isRedoublant) {
    doc.text('X', rightX + 30.7, idBoxY + 9);
  }

  doc.text(`EFFECTIF :  ${classSummary?.totalStudents || 14}`, rightX, idBoxY + 13.8);

  // 5. Grades Table with Group Clusters (Scientifiques, Littéraires, Autres)
  const tableStartY = idBoxY + idBoxHeight + 2;

  const headRow = [
    'MATIERES',
    'COEF',
    'INT 1',
    'INT 2',
    'Moy. INT',
    'DEV 1',
    'DEV 2',
    'COMPO',
    'MOY/20',
    'Moy. Coef',
    'RANG',
    'APPRECIATIONS'
  ];

  const subjectGroups = groupSubjectResults(studentRank.subjectResults);
  const tableBody: any[] = [];

  subjectGroups.forEach(group => {
    // Add subjects in this group
    group.items.forEach(item => {
      const interroAvgVal = item.interroAverage !== undefined ? item.interroAverage.toFixed(2) : (item.interro1 !== undefined ? item.interro1.toFixed(2) : '-');
      const dev1Val = item.devoirMark !== undefined ? item.devoirMark.toFixed(2) : '-';
      const dev2Val = item.devoir2Mark !== undefined ? item.devoir2Mark.toFixed(2) : '-';
      const compoVal = item.compoMark !== undefined ? item.compoMark.toFixed(2) : '-';

      tableBody.push([
        item.subject.name,
        String(item.coefficient || 1),
        item.interro1 !== undefined ? item.interro1.toFixed(2) : '-',
        item.interro2 !== undefined ? item.interro2.toFixed(2) : '-',
        interroAvgVal,
        dev1Val,
        dev2Val,
        compoVal,
        item.grades.length > 0 ? item.average.toFixed(2) : '-',
        item.grades.length > 0 ? item.weightedAverage.toFixed(2) : '-',
        item.grades.length > 0 ? (item.subjectRank || '-') : '-',
        item.grades.length > 0 ? item.appreciation : '-'
      ]);
    });

    // Subtotal row for group
    tableBody.push([
      { content: group.name, styles: { fontStyle: 'bolditalic' as const, fillColor: [241, 245, 249] } },
      { content: String(group.totalCoeff), styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [241, 245, 249] } },
      { content: '', colSpan: 6, styles: { fillColor: [241, 245, 249] } },
      { content: group.groupAverage > 0 ? group.groupAverage.toFixed(2) : '-', styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [241, 245, 249] } },
      { content: group.totalWeightedPoints > 0 ? group.totalWeightedPoints.toFixed(2) : '-', styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [241, 245, 249] } },
      { content: '', colSpan: 2, styles: { fillColor: [241, 245, 249] } }
    ]);
  });

  // Footer Row
  const footRow = [
    { content: `Toutes Matières: ${studentRank.totalCoefficients}`, styles: { halign: 'left' as const, fontStyle: 'bold' as const } },
    { content: '', colSpan: 6, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: 'TOTAL GENERAL :', styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: studentRank.totalWeightedPoints.toFixed(2), colSpan: 2, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
    { content: '', colSpan: 2 }
  ];

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [headRow],
    body: tableBody,
    foot: [footRow],
    theme: 'grid',
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 6.2,
      halign: 'center',
      cellPadding: 1.2,
      lineColor: [30, 41, 59],
      lineWidth: 0.25
    },
    styles: {
      fontSize: 6.2,
      cellPadding: 1.1,
      lineColor: [30, 41, 59],
      lineWidth: 0.25,
      textColor: [15, 23, 42]
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      cellPadding: 1.3,
      lineColor: [30, 41, 59],
      lineWidth: 0.25
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 40 },
      1: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 11 },
      3: { halign: 'center', cellWidth: 11 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 11 },
      6: { halign: 'center', cellWidth: 11 },
      7: { halign: 'center', cellWidth: 12 },
      8: { halign: 'center', cellWidth: 13, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      10: { halign: 'center', cellWidth: 11 },
      11: { halign: 'left', cellWidth: 'auto' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 1.5;

  // 6. Class Statistics 5-Cell Strip
  const statBoxHeight = 7.5;
  const statColWidth = contentWidth / 5;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, finalY, contentWidth, statBoxHeight, 'FD');

  for (let i = 1; i < 5; i++) {
    doc.line(margin + (statColWidth * i), finalY, margin + (statColWidth * i), finalY + statBoxHeight);
  }

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const statItems = [
    { label: 'MOYENNE TRIMESTRIELLE', value: studentRank.overallAverage.toFixed(2) },
    { label: 'RANG TRIM', value: studentRank.rank },
    { label: 'FORTE MOYENNE', value: (classSummary?.highestAverage || 0).toFixed(2) },
    { label: 'FAIBLE MOYENNE', value: (classSummary?.lowestAverage || 0).toFixed(2) },
    { label: 'MOYENNE DE LA CLASSE', value: (classSummary?.classAverage || 0).toFixed(2) }
  ];

  statItems.forEach((st, idx) => {
    const boxCenterX = margin + (statColWidth * idx) + (statColWidth / 2);
    doc.text(st.label, boxCenterX, finalY + 2.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(st.value, boxCenterX, finalY + 6.3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
  });

  // 7. Decision du Conseil des Professeurs (Left) & Signature du Directeur (Right)
  const bottomY = finalY + statBoxHeight + 2;
  const bottomBoxWidth = (contentWidth - 3) / 2;
  const bottomBoxHeight = 35;

  const council = getCouncilDecisionMentions(
    studentRank.overallAverage,
    trimester,
    className,
    student.status === 'EXCLU'
  );

  // Left Box: Conseil
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.rect(margin, bottomY, bottomBoxWidth, bottomBoxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('DECISION DU CONSEIL DES PROFESSEURS', margin + (bottomBoxWidth / 2), bottomY + 3.5, { align: 'center' });
  doc.line(margin, bottomY + 5, margin + bottomBoxWidth, bottomY + 5);

  // Mentions sub-table
  const mentionRowHeight = 2.8;
  const mentionsList = [
    { label: 'FELICITATIONS', checked: council.felicitations },
    { label: 'ENCOURAGEMENTS', checked: council.encouragements },
    { label: "TABLEAU D'HONNEUR", checked: council.tableauHonneur },
    { label: 'AVERTISSEMENT', checked: council.avertissement },
    { label: 'BLAME', checked: council.blame },
    { label: 'RENVOI', checked: council.renvoi }
  ];

  let mY = bottomY + 5;
  mentionsList.forEach(m => {
    doc.rect(margin + 2, mY, bottomBoxWidth - 4, mentionRowHeight);
    doc.line(margin + bottomBoxWidth - 12, mY, margin + bottomBoxWidth - 12, mY + mentionRowHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(m.label, margin + 4, mY + 2.1);
    if (m.checked) {
      doc.text('X', margin + bottomBoxWidth - 7, mY + 2.1, { align: 'center' });
    }
    mY += mentionRowHeight;
  });

  // Appreciation du Directeur & Décision
  const appY = mY + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Appréciation du Directeur', margin + 3, appY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text('Travail....', margin + 3, appY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text(council.appreciationDirecteur, margin + 20, appY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.text('DECISION :', margin + 3, appY + 7);
  doc.setTextColor(26, 54, 93);
  doc.text(council.decision.toUpperCase(), margin + 20, appY + 7);
  doc.setTextColor(15, 23, 42);

  // Right Box: Signature et Cachet du Directeur
  const signatureBoxX = margin + bottomBoxWidth + 3;
  doc.setFillColor(255, 255, 255);
  doc.rect(signatureBoxX, bottomY, bottomBoxWidth, bottomBoxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('SIGNATURE ET CACHET DU DIRECTEUR', signatureBoxX + (bottomBoxWidth / 2), bottomY + 3.5, { align: 'center' });
  doc.line(signatureBoxX, bottomY + 5, signatureBoxX + bottomBoxWidth, bottomY + 5);

  const dateFormatted = new Date().toLocaleDateString('fr-FR');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(`${city.toUpperCase()}, le ${dateFormatted}`, signatureBoxX + (bottomBoxWidth / 2), bottomY + 9, { align: 'center' });

  // Stamp Box / Signature area
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(signatureBoxX + (bottomBoxWidth / 2) - 20, bottomY + 12, 40, 13);
  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('[ Signature & Cachet Officiel ]', signatureBoxX + (bottomBoxWidth / 2), bottomY + 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(directorName, signatureBoxX + (bottomBoxWidth / 2), bottomY + 31, { align: 'center' });

  // 8. Trimester History & Absences Strip
  const historyY = bottomY + bottomBoxHeight + 1.5;
  const historyHeight = 7;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.rect(margin, historyY, contentWidth, historyHeight, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(51, 65, 85);

  const moyTri1Text = trimester === 1 ? studentRank.overallAverage.toFixed(2) : '-';
  const moyTri2Text = trimester === 2 ? studentRank.overallAverage.toFixed(2) : '-';
  const moyAnnuelleText = studentRank.overallAverage.toFixed(2);

  doc.text(`Moy 1er Tri: ${moyTri1Text}`, margin + 5, historyY + 2.8);
  doc.text(`Moy 2e Tri: ${moyTri2Text}`, margin + 45, historyY + 2.8);
  doc.text(`Moy Annuelle: ${moyAnnuelleText}`, margin + 85, historyY + 2.8);
  doc.text(`Rang: ${studentRank.rank}`, margin + 130, historyY + 2.8);

  doc.line(margin, historyY + 3.8, margin + contentWidth, historyY + 3.8);
  doc.text("Nbre d'absences : 0", margin + 5, historyY + 6);
  doc.text("Nbre de retards : 0", margin + 85, historyY + 6);

  // 9. Legal Notice & Software Credits
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(6);
  doc.setTextColor(51, 65, 85);
  doc.text('NB: Conservez précieusement ce bulletin, aucun double ne sera établi.', pageWidth / 2, pageHeight - 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('wexomin 1.1.7.1 Powered by TIC SOLUTION Tel (+229) 62 80 97 78 / 95 08 07 99 e-mail: ticsolution13@gmail.com', pageWidth / 2, pageHeight - 4, { align: 'center' });
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
