import React, { useState, useEffect } from 'react';
import { Building, Layers, FileText, CheckCircle2, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { SchoolSettings } from '../types';
import { useApp } from '../lib/store';
import { extractTextFromDocxDataUrl } from '../lib/docxExtractor';

interface ExamContentRendererProps {
  paper: {
    title: string;
    subjectName: string;
    className: string;
    duration: string;
    coefficient: number;
    instructions?: string;
    content: string;
    academicYear?: string;
    originalImageUrl?: string;
    attachedFileUrl?: string;
    attachedFileName?: string;
    attachedFileType?: 'WORD' | 'PDF' | 'IMAGE';
    teacherName?: string;
    teacherId?: string;
    teacherPhone?: string;
    parentInstructions?: string;
    includeHeader?: boolean;
  };
  settings: SchoolSettings;
  showVersoDivider?: boolean;
  includeHeader?: boolean;
}

/**
 * Formats square roots (e.g. \sqrt{...}, √(...), √16) with an HTML top-border bar
 * that extends over the entire covered expression (all factors, terms, and nested roots).
 */
export function parseSquareRoots(text: string, isWordHtml = false): string {
  if (!text) return '';

  let s = text;

  // 1. Convert \sqrt to √ symbol and handle optional cube/nth roots
  s = s.replace(/\\sqrt\[([0-9a-zA-Z]+)\]/g, '<sup>$1</sup>√');
  s = s.replace(/\\sqrt\s*/g, '√');

  // 2. Remove spaces between √ and opening bracket/brace/paren if any
  s = s.replace(/√\s*\{/g, '√{');
  s = s.replace(/√\s*\(/g, '√(');

  // 3. Convert single-token roots like √16, √27, √3, √x to √{16}, √{27}, √{3}, √{x} if not followed by { or (
  s = s.replace(/√([0-9a-zA-Z]+)(?![{(])/g, '√{$1}');

  // HTML opening and closing tags for radical bar
  // Using inline-flex with border-t-2 ensures the overline bar covers all factors/numbers seamlessly
  const openTagReact = '<span class="inline-flex items-baseline font-serif text-slate-900 mx-0.5"><span class="text-base font-bold pr-0.5 select-none">√</span><span class="border-t-2 border-slate-900 px-1 pt-0.5 font-sans">';
  const closeTagReact = '</span></span>';

  const openTagWord = '<span style="display:inline-flex; align-items:baseline; font-family:\'Times New Roman\', serif;"><span style="font-size:11pt; font-weight:bold; padding-right:1px;">√</span><span style="border-top:1.5pt solid #000; padding-top:1px; padding-left:2px; padding-right:2px;">';
  const closeTagWord = '</span></span>';

  const openTag = isWordHtml ? openTagWord : openTagReact;
  const closeTag = isWordHtml ? closeTagWord : closeTagReact;

  // 4. Bottom-up parsing for braces √{...} (innermost roots first)
  let prev = '';
  let iterations = 0;
  while (prev !== s && iterations < 10) {
    prev = s;
    s = s.replace(/√\{([^{}]+)\}/g, `${openTag}$1${closeTag}`);
    iterations++;
  }

  // 5. Bottom-up parsing for parentheses √(...) (innermost roots first)
  prev = '';
  iterations = 0;
  while (prev !== s && iterations < 10) {
    prev = s;
    s = s.replace(/√\(([^()]+)\)/g, `${openTag}$1${closeTag}`);
    iterations++;
  }

  return s;
}

/**
 * Cleans LaTeX dollars ($ / $$), markdown symbols (###, **), and formats math expressions.
 */
export function cleanAndFormatMathText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove markdown headers and bold/italic asterisks
  cleaned = cleaned.replace(/^(?:###|##|#)\s*/gm, '');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');

  // 2. Strip LaTeX dollars ($ and $$)
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  cleaned = cleaned.replace(/\$([^$]+)\$/g, '$1');
  cleaned = cleaned.replace(/\$/g, '');

  // 3. Convert LaTeX math commands to standard Unicode symbols
  cleaned = cleaned
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\leq?/g, '≤')
    .replace(/\\geq?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cap/g, '∩')
    .replace(/\\cup/g, '∪')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftrightarrow/g, '⇔')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\parallel/g, '∥')
    .replace(/\\perp/g, '⊥')
    .replace(/\\degree/g, '°')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\phi|\\varphi/g, 'φ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\delta|\\Delta/g, '∆')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{N\}/g, 'ℕ')
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{Q\}/g, 'ℚ')
    .replace(/\\mathbb\{C\}/g, 'ℂ')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1');

  // 4. Resolve \frac{a}{b}
  let prev = '';
  let iterations = 0;
  while (prev !== cleaned && iterations < 5) {
    prev = cleaned;
    cleaned = cleaned.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    iterations++;
  }

  // 5. Resolve \vec{AB} and \overrightarrow{AB}
  cleaned = cleaned.replace(/\\(?:vec|overrightarrow)\{([^{}]+)\}/g, '$1⃗');

  return cleaned;
}

/**
 * Parses and renders rich exam content containing:
 * 1. Square roots √(expr)
 * 2. Fractions (num)/(den)
 * 3. Vectors AB⃗
 * 4. Superscripts and math symbols (π, ∠, ∆, ², ³, ≠, ≤, ≥, ∈)
 * 5. Embedded SVG geometric figures (<svg>...</svg>)
 */
export const MathAndSvgContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Clean raw text from dollar signs, markdown hashes, etc.
  const cleanedContent = cleanAndFormatMathText(content);

  // Split content by SVG blocks to isolate geometric figures
  const svgRegex = /(<svg[\s\S]*?<\/svg>)/gi;
  const parts = cleanedContent.split(svgRegex);

  return (
    <div className="space-y-3 font-serif text-slate-900 leading-relaxed text-sm sm:text-base">
      {parts.map((part, index) => {
        // If part is an SVG geometric figure, render it directly
        if (part.trim().toLowerCase().startsWith('<svg')) {
          return (
            <div
              key={index}
              className="my-4 p-3 bg-slate-50 border border-slate-300 rounded-xl flex flex-col items-center justify-center overflow-x-auto shadow-sm printable-svg-container"
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }

        // Process text blocks line by line for math symbols and formatting
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (!line.trim()) {
                return <div key={lIdx} className="h-2" />;
              }

              // Format mathematical expressions in line (Square roots with visual overline bar extending over all factors)
              let formattedLine = parseSquareRoots(line, false);

              formattedLine = formattedLine
                // Angles: ∠ABC
                .replace(/\\angle\{([^}]+)\}/g, '∠$1')

                // Superscripts: ^2 -> ², ^3 -> ³
                .replace(/\^2/g, '²')
                .replace(/\^3/g, '³')
                .replace(/\^([0-9n])/g, '<sup>$1</sup>');

              // Headers or Exercise titles
              const isExerciseHeader = /^(?:EXERCICE|SITUATION|PROBLÈME|PARTIE|SECTION|INFORMATIONS|N\.B)/i.test(line.trim());

              return (
                <p
                  key={lIdx}
                  className={`whitespace-pre-wrap ${
                    isExerciseHeader
                      ? 'font-bold font-sans text-slate-950 text-sm sm:text-base mt-3 pb-0.5 border-b border-slate-300'
                      : 'text-slate-900'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ExamContentRenderer: React.FC<ExamContentRendererProps> = ({
  paper,
  settings,
  showVersoDivider = true,
  includeHeader
}) => {
  const [forceVerso, setForceVerso] = useState<boolean>(false);
  const [extractedContent, setExtractedContent] = useState<string>('');

  const isTeacherPaper = !!(paper.teacherName || paper.teacherId);
  // Strict rule: For teacher-submitted exams, NEVER glue school header unless explicitly set to true
  const effectiveIncludeHeader = includeHeader !== undefined 
    ? includeHeader 
    : (paper.includeHeader === true || (!isTeacherPaper && paper.includeHeader !== false));

  // Auto-extract content from attached docx if content is legacy placeholder or empty
  useEffect(() => {
    if (
      paper.attachedFileUrl &&
      (paper.content?.startsWith('Épreuve transmise sous forme de document joint') || !paper.content?.trim()) &&
      (paper.attachedFileType === 'WORD' || paper.attachedFileName?.toLowerCase().endsWith('.docx') || paper.attachedFileUrl.includes('application/vnd.openxmlformats'))
    ) {
      extractTextFromDocxDataUrl(paper.attachedFileUrl).then((res) => {
        if (res && res.trim()) {
          setExtractedContent(res.trim());
        }
      });
    }
  }, [paper.content, paper.attachedFileUrl, paper.attachedFileType, paper.attachedFileName]);

  const activeContent = extractedContent || paper.content || '';

  // Check if content specifies an explicit VERSO / PAGE 2 split
  const versoBreakRegex = /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/i;
  const hasExplicitVerso = versoBreakRegex.test(activeContent);

  let page1Content = activeContent;
  let page2Content = '';

  if (hasExplicitVerso) {
    const parts = activeContent.split(versoBreakRegex);
    page1Content = parts[0] || '';
    page2Content = parts.slice(1).join('\n\n--- VERSO ---\n\n');
  } else if (forceVerso) {
    // Manually split if user toggled forceVerso
    const problemMatch = activeContent.match(/\n(?=(?:PROBLÈME|SITUATION COMPLEXE|CORRIGÉ|EXERCICE 3|EXERCICE 4|EXERCICE 2))/i);
    if (problemMatch && problemMatch.index) {
      page1Content = activeContent.substring(0, problemMatch.index);
      page2Content = activeContent.substring(problemMatch.index);
    } else {
      // Split roughly at mid-point or place placeholder
      const mid = Math.floor(activeContent.length / 2);
      const splitIdx = activeContent.indexOf('\n\n', mid);
      if (splitIdx !== -1 && splitIdx < activeContent.length - 20) {
        page1Content = activeContent.substring(0, splitIdx);
        page2Content = activeContent.substring(splitIdx);
      } else {
        page2Content = "PROBLÈME / SITUATION COMPLEXE (PAGE 2 - VERSO)\n\nVoici le cadre officiel du verso pour les exercices de la deuxième page.";
      }
    }
  } else {
    // If text is long (e.g. contains "PROBLÈME" or "SITUATION COMPLEXE"), auto-detect Verso split point
    const problemMatch = activeContent.match(/\n(?=(?:PROBLÈME|SITUATION COMPLEXE|CORRIGÉ|EXERCICE 3|EXERCICE 4))/i);
    if (problemMatch && problemMatch.index && problemMatch.index > 300) {
      page1Content = activeContent.substring(0, problemMatch.index);
      page2Content = activeContent.substring(problemMatch.index);
    }
  }

  const { currentSchool } = useApp();
  const logoUrl = settings.examHeaderUrl || settings.logoUrl || currentSchool?.logoUrl;

  const isPdf = paper.attachedFileType === 'PDF' || 
    paper.attachedFileName?.toLowerCase().endsWith('.pdf') || 
    paper.attachedFileUrl?.startsWith('data:application/pdf');

  const hasImage = !!(paper.originalImageUrl || (paper.attachedFileType === 'IMAGE' && paper.attachedFileUrl));

  const isPlaceholderText = activeContent.startsWith('Épreuve transmise sous forme de document joint') ||
    activeContent.startsWith('Épreuve originale transmise sous forme de document') ||
    activeContent.startsWith('Épreuve originale scannée / photo');

  const shouldRenderPage1Text = Boolean(
    page1Content && (!isPlaceholderText || (!hasImage && !isPdf))
  );

  return (
    <div className="space-y-8 font-serif text-slate-900 printable-exam-document">
      
      {/* VERSO TOGGLE HELPER BANNER (NON-PRINTABLE) */}
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-sans print:hidden shadow-sm">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {page2Content
              ? 'Page 2 (Verso) est active.'
              : 'Épreuve affichée sur une seule page (Recto).'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setForceVerso(!forceVerso)}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors ${
            page2Content
              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          }`}
        >
          {page2Content ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cadre Verso Actif (2 Pages)</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5" />
              <span>+ Activer le Cadre Verso (Page 2)</span>
            </>
          )}
        </button>
      </div>

      {/* ==================== RECTO (PAGE 1) ==================== */}
      <div className={`bg-white p-6 sm:p-8 rounded-2xl ${effectiveIncludeHeader ? 'border-2 border-slate-900 shadow-md space-y-6' : 'space-y-4 shadow-sm'} page-recto`}>
        
        {/* OFFICIAL SCHOOL HEADER (PAGE 1 ONLY - IF ENABLED) */}
        {effectiveIncludeHeader ? (
          <>
            <div className="border-b-2 border-slate-900 pb-4 grid grid-cols-12 gap-2 items-center text-center text-xs">
              
              {/* Ministry & Direction */}
              <div className="col-span-5 font-bold uppercase leading-tight space-y-1 text-[11px]">
                <p className="whitespace-pre-line">
                  {settings.ministryHeader || "RÉPUBLIQUE DU BÉNIN\nMINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE"}
                </p>
                <p className="text-[10px] text-slate-700 font-medium whitespace-pre-line mt-1">
                  {settings.regionalDirection || "DIRECTION RÉGIONALE DE L'ENSEIGNEMENT"}
                </p>
              </div>

              {/* School Logo */}
              <div className="col-span-2 flex justify-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo École"
                    className="h-16 w-16 object-contain rounded-lg"
                  />
                ) : (
                  <Building className="h-12 w-12 text-slate-400" />
                )}
              </div>

              {/* School Info */}
              <div className="col-span-5 font-bold uppercase leading-tight text-[11px] space-y-0.5">
                <p className="text-blue-900 font-extrabold text-xs">{settings.schoolName}</p>
                <p className="text-[10px] italic font-normal text-slate-600 lowercase">{settings.motto}</p>
                <p className="text-[10px] font-semibold text-slate-800 mt-1">
                  Année Scolaire : {paper.academicYear || settings.academicYear}
                </p>
              </div>

            </div>

            {/* EXAM TITLE BOX */}
            <div className="border-2 border-slate-900 bg-slate-50 p-3 text-center rounded-lg">
              <h3 className="text-lg font-black tracking-wide uppercase font-sans text-slate-950">
                {paper.title}
              </h3>
            </div>

            {/* META INFORMATION TABLE */}
            <div className="grid grid-cols-2 border border-slate-900 text-xs font-bold font-sans">
              <div className="p-2 border-r border-b border-slate-900">
                MATIÈRE : <span className="text-blue-900 uppercase font-black">{paper.subjectName}</span>
              </div>
              <div className="p-2 border-b border-slate-900">
                CLASSE : <span className="text-blue-900 uppercase font-black">{paper.className}</span>
              </div>
              <div className="p-2 border-r border-slate-900">
                DURÉE : <span className="font-extrabold">{paper.duration}</span>
              </div>
              <div className="p-2">
                COEFFICIENT : <span className="font-extrabold">{paper.coefficient}</span>
              </div>
              {paper.teacherName && (
                <div className="col-span-2 p-2 bg-slate-50 border-t border-slate-900 text-xs font-bold font-sans">
                  PROFESSEUR / AUTEUR : <span className="text-blue-900 uppercase font-black">{paper.teacherName.startsWith('Prof.') || paper.teacherName.startsWith('M.') || paper.teacherName.startsWith('Mme') ? paper.teacherName : `Prof. ${paper.teacherName}`}</span>
                </div>
              )}
            </div>

            {/* INSTRUCTIONS */}
            {paper.instructions && (
              <div className="text-center italic text-xs border-b border-dashed border-slate-400 pb-2 text-slate-700">
                <strong>Consignes :</strong> {paper.instructions}
              </div>
            )}
          </>
        ) : (
          /* SANS EN-TÊTE : PURE ÉPREUVE ORIGINALE DU PROFESSEUR */
          isTeacherPaper && (
            <div className="space-y-3 mb-4">
              {/* Document Teacher Header Bar (Visible on screen and in print) */}
              <div className="p-3 bg-slate-50 border border-slate-900 rounded-lg flex items-center justify-between text-xs font-sans print:border-slate-800">
                <div>
                  <span className="font-black text-slate-900 uppercase">PROFESSEUR / AUTEUR : </span>
                  <span className="font-extrabold text-blue-900">
                    {paper.teacherName?.startsWith('Prof.') || paper.teacherName?.startsWith('M.') || paper.teacherName?.startsWith('Mme') ? paper.teacherName : `Prof. ${paper.teacherName}`}
                  </span>
                  {paper.teacherPhone && (
                    <span className="text-slate-600 text-[11px] ml-2 font-mono">({paper.teacherPhone})</span>
                  )}
                </div>
                <div className="text-right text-[11px] font-bold text-slate-700">
                  <span>{paper.subjectName} — {paper.className}</span>
                  {paper.academicYear && <span className="ml-2 text-slate-500 font-normal">({paper.academicYear})</span>}
                </div>
              </div>

              {/* Download original attached file button (screen only) */}
              {paper.attachedFileUrl && (
                <div className="print:hidden flex justify-end">
                  <a
                    href={paper.attachedFileUrl}
                    download={paper.attachedFileName || `Epreuve_${paper.subjectName}`}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Download className="w-3 h-3 text-indigo-600" />
                    <span>Télécharger le fichier original du professeur ({paper.attachedFileName || 'Fichier'})</span>
                  </a>
                </div>
              )}
            </div>
          )
        )}

        {/* AFFICHAGE SCANNÉ SI IMAGE */}
        {hasImage && (
          <div className="my-4 flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <img
              src={paper.originalImageUrl || paper.attachedFileUrl}
              alt="Épreuve originale"
              className="max-w-full rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* AFFICHAGE INTÉGRAL PDF SI DOCUMENT PDF */}
        {isPdf && paper.attachedFileUrl && (
          <div className="my-4 space-y-2">
            <div className="rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm">
              <iframe
                src={paper.attachedFileUrl}
                title="Épreuve PDF"
                className="w-full h-[620px] bg-slate-900 border-0"
              />
            </div>
          </div>
        )}

        {/* CONTENU TEXTUEL / MATHÉMATIQUE / FIGURES SVG */}
        {shouldRenderPage1Text && (
          <MathAndSvgContent content={page1Content} />
        )}

        {/* Footer Page 1 Notice */}
        {page2Content && effectiveIncludeHeader && (
          <div className="pt-4 border-t border-dashed border-slate-300 text-right text-xs font-bold text-slate-500 italic">
            [ Tournez la page — Suite au verso ↗ ]
          </div>
        )}
      </div>

      {/* ==================== VERSO (PAGE 2) ==================== */}
      {/* SANS CADRE NI BANDEAU ARTIFICIEL EN MODE SANS EN-TÊTE / VERSO PUR */}
      {page2Content && (
        <div className={`bg-white p-6 sm:p-8 rounded-2xl ${effectiveIncludeHeader ? 'border-2 border-slate-900 shadow-md space-y-6' : 'space-y-4 shadow-sm'} page-verso print:pt-6 print:break-before-page`}>
          {/* BANDEAU VERSO - UNIQUEMENT SI AVEC EN-TÊTE */}
          {effectiveIncludeHeader && (
            <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between text-xs font-black uppercase text-slate-900 font-sans">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-black text-xs tracking-wider">
                  VERSO — PAGE 2
                </span>
                <span className="text-sm font-bold tracking-tight">{paper.subjectName} — CLASSE : {paper.className}</span>
              </div>
              <div className="text-right text-xs font-semibold text-slate-700">
                {paper.title}
              </div>
            </div>
          )}

          {/* PAGE 2 / VERSO CONTENT */}
          <MathAndSvgContent content={page2Content} />

          {/* FOOTER VERSO - UNIQUEMENT SI AVEC EN-TÊTE */}
          {effectiveIncludeHeader && (
            <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-xs font-bold text-slate-700 font-sans">
              <span>{settings.schoolName} — Page Verso Officielle</span>
              <span className="uppercase font-black text-slate-900">Fin de l'Épreuve</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

