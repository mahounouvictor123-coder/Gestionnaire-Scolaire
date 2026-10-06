import { ExamPaper, SchoolSettings, School } from '../types';
import { cleanAndFormatMathText, parseSquareRoots } from '../components/ExamContentRenderer';

/**
 * Generates and downloads a formatted Microsoft Word (.doc) file
 * with official school headers, ministerial stamps, and clean recto-verso formatting.
 */
export function exportExamPaperToWord(
  paper: ExamPaper,
  settings: SchoolSettings,
  currentSchool?: School | null
): void {
  const includeHeader = paper.includeHeader !== false;
  const effectiveLogo = settings.examHeaderUrl || settings.logoUrl || currentSchool?.logoUrl || '';
  const logoHtml = (includeHeader && effectiveLogo)
    ? `<img src="${effectiveLogo}" width="80" height="80" alt="Logo École" style="vertical-align:middle; margin:5px; max-width:85px; max-height:85px; object-fit:contain;"/>`
    : '';

  // Check if content has explicit Verso tag or a Problem/Exercice 3 section to break onto Page 2
  const versoBreakRegex = /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/i;
  const hasExplicitVerso = versoBreakRegex.test(paper.content);

  let contentToProcess = paper.content;
  if (!hasExplicitVerso) {
    // Auto-insert Verso break if text contains PROBLÈME, SITUATION COMPLEXE, EXERCICE 3, EXERCICE 4 or CORRIGÉ
    const problemMatch = contentToProcess.match(/\n(?=(?:PROBLÈME|SITUATION COMPLEXE|CORRIGÉ|EXERCICE 3|EXERCICE 4))/i);
    if (problemMatch && problemMatch.index && problemMatch.index > 300) {
      contentToProcess = contentToProcess.substring(0, problemMatch.index) + '\n\n[--- PAGE 2 / VERSO ---]\n\n' + contentToProcess.substring(problemMatch.index);
    }
  }

  let formattedContent = cleanAndFormatMathText(contentToProcess);

  if (includeHeader) {
    formattedContent = formattedContent.replace(
      /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/gi,
      `<br clear="all" style="page-break-before:always; mso-break-type:section-break" />
       <div style="border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:15px; font-family:'Times New Roman', serif; font-size:10pt; font-weight:bold;">
         ${paper.subjectName.toUpperCase()} — CLASSE : ${paper.className.toUpperCase()}
       </div>`
    );
  } else {
    // Sans en-tête / Verso sans en-tête: Pure page break, no borders, no frames, no header text
    formattedContent = formattedContent.replace(
      /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/gi,
      `<br clear="all" style="page-break-before:always; mso-break-type:section-break" />`
    );
  }

  formattedContent = parseSquareRoots(formattedContent, true);
  formattedContent = formattedContent.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)');
  formattedContent = formattedContent.replace(/\n/g, '<br/>');

  const wordHeaderSection = includeHeader ? `
        <!-- PAGE 1 RECTO HEADER -->
        <table class="header-table">
          <tr>
            <td class="header-col" style="width: 42%;">
              ${(settings.ministryHeader || "RÉPUBLIQUE DU BÉNIN<br/>MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE").replace(/\n/g, '<br/>')}
              <br/><br/>
              ${(settings.regionalDirection || "DIRECTION RÉGIONALE DE L'ENSEIGNEMENT").replace(/\n/g, '<br/>')}
            </td>
            <td class="header-col" style="width: 16%;">
              ${logoHtml}
            </td>
            <td class="header-col" style="width: 42%;">
              ÉTABLISSEMENT :<br/>
              <span class="school-title">${(settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') ? settings.schoolName : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE')}</span><br/>
              <em>${settings.motto || currentSchool?.motto || 'Discipline • Travail • Rigueur'}</em><br/>
              Année Scolaire : ${paper.academicYear || settings.academicYear}
            </td>
          </tr>
        </table>

        <div class="exam-box">
          ${paper.title}
        </div>

        <table class="info-table">
          <tr>
            <td>MATIÈRE : ${paper.subjectName.toUpperCase()}</td>
            <td>CLASSE : ${paper.className.toUpperCase()}</td>
          </tr>
          <tr>
            <td>DURÉE : ${paper.duration.toUpperCase()}</td>
            <td>COEFFICIENT : ${paper.coefficient}</td>
          </tr>
        </table>

        ${paper.instructions ? `<div class="instructions-box">CONSIGNES : ${paper.instructions}</div>` : ''}
        ` : '';

  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${paper.title}</title>
      <style>
        @page WordSection1 {
          size: 595.3pt 841.9pt;
          margin: 36pt 36pt 36pt 36pt;
        }
        div.WordSection1 { page: WordSection1; font-family: 'Times New Roman', serif; }
        .header-table { width: 100%; border-bottom: 2px solid #000; margin-bottom: 15px; }
        .header-col { text-align: center; vertical-align: top; font-size: 10pt; font-weight: bold; }
        .school-title { font-size: 12pt; color: #1e3a8a; text-transform: uppercase; font-weight: bold; }
        .exam-box { border: 2px solid #000; background-color: #f8fafc; padding: 10px; text-align: center; font-size: 14pt; font-weight: bold; margin: 15px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .info-table td { border: 1px solid #000; padding: 6px; font-size: 10pt; font-weight: bold; }
        .instructions-box { font-style: italic; font-size: 10pt; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 20px; }
        .content-text { font-size: 11pt; line-height: 1.6; word-wrap: break-word; font-family: 'Times New Roman', serif; }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        ${wordHeaderSection}

        <div class="content-text">
          ${formattedContent}
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeSubject = (paper.subjectName || 'EPREUVE').replace(/\s+/g, '_');
  const safeClass = (paper.className || 'CLASSE').replace(/\s+/g, '_');
  link.download = `EPREUVE_${safeSubject}_${safeClass}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the attached teacher file (original Word .docx, PDF, image)
 */
export function downloadAttachedTeacherFile(paper: ExamPaper): void {
  if (!paper.attachedFileUrl) {
    alert("Aucun fichier attaché à cette épreuve.");
    return;
  }
  const link = document.createElement('a');
  link.href = paper.attachedFileUrl;
  link.download = paper.attachedFileName || `Epreuve_${paper.subjectName}_${paper.className}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
