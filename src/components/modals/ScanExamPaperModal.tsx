import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { ExamPaper, ExamType } from '../../types';
import { AIExamCopilotChat } from '../AIExamCopilotChat';
import { ExamContentRenderer, cleanAndFormatMathText, parseSquareRoots } from '../ExamContentRenderer';
import {
  FileText,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  Printer,
  Download,
  X,
  BookOpen,
  Building,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  Trash2,
  Eye,
  Award,
  Layers,
  SquareEqual,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Split,
  Maximize2,
  Minimize2,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ClipboardPaste,
  FileCode,
  FileSpreadsheet,
  HelpCircle,
  Wand2,
  FolderOpen
} from 'lucide-react';

interface ScanExamPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperCreated?: (paper: ExamPaper) => void;
  initialTab?: 'IMAGE' | 'TEXT' | 'DEMO';
}

const DRAFT_STORAGE_KEY = 'GESTIONNAIRE_SCOLAIRE_EXAM_SCAN_ACTIVE_DRAFT';

const EXAM_PRESETS = [
  {
    id: 'MATHS',
    label: '📐 Mathématiques (Algèbre & Géométrie)',
    subject: 'Mathématiques',
    classLevel: '3ème',
    text: `DEVOIR SURVEILLÉ N°1 DU PREMIER TRIMESTRE
Matière : Mathématiques | Classe : 3ème A | Durée : 02H00 | Coefficient : 3
Consignes : Calculatrices non autorisées. Justifier soigneusement chaque étape de vos calculs.

EXERCICE 1 : CALCUL NUMÉRIQUE ET POLYNÔMES (6 points)
1) On donne A = √(75) - 4√(12) + √(27).
   Écrire A sous la forme a√(3) où a est un nombre entier relatif.
2) On considère le polynôme P(x) = (2x - 3)² - (x + 1)².
   a) Développer, réduire et ordonner P(x).
   b) Factoriser P(x) sous la forme d'un produit de deux facteurs du premier degré.
   c) Résoudre dans ℝ l'équation (x - 4)(3x - 2) = 0.

EXERCICE 2 : GÉOMÉTRIE DU TRIANGLE ET TRIGONOMÉTRIE (6 points)
Soit un triangle ABC rectangle en A tel que AB = 6 cm et AC = 8 cm.
1) Démontrer par le théorème de Pythagore que BC = 10 cm.
2) Calculer les valeurs exactes de cos(ABC) et sin(ABC).
3) Soit H le projeté orthogonal de A sur la droite (BC). Calculer la hauteur exacte AH.
[FIGURE GÉOMÉTRIQUE : Triangle ABC rectangle en A avec hypoténuse BC et hauteur AH issue de A]

[--- PAGE 2 / VERSO ---]

PROBLÈME : SITUATION D'ÉVALUATION COMPLEXE (8 points)
Le directeur du complexe scolaire souhaite faire clôturer le jardin botanique rectangulaire de l'établissement.
Le terrain a une Longueur L = x + 15 mètres et une Largeur l = x mètres.
Le périmètre total clôturé mesure exactement 110 mètres.
1) Traduire les données par une équation du premier degré en x.
2) Déterminer la valeur de x, puis les dimensions réelles L et l du jardin.
3) Le grillage coûte 2 500 FCFA le mètre linéaire et la main d'œuvre forfaitaire s'élève à 35 000 FCFA.
   Calculer la dépense totale nécessaire pour clôturer entièrement le jardin.`
  },
  {
    id: 'FRANCAIS',
    label: '📚 Français (Compréhension & Rédaction)',
    subject: 'Français',
    classLevel: '4ème',
    text: `DEVOIR SURVEILLÉ DE FRANÇAIS DU 1ER TRIMESTRE
Classe : 4ème B | Durée : 02H00 | Coefficient : 2
Consignes : Soigner l'orthographe, la syntaxe et la propreté de la copie.

I. TEXTE DE LECTURE : L'appel du savoir
« Dès l'aube naissante, les écoliers du village empruntaient le sentier sinueux à travers la forêt. Leurs cartables en bandoulière, ils chantaient avec enthousiasme la gloire des études et l'espoir d'un avenir radieux... »

II. QUESTIONS DE COMPRÉHENSION (6 points)
1) Quel est le thème principal de ce texte ? Relevez deux expressions qui le justifient. (2 pts)
2) Pourquoi les élèves partent-ils si tôt le matin ? (2 pts)
3) Proposez un titre expressif et original à cet extrait. (2 pts)

III. VOCABULAIRE ET MANIEMENT DE LA LANGUE (6 points)
1) Donnez la nature grammaticale et la fonction des mots soulignés dans le premier paragraphe. (2 pts)
2) Mettez la phrase : « Ils chantaient avec enthousiasme » au futur simple puis au plus-que-parfait de l'indicatif. (2 pts)
3) Donnez deux mots de la même famille que « savoir » et employez l'un d'eux dans une phrase personnelle. (2 pts)

[--- PAGE 2 / VERSO ---]

IV. PRODUCTION D'ÉCRIT / EXPRESSION (8 points)
Sujet : Dans un texte argumentatif et narratif d'une vingtaine de lignes, expliquez l'importance de l'instruction et de la lecture dans la vie d'un jeune citoyen. Illustrez vos propos par des exemples concrets tirés de votre quotidien.`
  },
  {
    id: 'PC_SVT',
    label: '🔬 Sciences & Physique-Chimie',
    subject: 'Physique-Chimie',
    classLevel: '3ème',
    text: `COMPOSITION TRIMESTRIELLE - SCIENCES PHYSIQUES
Classe : 3ème | Durée : 02H00 | Coefficient : 3
Consignes : Rédiger avec clarté. Préciser les unités pour chaque calcul.

PREMIÈRE PARTIE : CHIMIE (8 points)
Exercice 1 : Réactions chimiques et combustion (4 pts)
1) Écrire et équilibrer l'équation de la combustion complète du méthane CH4 dans le dioxygène O2.
2) On brûle 16 g de méthane. Calculer la masse d'eau formée.

Exercice 2 : Solutions acido-basiques et pH (4 pts)
Une solution aqueuse S possède un pH = 2,5 à 25°C.
a) Cette solution est-elle acide, neutre ou basique ? Justifier.
b) On ajoute de l'eau distillée à cette solution. Comment varie le pH ?

[--- PAGE 2 / VERSO ---]

DEUXIÈME PARTIE : PHYSIQUE (12 points)
Exercice 1 : Poids et Masse d'un corps (6 pts)
Un objet a une masse m = 4,5 kg sur la Terre où g = 9,8 N/kg.
1) Calculer l'intensité du poids P de cet objet sur Terre.
2) Que vaut la masse de cet objet sur la Lune ? Justifier votre réponse.

Exercice 2 : Électricité et Loi d'Ohm (6 pts)
Un conducteur ohmique de résistance R = 47 Ω est traversé par un courant d'intensité I = 0,25 A.
1) Énoncer la loi d'Ohm pour un conducteur ohmique.
2) Calculer la tension U aux bornes de ce conducteur.
[FIGURE : Schéma du circuit électrique en série avec générateur, résistor et ampèremètre]`
  },
  {
    id: 'HG',
    label: '🌍 Histoire-Géographie',
    subject: 'Histoire-Géographie',
    classLevel: '3ème',
    text: `DEVOIR D'HISTOIRE ET DE GÉOGRAPHIE DU 1ER TRIMESTRE
Classe : 3ème | Durée : 02H00 | Coefficient : 2

I. HISTOIRE (10 points)
A- Questions de cours (4 pts)
1) Définir : Impérialisme, Traité de Berlin (1884-1885). (2 pts)
2) Citer deux grandes figures de la résistance à la colonisation en Afrique de l'Ouest. (2 pts)

B- Commentaire de document historique (6 pts)
Document : Extrait de la convention coloniale du XIXe siècle...
1) Présenter le document (nature, auteur, contexte historique). (2 pts)
2) Analyser les arguments avancés pour justifier la pénétration coloniale. (4 pts)

[--- PAGE 2 / VERSO ---]

II. GÉOGRAPHIE (10 points)
A- Maîtrise des repères spatiaux (4 pts)
1) Citer les pays frontaliers de notre État ainsi que leurs capitales respectives. (2 pts)
2) Nommer les deux principaux bassins hydrographiques du territoire national. (2 pts)

B- Sujet de synthèse (6 pts)
Dans un paragraphe structuré, analysez les atouts et les défis majeurs de l'agriculture vivrière dans le développement économique régional.`
  }
];

export const ScanExamPaperModal: React.FC<ScanExamPaperModalProps> = ({
  isOpen,
  onClose,
  onPaperCreated,
  initialTab = 'IMAGE'
}) => {
  const { classes, subjects, settings, currentSchool, addExamPaper } = useApp();

  // Retrieve saved draft if available so transcribed paper NEVER disappears
  const savedDraft = React.useMemo(() => {
    try {
      const data = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Error reading exam scan draft:", e);
    }
    return null;
  }, [isOpen]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    savedDraft?.selectedClassId || classes[0]?.id || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    savedDraft?.selectedSubjectId || subjects[0]?.id || ''
  );
  const [examType, setExamType] = useState<ExamType>(
    savedDraft?.examType || 'DEVOIR'
  );

  const [activeInputTab, setActiveInputTab] = useState<'IMAGE' | 'TEXT' | 'DEMO'>(
    initialTab || savedDraft?.activeInputTab || 'IMAGE'
  );

  // Sync initialTab on modal open
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveInputTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Escape key handler for smooth closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Multi-page images support (Recto, Verso, etc.)
  const [scannedImages, setScannedImages] = useState<string[]>(
    savedDraft?.scannedImages || (savedDraft?.imagePreview ? [savedDraft.imagePreview] : [])
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const [pastedText, setPastedText] = useState<string>(
    savedDraft?.pastedText || ''
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const [includeHeader, setIncludeHeader] = useState<boolean>(
    savedDraft?.includeHeader !== undefined ? savedDraft.includeHeader : true
  );
  const [extractedPaper, setExtractedPaper] = useState<{
    title: string;
    subjectName: string;
    className: string;
    duration: string;
    coefficient: number;
    instructions: string;
    content: string;
  } | null>(savedDraft?.extractedPaper || null);

  // View Layout: 'SPLIT' (Side by Side Scan + Word), 'WORD_ONLY' (Full A4 Word), 'EDIT' (Direct Text Edit)
  const [viewMode, setViewMode] = useState<'SPLIT' | 'WORD_ONLY' | 'EDIT'>('SPLIT');

  // Zoom and rotation for original image viewer
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect subject and class from pasted text
  const detectSubjectAndClass = (text: string) => {
    const lower = text.toLowerCase();
    for (const s of subjects) {
      if (lower.includes(s.name.toLowerCase())) {
        setSelectedSubjectId(s.id);
        break;
      }
    }
    for (const c of classes) {
      if (lower.includes(c.name.toLowerCase())) {
        setSelectedClassId(c.id);
        break;
      }
    }
    if (lower.includes("composition") || lower.includes("compo")) {
      setExamType("COMPOSITION");
    } else if (lower.includes("interrogation") || lower.includes("interro")) {
      setExamType("INTERRO");
    } else if (lower.includes("blanc") || lower.includes("test")) {
      setExamType("PROJET");
    } else if (lower.includes("devoir")) {
      setExamType("DEVOIR");
    }
  };

  // Clipboard paste handler
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setPastedText(text);
        detectSubjectAndClass(text);
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3000);
      } else {
        alert("Le presse-papier est vide. Veuillez d'abord copier le texte de l'épreuve.");
      }
    } catch (e) {
      const manual = prompt("Collez le texte de l'épreuve ici :");
      if (manual && manual.trim()) {
        setPastedText(manual);
        detectSubjectAndClass(manual);
      }
    }
  };

  // Text file upload handler (.txt, .docx, .doc, .md)
  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPastedText(text);
        detectSubjectAndClass(text);
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  // Insert tag helper
  const insertTagAtCursor = (tag: string) => {
    setPastedText(prev => (prev ? `${prev.trim()}\n\n${tag}\n` : `${tag}\n`));
  };

  // Synchronize draft state to localStorage on every change
  useEffect(() => {
    if (extractedPaper || scannedImages.length > 0 || pastedText) {
      const draftObj = {
        extractedPaper,
        includeHeader,
        selectedClassId,
        selectedSubjectId,
        examType,
        scannedImages,
        imagePreview: scannedImages[0] || null,
        pastedText,
        activeInputTab,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
    }
  }, [extractedPaper, includeHeader, selectedClassId, selectedSubjectId, examType, scannedImages, pastedText, activeInputTab]);

  const handleResetDraft = () => {
    if (confirm("Voulez-vous réinitialiser et commencer la numérisation d'une nouvelle épreuve ?")) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setExtractedPaper(null);
      setScannedImages([]);
      setActiveImageIndex(0);
      setPastedText('');
      setViewMode('SPLIT');
      setSyncStatusMessage(null);
    }
  };

  if (!isOpen) return null;

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0] || { id: '', name: 'Classe', level: '' };
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0] || { id: '', name: 'Matière', coefficient: 2 };

  // Calculate text metrics
  const textWordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
  const textCharCount = pastedText.length;
  const textLineCount = pastedText ? pastedText.split('\n').length : 0;
  const detectedExercisesCount = (pastedText.match(/(?:EXERCICE|PROBLÈME|PARTIE|ACTIVITÉ|SITUATION)/gi) || []).length;

  // SVG Demo handwritten exam paper image
  const demoExamPaperSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none"><rect width="600" height="750" fill="%23FFFDF5"/><rect x="20" y="20" width="560" height="710" rx="8" stroke="%23334155" stroke-width="2"/><text x="40" y="50" font-family="serif" font-size="14" font-weight="bold" fill="%231E293B">MANUSCRIT - DEVOIR DE MATHEMATIQUES 3EME A</text><text x="40" y="70" font-family="serif" font-size="12" fill="%23475569">Durée : 02H | Coeff : 3 | Prof: KPANOU</text><line x1="40" y1="80" x2="560" y2="80" stroke="%2394A3B8" stroke-width="1.5"/><text x="40" y="110" font-family="cursive" font-size="16" fill="%230F172A">Exercice 1 : Equations et polynomes (6 pts)</text><text x="40" y="140" font-family="cursive" font-size="14" fill="%231E293B">1) Résoudre 3x - 7 = 11</text><text x="40" y="165" font-family="cursive" font-size="14" fill="%231E293B">2) Factoriser P(x) = (x + 2)^2 - 9</text><text x="40" y="190" font-family="cursive" font-size="14" fill="%231E293B">3) Calculer P(0) et P(-2)</text><text x="40" y="230" font-family="cursive" font-size="16" fill="%230F172A">Exercice 2 : Géométrie analytique (6 pts)</text><text x="40" y="260" font-family="cursive" font-size="14" fill="%231E293B">Soient A(1, 4) et B(5, 2) dans un repere orthonorme.</text><text x="40" y="285" font-family="cursive" font-size="14" fill="%231E293B">a) Determiner les coordonnees du vecteur AB.</text><text x="40" y="310" font-family="cursive" font-size="14" fill="%231E293B">b) Calculer la distance AB.</text><text x="40" y="360" font-family="cursive" font-size="16" fill="%230F172A">Probleme : Clôture du terrain de l'école (8 pts)</text><text x="40" y="390" font-family="cursive" font-size="14" fill="%231E293B">Le directeur souhaite entourer le jardin scolaire.</text><text x="40" y="415" font-family="cursive" font-size="14" fill="%231E293B">Longueur L = x + 10, Largeur l = x.</text><text x="40" y="440" font-family="cursive" font-size="14" fill="%231E293B">Le perimetre vaut 100m. Trouver x et l'aire.</text></svg>`;

  const demoExamText = `DEVOIR SURVEILLÉ N°1 DU PREMIER TRIMESTRE
Matière : Mathématiques | Classe : 3ème A | Durée : 02H00 | Coefficient : 3
Consignes : Calculatrices non autorisées. La qualité de la rédaction sera évaluée.

EXERCICE 1 : ÉQUATIONS ET FACTORISATION (6 points)
1) Résoudre dans ℝ l'équation suivante : 3x - 7 = 11.
2) On donne le polynôme P(x) = (x + 2)² - 9.
   a) Développer, réduire et ordonner P(x).
   b) Factoriser P(x).
   c) Calculer P(0) et P(-2).

EXERCICE 2 : GÉOMÉTRIE VECTORIELLE (6 points)
Dans un repère orthonormé (O, I, J), on donne les points A(1, 4) et B(5, 2).
1) Déterminer les coordonnées du vecteur AB.
2) Calculer la distance exacte AB.
3) Déterminer le milieu M du segment [AB].

PROBLÈME : SITUATION COMPLEXE (8 points)
Le directeur du complexe souhaite entourer le jardin botanique de l'école.
Le terrain a une forme rectangulaire de Longueur L = x + 10 mètres et de Largeur l = x mètres.
Le périmètre clôturé vaut exactement 100 mètres.
1) Traduire la situation par une équation du premier degré.
2) Déterminer la valeur de x, puis les dimensions L et l du jardin.
3) Calculer l'aire totale du jardin en m².`;

  // Process High-Resolution Image Helper
  const processImageFile = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (!rawResult) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Keep high resolution up to 2400px for pristine OCR fidelity
        const maxDim = 2400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          callback(compressedDataUrl);
        } else {
          callback(rawResult);
        }
      };
      img.onerror = () => {
        callback(rawResult);
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        processImageFile(file, (dataUrl) => {
          newImages.push(dataUrl);
          processedCount++;
          if (processedCount === files.length) {
            setScannedImages(prev => [...prev, ...newImages]);
            setActiveImageIndex(0);
          }
        });
      } else {
        // Text file fallback
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            setPastedText(text);
            setActiveInputTab('TEXT');
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const handleAppendFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        processImageFile(file, (dataUrl) => {
          setScannedImages(prev => {
            const updated = [...prev, dataUrl];
            setActiveImageIndex(updated.length - 1);
            return updated;
          });
        });
      }
    });
  };

  // Run AI OCR Examination paper processing
  const handleScanPaper = async (withHeader: boolean = includeHeader) => {
    if (activeInputTab === 'IMAGE' && scannedImages.length === 0) {
      alert("Veuillez importer au moins une photo ou un scan de l'épreuve.");
      return;
    }
    if (activeInputTab === 'TEXT' && !pastedText.trim()) {
      alert("Veuillez coller le texte de l'épreuve.");
      return;
    }

    setIncludeHeader(withHeader);
    setIsProcessing(true);
    setSyncStatusMessage("Numérisation et transcription mot à mot en cours...");

    try {
      const payload = {
        images: activeInputTab === 'IMAGE' ? scannedImages : (activeInputTab === 'DEMO' ? [demoExamPaperSvg] : []),
        imageData: activeInputTab === 'IMAGE' ? scannedImages[0] : (activeInputTab === 'DEMO' ? demoExamPaperSvg : null),
        textContent: activeInputTab === 'TEXT' ? pastedText : (activeInputTab === 'DEMO' ? demoExamText : null),
        targetSubject: currentSubject?.name || 'Matière',
        targetClass: currentClass?.name || 'Classe',
        examType: examType,
        schoolName: settings.schoolName,
        includeHeader: withHeader
      };

      const res = await fetch('/api/ai/scan-exam-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Erreur de connexion au serveur de transcription");
      }

      const data = await res.json();

      setExtractedPaper({
        title: data.title || `DEVOIR SURVEILLÉ - ${(currentSubject?.name || 'MATIÈRE').toUpperCase()}`,
        subjectName: data.subjectName || currentSubject?.name || 'Matière',
        className: data.className || currentClass?.name || 'Classe',
        duration: data.duration || '02 Heures',
        coefficient: typeof data.coefficient === 'number' ? data.coefficient : (currentSubject?.coefficient || 2),
        instructions: data.instructions || 'Rédiger avec soin et clarté.',
        content: data.content || "Exercice 1 :\n\n..."
      });

      setSyncStatusMessage("✨ Transcription 100% synchronisée avec l'épreuve importée !");
      setViewMode('SPLIT');

    } catch (err: any) {
      console.error("Erreur Scan Épreuve:", err);
      alert("La numérisation a rencontré un problème. Veuillez vérifier la photo et réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Perfect Synchronization & Alignment with Scanned Image
  const handleSynchronizeWithScan = async () => {
    if (!extractedPaper) return;
    if (scannedImages.length === 0 && !pastedText) {
      alert("Aucune image scannée n'est disponible pour la synchronisation.");
      return;
    }

    setIsSynchronizing(true);
    setSyncStatusMessage("Vérification minutieuse et réalignement avec l'image scannée...");

    try {
      const res = await fetch('/api/ai/sync-exam-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: scannedImages,
          imageData: scannedImages[0] || null,
          currentPaper: extractedPaper,
          targetSubject: currentSubject?.name,
          targetClass: currentClass?.name
        })
      });

      if (!res.ok) throw new Error("Erreur de synchronisation");

      const data = await res.json();

      setExtractedPaper({
        title: data.title || extractedPaper.title,
        subjectName: data.subjectName || extractedPaper.subjectName,
        className: data.className || extractedPaper.className,
        duration: data.duration || extractedPaper.duration,
        coefficient: data.coefficient || extractedPaper.coefficient,
        instructions: data.instructions || extractedPaper.instructions,
        content: data.content || extractedPaper.content
      });

      const count = data.correctionsCount || 0;
      setSyncStatusMessage(
        count > 0
          ? `✅ Synchronisation réussie : ${count} ajustement(s) corrigé(s) pour correspondre mot à mot à la feuille !`
          : "✅ Vérification terminée : L'épreuve est 100% conforme et synchronisée avec le scan !"
      );

    } catch (e: any) {
      console.error("Erreur Sync:", e);
      setSyncStatusMessage("Avertissement : Synchronisation locale active.");
    } finally {
      setIsSynchronizing(false);
    }
  };

  // Export formatted Word .doc/.docx Blob
  const handleExportWord = () => {
    if (!extractedPaper) return;

    const logoHtml = (includeHeader && (settings.examHeaderUrl || settings.logoUrl))
      ? `<img src="${settings.examHeaderUrl || settings.logoUrl}" width="80" height="80" style="vertical-align:middle; margin:5px;"/>`
      : '';

    // Process content for Word: Square roots, fractions, Verso break, and SVG figures
    const versoBreakRegex = /\[(?:---|\s)*(?:PAGE 2 \/ VERSO|VERSO|PAGE_BREAK|SAUT DE PAGE)(?:---|\s)*\]/i;
    const hasExplicitVerso = versoBreakRegex.test(extractedPaper.content);

    let contentToProcess = extractedPaper.content;
    if (!hasExplicitVerso) {
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
           ${extractedPaper.subjectName.toUpperCase()} — CLASSE : ${extractedPaper.className.toUpperCase()}
         </div>`
      );
    } else {
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
                Année Scolaire : ${settings.academicYear}
              </td>
            </tr>
          </table>

          <div class="exam-box">
            ${extractedPaper.title}
          </div>

          <table class="info-table">
            <tr>
              <td>MATIÈRE : ${extractedPaper.subjectName.toUpperCase()}</td>
              <td>CLASSE : ${extractedPaper.className.toUpperCase()}</td>
            </tr>
            <tr>
              <td>DURÉE : ${extractedPaper.duration.toUpperCase()}</td>
              <td>COEFFICIENT : ${extractedPaper.coefficient}</td>
            </tr>
          </table>

          ${extractedPaper.instructions ? `<div class="instructions-box">CONSIGNES : ${extractedPaper.instructions}</div>` : ''}
          ` : '';

    const wordDocumentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${extractedPaper.title}</title>
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
    link.download = `EPREUVE_${extractedPaper.subjectName.replace(/\s+/g, '_')}_${extractedPaper.className.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Browser High-Res Print
  const handlePrint = () => {
    window.print();
  };

  // Save Exam Paper to Store
  const handleSaveToStore = () => {
    if (!extractedPaper) return;

    const paperObj = addExamPaper({
      title: extractedPaper.title,
      classId: selectedClassId,
      className: extractedPaper.className,
      subjectName: extractedPaper.subjectName,
      examType: examType,
      trimester: settings.currentTrimester,
      academicYear: settings.academicYear,
      duration: extractedPaper.duration,
      coefficient: extractedPaper.coefficient,
      instructions: extractedPaper.instructions,
      content: extractedPaper.content,
      originalImageUrl: scannedImages[0] || undefined,
      includeHeader: includeHeader
    });

    if (onPaperCreated) {
      onPaperCreated(paperObj);
    }

    alert("Épreuve numérisée et synchronisée enregistrée dans la banque d'épreuves de l'école avec succès !");
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto backdrop-enter"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-7xl w-full shadow-2xl overflow-hidden my-2 flex flex-col max-h-[96vh] modal-enter"
      >
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  OCR & Synchronisation Parfaite IA
                </span>
                <span className="text-xs text-slate-300">• {settings.schoolName}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Scan, Transcription & Synchronisation Côte à Côte d'Épreuves
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {extractedPaper && (
              <div className="hidden sm:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('SPLIT')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    viewMode === 'SPLIT' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vue côte à côte : Scan original à gauche, Document Word à droite"
                >
                  <Split className="h-3.5 w-3.5" />
                  <span>Vue Synchronisée</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('WORD_ONLY')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    viewMode === 'WORD_ONLY' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Aperçu A4 Word grand format"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Document A4 Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('EDIT')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    viewMode === 'EDIT' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mode édition manuelle"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Éditeur Texte</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* PARAMETERS BAR */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-300 mb-1 block">Classe Cible :</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-300 mb-1 block">Matière :</label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Coeff {s.coefficient})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-extrabold text-indigo-600 dark:text-indigo-400 mb-1 block">Type d'Épreuve :</label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value as ExamType)}
                className="w-full p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 font-black text-indigo-900 dark:text-indigo-200"
              >
                <option value="DEVOIR">DEVOIR SURVEILLÉ</option>
                <option value="COMPOSITION">COMPOSITION TRIMESTRIELLE</option>
                <option value="INTERRO">INTERROGATION ÉCRITE</option>
                <option value="PROJET">EXAMEN BLANC / TEST</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-300 mb-1 block">En-Tête Officiel :</label>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5 truncate">
                <Building className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate">{settings.schoolName}</span>
              </div>
            </div>
          </div>

          {/* MAIN DUAL-PANE WORKSPACE */}
          <div className={`grid gap-6 ${extractedPaper && viewMode === 'SPLIT' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 lg:grid-cols-12'}`}>
            
            {/* LEFT PANE: SOURCE IMPORT & SCAN VIEWER (5 cols in SPLIT, 4 cols initially, 12 cols if scan only) */}
            <div className={`${extractedPaper ? (viewMode === 'SPLIT' ? 'lg:col-span-5' : 'hidden') : 'lg:col-span-4'} space-y-4`}>
              
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Camera className="h-4 w-4 text-blue-600" />
                    <span>Épreuve Originale Importée</span>
                  </h3>

                  {scannedImages.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                      {scannedImages.length} page{scannedImages.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Input Method Tabs */}
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black">
                  <button
                    type="button"
                    onClick={() => setActiveInputTab('IMAGE')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      activeInputTab === 'IMAGE'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    <span>Photo / Scan HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInputTab('TEXT')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      activeInputTab === 'TEXT'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    <span>Coller Texte / Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveInputTab('DEMO');
                      setScannedImages([demoExamPaperSvg]);
                      setActiveImageIndex(0);
                      setPastedText(demoExamText);
                    }}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      activeInputTab === 'DEMO'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Démo</span>
                  </button>
                </div>

                {/* Scanned Image Gallery / Zoomable Viewer */}
                {activeInputTab === 'IMAGE' && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                    />

                    <input
                      type="file"
                      ref={appendFileInputRef}
                      onChange={handleAppendFile}
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                    />

                    {scannedImages.length > 0 ? (
                      <div className="space-y-2">
                        
                        {/* Multi-Page Tabs Header */}
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl text-[11px]">
                          <div className="flex items-center space-x-1 overflow-x-auto">
                            {scannedImages.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveImageIndex(idx)}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                  activeImageIndex === idx
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                              >
                                {idx === 0 ? 'Page 1 (Recto)' : idx === 1 ? 'Page 2 (Verso)' : `Page ${idx + 1}`}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => appendFileInputRef.current?.click()}
                            className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 flex items-center space-x-1 shrink-0"
                            title="Ajouter le verso ou une autre page"
                          >
                            <Plus className="h-3 w-3" />
                            <span>+ Page</span>
                          </button>
                        </div>

                        {/* Interactive Image Container with Zoom & Rotation */}
                        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-950 p-2 min-h-[260px] max-h-[460px] flex items-center justify-center group">
                          
                          <div className="overflow-auto max-h-[440px] w-full flex items-center justify-center">
                            <img
                              src={scannedImages[activeImageIndex] || scannedImages[0]}
                              alt={`Page ${activeImageIndex + 1}`}
                              style={{
                                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.15s ease-out'
                              }}
                              className="max-h-[420px] max-w-full object-contain rounded-lg shadow-lg"
                            />
                          </div>

                          {/* Floating Zoom & Control Bar */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-white text-xs shadow-xl opacity-90 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                              className="p-1 rounded-full hover:bg-white/20"
                              title="Dézoomer"
                            >
                              <ZoomOut className="h-3.5 w-3.5" />
                            </button>

                            <span className="font-mono font-bold text-[10px] px-1">
                              {Math.round(zoomLevel * 100)}%
                            </span>

                            <button
                              type="button"
                              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                              className="p-1 rounded-full hover:bg-white/20"
                              title="Zoomer"
                            >
                              <ZoomIn className="h-3.5 w-3.5" />
                            </button>

                            <div className="h-3 w-px bg-slate-700 mx-1" />

                            <button
                              type="button"
                              onClick={() => setRotation(prev => (prev + 90) % 360)}
                              className="p-1 rounded-full hover:bg-white/20"
                              title="Faire pivoter"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setZoomLevel(1);
                                setRotation(0);
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700"
                            >
                              1:1
                            </button>
                          </div>

                          {/* Delete Current Page Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = scannedImages.filter((_, i) => i !== activeImageIndex);
                              setScannedImages(updated);
                              setActiveImageIndex(Math.max(0, activeImageIndex - 1));
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-md"
                            title="Supprimer cette page"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-center cursor-pointer space-y-2 group transition-all"
                      >
                        <div className="h-12 w-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          Prendre en photo l'épreuve manuscrite ou imprimée
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Supporte les devoirs manuscrits, photos de livre, formules mathématiques et plusieurs pages (Recto / Verso).
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text / Word Input Tab (Studio de Numérisation de Texte Word) */}
                {activeInputTab === 'TEXT' && (
                  <div className="space-y-2.5">
                    {/* Hidden text file input */}
                    <input
                      type="file"
                      ref={textFileInputRef}
                      onChange={handleTextFileUpload}
                      accept=".txt,.doc,.docx,.rtf,.md,.pdf"
                      className="hidden"
                    />

                    {/* Quick Action Buttons for Pasting */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center space-x-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <ClipboardPaste className="h-4 w-4" />
                        <span>Coller du Presse-Papier</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => textFileInputRef.current?.click()}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                        title="Importer un fichier texte ou document"
                      >
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span>Fichier (.txt, .doc)</span>
                      </button>

                      {pastedText && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Effacer tout le texte collé ?")) {
                              setPastedText('');
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900 transition-colors"
                          title="Effacer le texte"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {copiedNotice && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center space-x-1.5 animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Texte inséré et matière/classe analysées avec succès !</span>
                      </div>
                    )}

                    {/* Presets / Templates Buttons */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Wand2 className="h-3 w-3 text-indigo-500" />
                          <span>Modèles d'épreuves types (1-clic) :</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        {EXAM_PRESETS.map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setPastedText(preset.text);
                              detectSubjectAndClass(preset.text);
                            }}
                            className="p-1.5 rounded-lg text-left font-bold bg-white dark:bg-slate-700/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-600 truncate transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Tags Insert Toolbar */}
                    <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px]">
                      <span className="text-slate-400 font-bold shrink-0">Insérer :</span>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('[--- PAGE 2 / VERSO ---]')}
                        className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black shrink-0"
                        title="Insérer un saut de page pour le verso"
                      >
                        📄 Saut Page (Verso)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('EXERCICE : (6 points)')}
                        className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold shrink-0"
                      >
                        + Exercice (6 pts)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('PROBLÈME : (8 points)')}
                        className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold shrink-0"
                      >
                        + Problème (8 pts)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('√(x)')}
                        className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold shrink-0"
                      >
                        √(x)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('(a)/(b)')}
                        className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold shrink-0"
                      >
                        (a)/(b)
                      </button>
                    </div>

                    {/* Rich Text Area */}
                    <div className="relative">
                      <textarea
                        rows={11}
                        value={pastedText}
                        onChange={e => {
                          setPastedText(e.target.value);
                          detectSubjectAndClass(e.target.value);
                        }}
                        placeholder={`Collez ici le texte copié depuis Microsoft Word, LibreOffice, un PDF, WhatsApp ou Google Docs...\n\nExemple :\nDEVOIR DE MATHÉMATIQUES 3ÈME\nEXERCICE 1 : Calcul numérique (6 pts)\n1) Développer (2x-3)²\n...\n[--- PAGE 2 / VERSO ---]\nPROBLÈME : (8 pts)\n...`}
                        className="w-full p-3.5 text-xs font-mono rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-200/60 dark:border-indigo-900/60 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-slate-100 leading-relaxed shadow-inner"
                      />

                      {/* Floating Text Metrics Badge */}
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700 flex items-center space-x-2">
                        <span>{textWordCount} mots</span>
                        <span>•</span>
                        <span>{textLineCount} lignes</span>
                        {detectedExercisesCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">{detectedExercisesCount} ex. détectés</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Demo Tab description */}
                {activeInputTab === 'DEMO' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs space-y-1.5">
                    <p className="font-extrabold flex items-center space-x-1">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Épreuve Exemple Pré-chargée</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Cliquez ci-dessous pour lancer la transcription mot à mot et la synchronisation avec le document Word.
                    </p>
                  </div>
                )}

                {/* Scan Action Buttons: Avec en-tête et Sans en-tête */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleScanPaper(true)}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-between shadow-md transition-all ${
                      isProcessing && includeHeader
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-left">
                      <div className="p-1.5 rounded-lg bg-white/20">
                        <Building className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs">Transcrire avec En-tête Officiel</div>
                        <div className="text-[10px] text-blue-100 font-normal">Génère l'en-tête de l'école (Logo, Ministère, Cadre)</div>
                      </div>
                    </div>
                    {isProcessing && includeHeader ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScanPaper(false)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between border transition-all ${
                      isProcessing && !includeHeader
                        ? 'bg-slate-700 text-white cursor-not-allowed border-slate-600'
                        : 'bg-slate-800 hover:bg-slate-900 text-slate-100 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-left">
                      <div className="p-1.5 rounded-lg bg-slate-700">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs">Transcrire sans En-tête (Pur)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Transcription directe des exercices & figures</div>
                      </div>
                    </div>
                    {isProcessing && !includeHeader ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <SquareEqual className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT PANE: SYNCHRONIZED WORD DOCUMENT & ACTIONS (7 cols in SPLIT, 8 cols initially, 12 cols in WORD_ONLY) */}
            <div className={`${extractedPaper ? (viewMode === 'SPLIT' ? 'lg:col-span-7' : 'lg:col-span-12') : 'lg:col-span-8'} space-y-4`}>
              
              {extractedPaper ? (
                <div className="space-y-4">
                  
                  {/* Top Action & Synchronization Toolbar */}
                  <div className="p-3 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs shadow-lg">
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSynchronizeWithScan}
                        disabled={isSynchronizing}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center space-x-1.5 shadow-md transition-all ${
                          isSynchronizing
                            ? 'bg-amber-600 text-white animate-pulse'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                        }`}
                        title="Vérifier et corriger toute divergence entre l'image scannée et le document Word"
                      >
                        {isSynchronizing ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                        )}
                        <span>🔄 Synchronisation Parfaite IA</span>
                      </button>

                      {/* Header Mode Toggle */}
                      <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl text-[11px] font-bold border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setIncludeHeader(true)}
                          className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                            includeHeader ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Building className="h-3 w-3" />
                          <span>Avec En-tête</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIncludeHeader(false)}
                          className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                            !includeHeader ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <FileText className="h-3 w-3" />
                          <span>Sans En-tête</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleExportWord}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center space-x-1.5 shadow-md transition-all"
                        title="Télécharger l'épreuve format Word (.doc) avec l'en-tête officiel"
                      >
                        <Download className="h-3.5 w-3.5 text-amber-300" />
                        <span>Télécharger Word (.doc)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center space-x-1.5"
                        title="Imprimer directement"
                      >
                        <Printer className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Imprimer</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveToStore}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center space-x-1.5 shadow-md"
                        title="Conserver dans la banque d'épreuves de l'école"
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>Enregistrer</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetDraft}
                        className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white transition-all"
                        title="Réinitialiser"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Real-Time Synchronization Status Banner */}
                  {syncStatusMessage && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/40 text-white text-xs flex items-center justify-between shadow-md">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-slate-200">{syncStatusMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSyncStatusMessage(null)}
                        className="text-slate-400 hover:text-white text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Secretary Copilot Chat to Refine or Modify with IA */}
                  <AIExamCopilotChat
                    paper={extractedPaper}
                    onPaperUpdated={(updated) => {
                      setExtractedPaper(updated);
                      setSyncStatusMessage("✨ Modification appliquée en direct par l'Agent IA !");
                    }}
                  />

                  {/* Mode Selector: Direct Text Edit vs A4 WYSIWYG Document */}
                  {viewMode === 'EDIT' ? (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Édition directe du contenu retranscrit
                        </h4>
                        <button
                          type="button"
                          onClick={() => setViewMode('SPLIT')}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          👁️ Retour Vue Document A4
                        </button>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Titre de l'Épreuve :</label>
                        <input
                          type="text"
                          value={extractedPaper.title}
                          onChange={e => setExtractedPaper({ ...extractedPaper, title: e.target.value })}
                          className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="font-bold block mb-1">Durée :</label>
                          <input
                            type="text"
                            value={extractedPaper.duration}
                            onChange={e => setExtractedPaper({ ...extractedPaper, duration: e.target.value })}
                            className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold block mb-1">Coefficient :</label>
                          <input
                            type="number"
                            value={extractedPaper.coefficient}
                            onChange={e => setExtractedPaper({ ...extractedPaper, coefficient: parseInt(e.target.value) || 1 })}
                            className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold block mb-1">Classe :</label>
                          <input
                            type="text"
                            value={extractedPaper.className}
                            onChange={e => setExtractedPaper({ ...extractedPaper, className: e.target.value })}
                            className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Consignes Générales :</label>
                        <input
                          type="text"
                          value={extractedPaper.instructions}
                          onChange={e => setExtractedPaper({ ...extractedPaper, instructions: e.target.value })}
                          className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold block">Corps des Exercices & Énoncé :</label>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setExtractedPaper({
                                ...extractedPaper,
                                content: extractedPaper.content + '\n\n[--- PAGE 2 / VERSO ---]\n\nPROBLÈME / SITUATION COMPLEXE'
                              })}
                              className="px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-[11px] flex items-center space-x-1"
                              title="Insérer la balise de saut de page Verso"
                            >
                              <Layers className="h-3 w-3" />
                              <span>+ Saut Verso (Page 2)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setExtractedPaper({
                                ...extractedPaper,
                                content: extractedPaper.content + '\n\n<svg viewBox="0 0 320 200" width="100%" max-width="320" xmlns="http://www.w3.org/2000/svg" class="my-3"><rect width="320" height="200" fill="#f8fafc" rx="8" stroke="#cbd5e1"/><path d="M40 160 L280 160 L160 40 Z" fill="none" stroke="#0f172a" stroke-width="2"/><circle cx="160" cy="40" r="3" fill="#0f172a"/><circle cx="40" cy="160" r="3" fill="#0f172a"/><circle cx="280" cy="160" r="3" fill="#0f172a"/><text x="30" y="175" font-weight="bold">A</text><text x="285" y="175" font-weight="bold">B</text><text x="155" y="30" font-weight="bold">C (90°)</text></svg>\n\n'
                              })}
                              className="px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[11px] flex items-center space-x-1"
                              title="Insérer un schéma SVG de figure géométrique"
                            >
                              <SquareEqual className="h-3 w-3" />
                              <span>+ Figure SVG</span>
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={14}
                          value={extractedPaper.content}
                          onChange={e => setExtractedPaper({ ...extractedPaper, content: e.target.value })}
                          className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ) : (
                    /* A4 Document Rendering Box using ExamContentRenderer */
                    <ExamContentRenderer
                      paper={extractedPaper}
                      settings={settings}
                      includeHeader={includeHeader}
                    />
                  )}

                </div>
              ) : (
                <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
                  <FileText className="h-12 w-12 text-slate-400" />
                  <p className="text-sm font-bold">
                    Importez ou scannez une épreuve à gauche pour lancer la transcription fidèle mot à mot et la synchronisation avec l'espace Word.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
