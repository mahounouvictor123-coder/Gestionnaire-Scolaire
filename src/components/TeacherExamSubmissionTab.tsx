import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { Teacher, SchoolClass, Subject, ExamPaper, ExamType } from '../types';
import { 
  FileText, 
  Upload, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Layers, 
  Download, 
  Eye, 
  Trash2, 
  FileUp, 
  Printer, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet,
  FileCheck,
  Award,
  Users,
  Edit3,
  MessageSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { exportExamPaperToWord } from '../lib/examExportUtils';
import { compressExamImage } from '../lib/imageCompression';

interface TeacherExamSubmissionTabProps {
  currentTeacher: Teacher;
}

const CONSIGNE_PRESETS = [
  "Calculatrice interdite",
  "Rendre sur feuille double soignée",
  "Exercices obligatoires à préparer",
  "Devoir de maison noté pour révisions",
  "À rendre impérativement pour le prochain cours",
  "Sujet d'entraînement pour l'Examen Blanc"
];

export const TeacherExamSubmissionTab: React.FC<TeacherExamSubmissionTabProps> = ({ currentTeacher }) => {
  const { 
    currentSchool, 
    classes, 
    subjects, 
    students,
    examPapers, 
    addExamPaper, 
    updateExamPaper,
    deleteExamPaper, 
    addCommunication,
    settings 
  } = useApp();

  // Mode & Form Visibility
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subjectName, setSubjectName] = useState<string>(currentTeacher.subjects[0] || subjects[0]?.name || 'Mathématiques');
  const [examType, setExamType] = useState<ExamType>('DEVOIR_1');
  const [trimester, setTrimester] = useState<number>(settings.currentTrimester || 1);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<string>('2 heures');
  const [coefficient, setCoefficient] = useState<number>(2);
  const [copiesRequested, setCopiesRequested] = useState<number>(() => {
    const cls = classes[0];
    return cls ? cls.studentCount || 40 : 40;
  });
  const [reprographyNotes, setReprographyNotes] = useState<string>('');
  
  // Specific Instructions / Consignes for Parents & Students
  const [parentInstructions, setParentInstructions] = useState<string>('À préparer attentivement pour révisions. Exercices à faire sur feuille de copie double.');
  const [submissionDeadline, setSubmissionDeadline] = useState<string>('');

  // Class Roster Modal State
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);

  // Edit Consignes Modal for already submitted papers
  const [editingConsignesPaper, setEditingConsignesPaper] = useState<ExamPaper | null>(null);
  const [editConsignesText, setEditConsignesText] = useState<string>('');
  const [editConsignesDeadline, setEditConsignesDeadline] = useState<string>('');

  // Filter in list of submitted papers
  const [listFilter, setListFilter] = useState<'ALL' | 'PARENTS' | 'SCHOOL'>('ALL');
  
  // Content Mode: 'FILE' (importer Word / PDF / Image) or 'TEXT' (rédiger directement)
  const [contentMode, setContentMode] = useState<'FILE' | 'TEXT'>('FILE');

  // File Upload State
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [attachedFileType, setAttachedFileType] = useState<'WORD' | 'PDF' | 'IMAGE'>('WORD');
  const [attachedFileSize, setAttachedFileSize] = useState<string>('');

  // Written Text State
  const [writtenContent, setWrittenContent] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('L\'usage de la calculatrice n\'est pas autorisé. Rendre une copie soignée.');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Selected Class & Students details
  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const selectedClassStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students
      .filter(s => s.classId === selectedClassId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, selectedClassId]);

  // When class changes, update recommended copies
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const targetClass = classes.find(c => c.id === newClassId);
    if (targetClass && targetClass.studentCount > 0) {
      setCopiesRequested(targetClass.studentCount);
    }
  };

  // Handle File Input (Word, PDF, Image)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 12MB
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage("Le fichier est trop volumineux (max 12 Mo).");
      return;
    }

    setAttachedFileName(file.name);

    // Detect type
    const lowerName = file.name.toLowerCase();
    let detectedType: 'WORD' | 'PDF' | 'IMAGE' = 'WORD';
    if (lowerName.endsWith('.pdf')) {
      detectedType = 'PDF';
    } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
      detectedType = 'IMAGE';
    } else {
      detectedType = 'WORD';
    }
    setAttachedFileType(detectedType);

    // Auto-fill title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName);
    }

    // Process file: If image, compress it for fast and light Firestore sync (<120KB)
    if (detectedType === 'IMAGE') {
      try {
        const { dataUrl, sizeKb } = await compressExamImage(file, 1400, 0.78);
        setAttachedFileUrl(dataUrl);
        setAttachedFileSize(`${sizeKb} Ko (Optimisé HD)`);
        setErrorMessage(null);
      } catch (err) {
        // Fallback to raw data url
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const res = loadEvt.target?.result as string;
          setAttachedFileUrl(res);
          setAttachedFileSize((file.size / (1024 * 1024)).toFixed(2) + ' Mo');
          setErrorMessage(null);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setAttachedFileSize((file.size / (1024 * 1024)).toFixed(2) + ' Mo');
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const res = loadEvt.target?.result as string;
        setAttachedFileUrl(res);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick insert snippet helper into written content
  const insertSnippet = (snippet: string) => {
    setWrittenContent(prev => prev ? `${prev}\n\n${snippet}` : snippet);
  };

  // AI Assistance: Generate or improve subject outline
  const handleAiGenerateProposal = () => {
    const targetClass = classes.find(c => c.id === selectedClassId);
    setIsAiGenerating(true);

    setTimeout(() => {
      const generatedTemplate = `I. ACTIVITÉS GÉOMÉTRIQUES / EXERCICE 1 (6 points)
1. Construire la figure géométrique demandée en respectant les dimensions prescrites.
2. Démontrer que le triangle ABC est rectangle en A.
3. Calculer la longueur de la hauteur issue de A.

II. ACTIVITÉS NUMÉRIQUES / EXERCICE 2 (6 points)
Soient les expressions numériques A et B :
1. Développer, réduire et ordonner l'expression A.
2. Factoriser B sous la forme d'un produit de facteurs du premier degré.
3. Résoudre dans R l'équation (2x - 3)(x + 4) = 0.

[--- PAGE 2 / VERSO ---]

III. SITUATION D'ÉVALUATION / PROBLÈME (8 points)
Contexte :
Un exploitant agricole de ${currentSchool.city || 'la région'} désire clôturer une parcelle rectangulaire d'aire 1200 m² et y installer un système d'irrigation moderne.
Tâche :
En utilisant vos connaissances mathématiques :
1. Exprimer le périmètre de la clôture en fonction de la largeur x.
2. Déterminer les dimensions optimales pour minimiser les coûts des grillages.
3. Calculer le budget total requis pour la main d'œuvre et les matériaux.`;

      setWrittenContent(generatedTemplate);
      if (!title) {
        setTitle(`Devoir Surveillé de ${subjectName} — ${targetClass?.name || 'Classe'}`);
      }
      setIsAiGenerating(false);
    }, 900);
  };

  // Explicit Destination Submit Handler (School, Parents, or Both)
  const handleSendExamWithDestination = (destination: 'SCHOOL' | 'PARENTS' | 'BOTH') => {
    setErrorMessage(null);

    const targetClass = classes.find(c => c.id === selectedClassId);
    const finalClassName = targetClass ? targetClass.name : 'Toutes classes';

    if (!title.trim()) {
      setErrorMessage("Veuillez renseigner le titre de l'évaluation.");
      return;
    }

    if (contentMode === 'FILE' && !attachedFileUrl) {
      setErrorMessage("Veuillez sélectionner le fichier de votre épreuve (Word, PDF ou Photo scannée).");
      return;
    }

    if (contentMode === 'TEXT' && !writtenContent.trim()) {
      setErrorMessage("Veuillez rédiger le texte de l'épreuve ou des exercices.");
      return;
    }

    setIsSubmitting(true);

    try {
      const summaryContent = contentMode === 'TEXT' 
        ? writtenContent 
        : `Épreuve transmise sous forme de document joint : ${attachedFileName} (${attachedFileSize || 'Fichier'} - ${attachedFileType}).`;

      const isForSchool = destination === 'SCHOOL' || destination === 'BOTH';
      const isForParents = destination === 'PARENTS' || destination === 'BOTH';

      // Add to Centralized Store
      addExamPaper({
        title: title.trim(),
        classId: selectedClassId,
        className: finalClassName,
        subjectName: subjectName.trim(),
        examType: examType,
        trimester: trimester,
        academicYear: settings.academicYear || currentSchool.academicYear || '2025-2026',
        duration: duration,
        coefficient: coefficient,
        instructions: instructions.trim(),
        parentInstructions: parentInstructions.trim(),
        submissionDeadline: submissionDeadline.trim() || undefined,
        content: summaryContent,
        originalImageUrl: attachedFileType === 'IMAGE' ? attachedFileUrl : undefined,
        attachedFileUrl: attachedFileUrl || undefined,
        attachedFileName: attachedFileName || undefined,
        attachedFileType: attachedFileType,
        teacherId: currentTeacher.id,
        teacherName: `${currentTeacher.firstName} ${currentTeacher.lastName}`,
        teacherPhone: currentTeacher.phone,
        schoolId: currentSchool.id,
        status: isForSchool ? 'EN_ATTENTE' : 'VALIDE',
        submissionNotes: reprographyNotes.trim(),
        numberOfCopiesRequested: isForSchool ? copiesRequested : 0,
        examDate: examDate,
        includeHeader: true,
        isAvailableForStudents: isForParents,
        sentToSchool: true, // Always true so it always appears in the main platform's Espace Épreuves Word IA
        sentToParents: isForParents
      });

      // 1. Notification to School Administration (Direction / Censeur)
      addCommunication({
        senderId: currentTeacher.id,
        senderName: `Prof. ${currentTeacher.lastName} (${subjectName})`,
        recipientGroup: 'ADMIN',
        subject: isForSchool 
          ? `Tirage Épreuve demandé : ${title.trim()} (${finalClassName})`
          : `Épreuve Enseignant déposée : ${title.trim()} (${finalClassName})`,
        content: isForSchool 
          ? `Le professeur ${currentTeacher.firstName} ${currentTeacher.lastName} (Tél: ${currentTeacher.phone}) a déposé une épreuve de ${subjectName} pour la classe de ${finalClassName}. Date prévue : ${examDate} (${copiesRequested} exemplaires demandés). Disponible dans l'Espace Épreuves pour validation et tirage.`
          : `Le professeur ${currentTeacher.firstName} ${currentTeacher.lastName} (Tél: ${currentTeacher.phone}) a mis à disposition une épreuve de révision pour la classe de ${finalClassName} : "${title.trim()}". Enregistrée dans l'Espace Épreuves.`,
        channels: ['SMS'],
        sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'LIVRE'
      });

      // 2. Notification to Parents & Students of this class
      if (isForParents) {
        addCommunication({
          senderId: currentTeacher.id,
          senderName: `Prof. ${currentTeacher.lastName} (${subjectName})`,
          recipientGroup: 'PARENTS',
          subject: `📝 Épreuve mise à disposition : ${title.trim()} (${finalClassName})`,
          content: `Le professeur ${currentTeacher.firstName} ${currentTeacher.lastName} a mis à la disposition des élèves de ${finalClassName} l'épreuve de ${subjectName} : "${title.trim()}". Consignes : ${parentInstructions.trim() || 'À consulter et réviser sur l\'application'}.${submissionDeadline ? ` Date limite : ${submissionDeadline}.` : ''} Téléchargeable en Word (.doc) dans votre espace Parents.`,
          channels: ['SMS'],
          sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'LIVRE'
        });
      }

      // Reset form
      setTitle('');
      setAttachedFileUrl('');
      setAttachedFileName('');
      setWrittenContent('');
      setReprographyNotes('');
      setShowForm(false);

      if (destination === 'PARENTS') {
        setSuccessMessage(`✅ Épreuve « ${title.trim()} » transmise avec succès ! Elle apparaît automatiquement chez tous les parents de la classe de ${finalClassName} et y reste conservée définitivement comme une archive.`);
      } else if (destination === 'SCHOOL') {
        setSuccessMessage(`🏫 Épreuve « ${title.trim()} » envoyée avec succès à la Direction et au Censeur pour validation et tirage papier (${copiesRequested} copies demandées) !`);
      } else {
        setSuccessMessage(`🚀 Épreuve « ${title.trim()} » envoyée avec succès : transmise pour tirage à l'école ET apparue automatiquement en archive définitive chez tous les parents de ${finalClassName} !`);
      }
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Consignes Modal
  const handleOpenEditConsignes = (paper: ExamPaper) => {
    setEditingConsignesPaper(paper);
    setEditConsignesText(paper.parentInstructions || paper.instructions || '');
    setEditConsignesDeadline(paper.submissionDeadline || '');
  };

  // Save Updated Consignes and notify parents
  const handleSaveConsignes = () => {
    if (!editingConsignesPaper) return;

    updateExamPaper({
      ...editingConsignesPaper,
      parentInstructions: editConsignesText.trim(),
      submissionDeadline: editConsignesDeadline.trim() || undefined,
      isAvailableForStudents: true,
      sentToParents: true
    });

    // Notify parents of the update
    addCommunication({
      senderId: currentTeacher.id,
      senderName: `Prof. ${currentTeacher.lastName} (${editingConsignesPaper.subjectName})`,
      recipientGroup: 'PARENTS',
      subject: `📢 Mise à jour des consignes : ${editingConsignesPaper.title} (${editingConsignesPaper.className})`,
      content: `Le professeur ${currentTeacher.firstName} ${currentTeacher.lastName} a mis à jour les consignes de l'épreuve "${editingConsignesPaper.title}" : ${editConsignesText.trim()}.${editConsignesDeadline ? ` Date limite : ${editConsignesDeadline}.` : ''}`,
      channels: ['SMS'],
      sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'LIVRE'
    });

    setEditingConsignesPaper(null);
    setSuccessMessage(`✅ Consignes mises à jour et diffusées aux parents de ${editingConsignesPaper.className} avec succès !`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Filter exam papers submitted by this specific teacher
  const mySubmittedPapers = useMemo(() => {
    return examPapers.filter(p => 
      p.teacherId === currentTeacher.id || 
      p.teacherPhone === currentTeacher.phone || 
      (p.teacherName && p.teacherName.toLowerCase().includes(currentTeacher.lastName.toLowerCase()))
    );
  }, [examPapers, currentTeacher]);

  // Filtered by sub-category
  const filteredSubmittedPapers = useMemo(() => {
    return mySubmittedPapers.filter(p => {
      if (listFilter === 'PARENTS') {
        return p.isAvailableForStudents !== false || p.sentToParents;
      }
      if (listFilter === 'SCHOOL') {
        return p.sentToSchool || p.status === 'EN_ATTENTE' || p.status === 'IMPRIME';
      }
      return true;
    });
  }, [mySubmittedPapers, listFilter]);

  const sharedWithParentsCount = useMemo(() => {
    return mySubmittedPapers.filter(p => p.isAvailableForStudents !== false || p.sentToParents).length;
  }, [mySubmittedPapers]);

  const schoolPapersCount = useMemo(() => {
    return mySubmittedPapers.filter(p => p.sentToSchool || p.status === 'EN_ATTENTE' || p.status === 'IMPRIME').length;
  }, [mySubmittedPapers]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Main Action */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/40 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {(currentSchool?.logoUrl || settings.logoUrl) && (
              <img
                src={currentSchool?.logoUrl || settings.logoUrl}
                alt="Logo École"
                className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-white/20 shrink-0"
                title="Logo officiel de l'école automatiquement inclus sur les épreuves Word (.doc) et bulletins"
              />
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-slate-950">
              Espace Épreuves & Devoirs
            </span>
            <span className="text-xs text-blue-300 font-bold">
              {currentTeacher.subjects[0] || 'Enseignant'} • {currentSchool.name}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white mt-1">
            Mise à disposition & Transmission des Épreuves
          </h2>
          <p className="text-xs text-blue-200 mt-0.5 max-w-2xl leading-relaxed">
            Sélectionnez simplement la classe destinataire, ajoutez vos consignes pédagogiques et choisissez la destination : <strong className="text-white">vers l'école</strong> pour le tirage photocopie papier ou <strong className="text-emerald-300">vers les parents d'élèves</strong> où l'épreuve apparaîtra automatiquement et restera archivée définitivement.
          </p>
        </div>

        <button
          onClick={() => { setShowForm(!showForm); setErrorMessage(null); }}
          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center space-x-2 transition-all hover:scale-105 shrink-0 cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Fermer le formulaire' : 'Déposer une Épreuve / Devoir'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center space-x-3 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* FORM: DEPOSIT & SEND EXAM */}
      {showForm && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-blue-600/40 shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-3">
          
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <FileUp className="w-4 h-4 text-blue-400" />
              <span>Formulaire de Dépôt d'Épreuve & Consignes</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Prof. {currentTeacher.lastName.toUpperCase()} {currentTeacher.firstName}
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Titre de l'Épreuve / Devoir <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Devoir Surveillé N°1 de Mathématiques"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Matière :
              </label>
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class, Evaluation Type, Trimester */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 1. Sélection de la Classe Destinataire */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                  <span>1. Sélectionner la Classe Destinataire</span>
                  <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRosterModal(true)}
                  className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Voir l'effectif des élèves et parents qui recevront l'épreuve"
                >
                  <Users className="w-3 h-3" />
                  <span>Voir effectif ({selectedClassStudents.length})</span>
                </button>
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount || students.filter(s => s.classId === c.id).length} élèves & familles)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Type d'Évaluation :
              </label>
              <select
                value={examType}
                onChange={(e: any) => setExamType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              >
                <option value="DEVOIR_1">Devoir Surveillé N°1</option>
                <option value="DEVOIR_2">Devoir Surveillé N°2</option>
                <option value="INTERROGATION">Interrogation Écrite</option>
                <option value="COMPOSITION">Composition Trimestrielle</option>
                <option value="EXAMEN_BLANC">Examen Blanc</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Trimestre :
              </label>
              <select
                value={trimester}
                onChange={(e) => setTrimester(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1er Trimestre</option>
                <option value={2}>2ème Trimestre</option>
                <option value={3}>3ème Trimestre</option>
              </select>
            </div>
          </div>

          {/* Passerelle & Route Directe : Enseignant -> Application des Parents d'Élèves */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-950 to-blue-950/70 border border-emerald-500/50 shadow-md flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-start space-x-2.5 min-w-0">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="font-black text-white text-xs">
                    Classe sélectionnée : <span className="text-emerald-300 font-extrabold underline">{selectedClass?.name || 'Classe'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {selectedClassStudents.length} élèves & familles
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  📡 <strong className="text-emerald-300">Route Directe Activée :</strong> Dès validation de l'envoi, l'épreuve apparaîtra <strong>automatiquement chez tous les parents de la classe {selectedClass?.name}</strong> et y restera <strong>définitivement conservée comme une archive</strong> permanente pour révisions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRosterModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Consulter la liste ({selectedClassStudents.length})</span>
            </button>
          </div>

          {/* Date, Duration, Coeff, Copies Count */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Date Prévue :
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Durée de l'Épreuve :
              </label>
              <input
                type="text"
                value={duration}
                placeholder="Ex: 2 heures"
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Coefficient :
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={coefficient}
                onChange={(e) => setCoefficient(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Copies École (Tirage) :
              </label>
              <input
                type="number"
                min={1}
                value={copiesRequested}
                onChange={(e) => setCopiesRequested(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CONTENT MODE SWITCHER: IMPORT FILE (WORD / PDF) OR DIRECT TEXT */}
          <div className="pt-2">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Format du Sujet de l'Épreuve :
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContentMode('FILE')}
                className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  contentMode === 'FILE'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Importer Fichier (Word, PDF, Photo)</span>
              </button>

              <button
                type="button"
                onClick={() => setContentMode('TEXT')}
                className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  contentMode === 'TEXT'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Rédiger directement le Texte</span>
              </button>
            </div>
          </div>

          {/* MODE 1: FILE UPLOAD ZONE */}
          {contentMode === 'FILE' && (
            <div className="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="examFileInput"
                accept=".docx,.doc,.pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="examFileInput"
                className="cursor-pointer flex flex-col items-center justify-center py-4 text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">
                    {attachedFileName ? 'Remplacer le fichier sélectionné' : 'Cliquez pour sélectionner votre fichier d\'épreuve'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Formats acceptés : Microsoft Word (.docx, .doc), Adobe PDF (.pdf), ou Photos nettes (PNG, JPG) • Max 12 Mo
                  </p>
                </div>
              </label>

              {attachedFileName && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                      {attachedFileType}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{attachedFileName}</p>
                      <p className="text-[10px] text-slate-400">{attachedFileSize} • Fichier prêt pour diffusion</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAttachedFileUrl(''); setAttachedFileName(''); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: DIRECT TEXT TYPING */}
          {contentMode === 'TEXT' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-300">
                  Contenu textuel du sujet d'évaluation :
                </label>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleAiGenerateProposal}
                    disabled={isAiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/60 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isAiGenerating ? 'Génération...' : 'Assistant IA Sujet'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                placeholder="Rédigez ici le contenu de l'épreuve : énoncés des exercices, barème, consignes..."
                value={writtenContent}
                onChange={(e) => setWrittenContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          )}

          {/* SECTION DÉDIÉE : CONSIGNES SPÉCIFIQUES DU PROFESSEUR (PARENTS & ÉLÈVES) */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-300">
                    Consignes Spécifiques du Professeur pour les Élèves & Parents
                  </h4>
                  <p className="text-[10px] text-amber-200/80 font-medium">
                    Ces consignes s'afficheront directement dans l'application des parents d'élèves et élèves.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                Visible Espace Parents
              </span>
            </div>

            <textarea
              rows={3}
              placeholder="Indiquez ici vos consignes pour les élèves et parents (ex: Exercices 1 et 2 obligatoires, révision des chapitres 2 et 3, calculatrice interdite, travail à rendre sur feuille double avant le...)"
              value={parentInstructions}
              onChange={(e) => setParentInstructions(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-white text-xs placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 leading-relaxed"
            />

            {/* Quick 1-click Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold">Ajouter en 1 clic :</span>
              {CONSIGNE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setParentInstructions(prev => prev ? `${prev} • ${preset}` : preset)}
                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Deadline & General Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-500/20">
              <div>
                <label className="text-[11px] font-bold text-amber-200 block mb-1">
                  Date limite de remise / Évaluation :
                </label>
                <input
                  type="date"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-200 block mb-1">
                  Note d'examen complémentaire :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Soigner l'orthographe et la clarté des calculs"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Notes for School Reprography */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Consignes particulières pour la reprographie / Censeur (École) :
            </label>
            <input
              type="text"
              placeholder="Ex: Tirage recto-verso agrafé, prévoir copies supplémentaires pour la surveillance."
              value={reprographyNotes}
              onChange={(e) => setReprographyNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* BOUTONS D'ENVOI DISTINCTS (DESTINATION DE L'ÉPREUVE) */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-300 flex items-center space-x-1.5">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Destination de l'Épreuve : Choisissez où transmettre</span>
              </span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Annuler
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              {/* BOUTON 1: ENVOYER VERS L'ÉCOLE */}
              <button
                type="button"
                onClick={() => handleSendExamWithDestination('SCHOOL')}
                disabled={isSubmitting}
                className="p-4 rounded-2xl bg-blue-950/50 hover:bg-blue-900/60 border-2 border-blue-600/60 hover:border-blue-500 text-left transition-all group cursor-pointer shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-[11px] shadow">
                    🏫 Vers l'École
                  </span>
                  <Send className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  Envoyer vers l'École (Tirage)
                </h4>
                <p className="text-[11px] text-blue-200/80 mt-1 leading-relaxed">
                  Transmet à la Direction & au Censeur pour validation officielle et reprographie papier ({copiesRequested} ex).
                </p>
              </button>

              {/* BOUTON 2: ENVOYER VERS PARENT D'ÉLÈVE */}
              <button
                type="button"
                onClick={() => handleSendExamWithDestination('PARENTS')}
                disabled={isSubmitting}
                className="p-4 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border-2 border-emerald-600/60 hover:border-emerald-500 text-left transition-all group cursor-pointer shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-[11px] shadow flex items-center space-x-1">
                    <span>👨‍👩‍👧‍👦 Vers Parent d'Élève</span>
                    <span className="text-[9px] bg-emerald-800/80 px-1 py-0.2 rounded text-emerald-200">Route Directe</span>
                  </span>
                  <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  Envoyer vers Parent d'Élève
                </h4>
                <p className="text-[11px] text-emerald-200/80 mt-1 leading-relaxed">
                  Apparaît <strong>automatiquement chez tous les parents</strong> de la classe <span className="font-bold text-white">{selectedClass?.name}</span> avec vos consignes et s'archive définitivement.
                </p>
              </button>

              {/* BOUTON 3: ENVOYER AUX DEUX */}
              <button
                type="button"
                onClick={() => handleSendExamWithDestination('BOTH')}
                disabled={isSubmitting}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-purple-950/70 to-slate-900 hover:from-indigo-900/90 border-2 border-indigo-500/60 hover:border-indigo-400 text-left transition-all group cursor-pointer shadow-lg sm:col-span-2 lg:col-span-1 disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-black text-[11px] shadow">
                    🚀 Vers l'École ET Parents
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  Envoyer vers l'École ET Parents
                </h4>
                <p className="text-[11px] text-purple-200/80 mt-1 leading-relaxed">
                  Tirage papier officiel au censeur ET publication automatique + archive permanente chez les parents de <span className="font-bold text-white">{selectedClass?.name}</span>.
                </p>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* SECTION: LIST OF TEACHER'S SUBMITTED PAPERS WITH FILTER BAR */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Historique de mes Épreuves Déposées ({mySubmittedPapers.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Suivez l'état du tirage par l'école et gérez la mise à disposition auprès des parents d'élèves.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setListFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                listFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes ({mySubmittedPapers.length})
            </button>
            <button
              type="button"
              onClick={() => setListFilter('PARENTS')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                listFilter === 'PARENTS'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Chez Parents ({sharedWithParentsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setListFilter('SCHOOL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                listFilter === 'SCHOOL'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tirage École ({schoolPapersCount})
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredSubmittedPapers.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">
              {listFilter === 'PARENTS'
                ? "Aucune épreuve partagée avec les parents d'élèves pour le moment."
                : listFilter === 'SCHOOL'
                ? "Aucune épreuve en attente de tirage à l'école."
                : "Vous n'avez pas encore déposé d'épreuve pour cette année scolaire."}
            </p>
            <button
              type="button"
              onClick={() => { setShowForm(true); setListFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Déposer votre première épreuve</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubmittedPapers.map((paper) => {
              const status = paper.status || 'EN_ATTENTE';
              const isSharedWithParents = paper.isAvailableForStudents !== false;

              return (
                <div
                  key={paper.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md space-y-3.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    
                    {/* Destination & Status Badges */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {isSharedWithParents ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                            <Users className="w-3 h-3 text-emerald-400" />
                            <span>Chez Parents & Élèves</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Masqué aux Parents
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status === 'VALIDE'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : status === 'IMPRIME'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : status === 'REJETE'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {status === 'VALIDE' ? '✓ Validé École' :
                           status === 'IMPRIME' ? '🖨️ Tirage imprimé' :
                           status === 'REJETE' ? '⚠️ Retouche demandée' :
                           '⏳ Relecture Censeur'}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{paper.createdAt}</span>
                      </span>
                    </div>

                    {/* Title & Subject */}
                    <div>
                      <h4 className="font-black text-sm text-white line-clamp-1">
                        {paper.title}
                      </h4>
                      <p className="text-xs font-bold text-blue-400 mt-0.5">
                        {paper.subjectName} • {paper.className}
                      </p>
                    </div>

                    {/* Specs Details */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-400">
                      <div className="p-2 rounded-xl bg-slate-950 flex items-center space-x-1 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{paper.duration || '2h'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 flex items-center space-x-1 truncate">
                        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Coeff {paper.coefficient || 1}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 flex items-center space-x-1 truncate">
                        <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{paper.numberOfCopiesRequested || '—'} copies</span>
                      </div>
                    </div>

                    {/* Teacher Consignes Box */}
                    {(paper.parentInstructions || paper.instructions) && (
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-black text-amber-400 flex items-center space-x-1 uppercase tracking-wider">
                            <MessageSquare className="w-3 h-3" />
                            <span>Consignes Élèves/Parents :</span>
                          </span>
                          {paper.submissionDeadline && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Pour le : {paper.submissionDeadline}
                            </span>
                          )}
                        </div>
                        <p className="text-amber-200/90 text-[11px] leading-relaxed italic line-clamp-2">
                          « {paper.parentInstructions || paper.instructions} »
                        </p>
                      </div>
                    )}

                    {/* Attached File Pill */}
                    {paper.attachedFileName && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 truncate text-slate-300">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate font-mono">{paper.attachedFileName}</span>
                        </div>
                        {paper.attachedFileUrl && (
                          <a
                            href={paper.attachedFileUrl}
                            download={paper.attachedFileName}
                            className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white font-bold text-[10px] shrink-0"
                          >
                            Télécharger
                          </a>
                        )}
                      </div>
                    )}

                    {/* Feedback if any */}
                    {paper.schoolFeedback && (
                      <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-[11px] text-red-200">
                        <strong>Remarque École :</strong> {paper.schoolFeedback}
                      </div>
                    )}

                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    
                    {/* Toggle Parent Availability */}
                    <button
                      type="button"
                      onClick={() => {
                        const isShared = paper.isAvailableForStudents !== false;
                        updateExamPaper({ 
                          ...paper, 
                          isAvailableForStudents: !isShared,
                          sentToParents: !isShared
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isSharedWithParents
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/60'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                      title={isSharedWithParents ? "Visible chez les parents (cliquer pour masquer)" : "Masqué aux parents (cliquer pour rendre disponible)"}
                    >
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>{isSharedWithParents ? 'Partagé Parents' : 'Masqué aux Parents'}</span>
                    </button>

                    {/* Edit Consignes Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditConsignes(paper)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Modifier ou ajouter des consignes pour les parents et élèves"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Consignes</span>
                    </button>

                    {/* Word Export (.doc) */}
                    <button
                      type="button"
                      onClick={() => exportExamPaperToWord(paper, settings, currentSchool)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      title="Télécharger l'épreuve complète en Word (.doc)"
                    >
                      <Download className="w-3 h-3 text-amber-300" />
                      <span>Word</span>
                    </button>

                    {/* Delete button if pending */}
                    {status === 'EN_ATTENTE' && (
                      <button
                        onClick={() => {
                          if (confirm("Voulez-vous annuler l'envoi de cette épreuve ?")) {
                            deleteExamPaper(paper.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Supprimer cette épreuve"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL 1: CLASS ROSTER PREVIEW (RECIPIENTS LIST) */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Destinataires : Classe de {selectedClass?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedClassStudents.length} élèves & familles inscrits • Tous recevront l'épreuve automatiquement
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of students */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {selectedClassStudents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Aucun élève trouvé dans cette classe.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {selectedClassStudents.map((s, idx) => (
                    <div key={s.id} className="py-2 px-2 flex items-center justify-between text-xs hover:bg-slate-800/40 rounded-xl transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-slate-500 text-[10px] w-5 text-right">{idx + 1}.</span>
                        <div>
                          <p className="font-bold text-white">
                            {s.lastName.toUpperCase()} {s.firstName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Matricule : {s.matricule || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block">
                          {s.gender === 'F' ? 'Fille' : s.gender === 'M' ? 'Garçon' : ''}
                        </span>
                        {(s.parentPhone || s.phone) && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            📱 Parent : {s.parentPhone || s.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center space-x-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  Route directe active : transmission automatique vers tous ces {selectedClassStudents.length} élèves et leurs parents dès validation.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow transition-colors ml-auto"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CONSIGNES FOR AN ALREADY SUBMITTED PAPER */}
      {editingConsignesPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Modifier les Consignes du Professeur
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingConsignesPaper.title} • {editingConsignesPaper.className}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingConsignesPaper(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Consignes et Directives pour les Élèves & Parents :
                </label>
                <textarea
                  rows={4}
                  value={editConsignesText}
                  onChange={(e) => setEditConsignesText(e.target.value)}
                  placeholder="Ex: Exercices 1, 2 et 4 obligatoires. Rendre sur feuille double au prochain cours..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 leading-relaxed"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">Ajouter :</span>
                {CONSIGNE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditConsignesText(prev => prev ? `${prev} • ${p}` : p)}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    + {p}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Date limite de remise / Évaluation :
                </label>
                <input
                  type="date"
                  value={editConsignesDeadline}
                  onChange={(e) => setEditConsignesDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300">
                💡 En enregistrant, cette épreuve sera automatiquement marquée comme disponible pour les parents et élèves de la classe avec vos consignes à jour.
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingConsignesPaper(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSaveConsignes}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-black text-xs shadow cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enregistrer & Diffuser aux Parents</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
