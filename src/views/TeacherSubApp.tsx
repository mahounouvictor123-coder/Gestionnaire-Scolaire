import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../lib/store';
import { SchoolClass, Subject, Teacher, Grade, Student } from '../types';
import { updateDynamicPwaBranding } from '../lib/pwaHelper';
import { isGradeModifiable, getGradeDeadlineInfo } from '../lib/gradeUtils';
import { PwaInstallGuideModalProps } from '../components/modals/PwaInstallGuideModal';
import { triggerAutoInstall, isDesktopPC } from '../lib/pwaInstallManager';
import { 
  GraduationCap, 
  BookOpen, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Save, 
  Lock, 
  Unlock, 
  Edit3, 
  UserCheck, 
  Users, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  Calendar,
  Layers,
  Send,
  Award,
  LogOut,
  FileUp,
  Zap,
  FileText
} from 'lucide-react';
import { TeacherAuthGate } from '../components/TeacherAuthGate';
import { TeacherExamSubmissionTab } from '../components/TeacherExamSubmissionTab';
import { TeacherQuizWeekTab } from '../components/TeacherQuizWeekTab';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { isPrimaryClass } from '../lib/schoolUtils';

interface TeacherSubAppProps {
  onReturnToPlatform?: () => void;
}

export const TeacherSubApp: React.FC<TeacherSubAppProps> = ({ onReturnToPlatform }) => {
  const { 
    currentSchool, 
    classes, 
    students, 
    subjects, 
    teachers, 
    grades, 
    addGrade,
    addBulkGrades, 
    updateGrade,
    addCommunication,
    settings 
  } = useApp();

  // Dynamic PWA Branding with School Name
  useEffect(() => {
    updateDynamicPwaBranding(currentSchool.name, 'TEACHER');
  }, [currentSchool.name]);

  // Persisted Teacher Profile
  const localStorageTeacherKey = `TEACHER_APP_PROFILE_${currentSchool.id}`;
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(localStorageTeacherKey) || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedTeacherId) {
      localStorage.setItem(localStorageTeacherKey, selectedTeacherId);
    }
  }, [selectedTeacherId, localStorageTeacherKey]);

  // Active Teacher Object
  const currentTeacher: Teacher | undefined = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  // View mode: 'entry' (saisie rapide), 'history' (mes saisies & modifications 3 jours), 'epreuves' (dépôt épreuves) or 'quiz-week' (exercices & corrigés week-end)
  const [viewMode, setViewMode] = useState<'entry' | 'history' | 'epreuves' | 'quiz-week'>('entry');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const isPC = isDesktopPC();

  const handleAppInstall = async () => {
    const res = await triggerAutoInstall();
    if (res.success && res.outcome === 'accepted') return;
    setIsInstallModalOpen(true);
  };
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [statusAlert, setStatusAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [previewStudentBulletin, setPreviewStudentBulletin] = useState<Student | null>(null);

  // Exclude primary classes from secondary teacher portal
  const teacherClasses = useMemo(() => {
    return classes.filter(c => !isPrimaryClass(c));
  }, [classes]);

  // Grade Entry Configuration States
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    const nonPrimary = classes.filter(c => !isPrimaryClass(c));
    return nonPrimary[0]?.id || '';
  });

  const selectedClass = useMemo(() => {
    return teacherClasses.find(c => c.id === selectedClassId) || classes.find(c => c.id === selectedClassId) || teacherClasses[0];
  }, [teacherClasses, classes, selectedClassId]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return subjects[0]?.id || '';
  });

  // Auto-sync teacher subject and classes
  useEffect(() => {
    if (currentTeacher) {
      if (currentTeacher.subjects && currentTeacher.subjects.length > 0) {
        const foundSub = subjects.find(s => s.name.toLowerCase() === currentTeacher.subjects[0].toLowerCase());
        if (foundSub) {
          setSelectedSubjectId(foundSub.id);
        }
      }
      if (currentTeacher.classIds && currentTeacher.classIds.length > 0) {
        const validClassId = currentTeacher.classIds.find(cId => {
          const c = classes.find(item => item.id === cId);
          return c && !isPrimaryClass(c);
        });
        if (validClassId) {
          setSelectedClassId(validClassId);
        } else if (teacherClasses[0]) {
          setSelectedClassId(teacherClasses[0].id);
        }
      }
    }
  }, [currentTeacher, subjects, classes, teacherClasses]);

  const [trimester, setTrimester] = useState<number>(settings.currentTrimester || 1);
  const [examType, setExamType] = useState<any>('DEVOIR_1');
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [coefficient, setCoefficient] = useState<number>(1);
  const [maxMark, setMaxMark] = useState<number>(20);

  // Active Class Students
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students
      .filter(s => s.classId === selectedClassId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, selectedClassId]);

  // Update coefficient when subject changes
  useEffect(() => {
    const sub = subjects.find(s => s.id === selectedSubjectId);
    if (sub) {
      setCoefficient(sub.coefficient || 1);
    }
  }, [selectedSubjectId, subjects]);

  // Local state for grades input: Map of studentId -> { mark: string, comment: string }
  const [studentMarks, setStudentMarks] = useState<Record<string, { mark: string; comment: string }>>({});

  // Reset inputs when class/subject/examType changes
  useEffect(() => {
    const initialMap: Record<string, { mark: string; comment: string }> = {};
    classStudents.forEach(s => {
      // Check if student already has a grade for this specific exam
      const existing = grades.find(g => 
        g.studentId === s.id && 
        g.subjectId === selectedSubjectId && 
        g.classId === selectedClassId && 
        Number(g.trimester) === Number(trimester) && 
        g.examType === examType
      );
      initialMap[s.id] = {
        mark: existing ? String(existing.mark) : '',
        comment: existing?.comment || ''
      };
    });
    setStudentMarks(initialMap);
  }, [selectedClassId, selectedSubjectId, trimester, examType, classStudents, grades]);

  // Handle Mark Input Change
  const handleMarkChange = (studentId: string, value: string) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        mark: value
      }
    }));
  };

  // Handle Comment Input Change
  const handleCommentChange = (studentId: string, comment: string) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment
      }
    }));
  };

  // Instant Auto-Sync of single student mark directly to store & student bulletin
  const autoSyncStudentGrade = (studentId: string) => {
    const entry = studentMarks[studentId];
    if (!entry || entry.mark === '' || isNaN(Number(entry.mark))) return;
    const targetClass = teacherClasses.find(c => c.id === selectedClassId) || classes.find(c => c.id === selectedClassId);
    const targetSubject = subjects.find(s => s.id === selectedSubjectId);
    const markVal = Math.min(maxMark, Math.max(0, parseFloat(entry.mark)));
    const nowIso = new Date().toISOString();

    addGrade({
      studentId: studentId,
      subjectId: selectedSubjectId,
      subjectName: targetSubject ? targetSubject.name : '',
      classId: selectedClassId,
      className: targetClass ? targetClass.name : '',
      trimester: trimester,
      examType: examType,
      mark: markVal,
      maxMark: maxMark,
      date: examDate,
      coefficient: coefficient,
      createdAt: nowIso,
      teacherName: currentTeacher ? `${currentTeacher.firstName} ${currentTeacher.lastName}` : 'Enseignant',
      teacherId: currentTeacher?.id,
      comment: entry.comment.trim()
    });
  };

  // Open the student's official bulletin directly with immediate save
  const handleOpenStudentBulletin = (student: Student) => {
    autoSyncStudentGrade(student.id);
    setPreviewStudentBulletin(student);
  };

  // Save Grades Handler (Directly integrated to the student's bulletin)
  const handleSaveGrades = () => {
    const targetClass = teacherClasses.find(c => c.id === selectedClassId) || classes.find(c => c.id === selectedClassId);
    const targetSubject = subjects.find(s => s.id === selectedSubjectId);

    const validGradesToSave: any[] = [];
    const nowIso = new Date().toISOString();

    classStudents.forEach(s => {
      const entry = studentMarks[s.id];
      if (entry && entry.mark !== '' && !isNaN(Number(entry.mark))) {
        const markVal = Math.min(maxMark, Math.max(0, parseFloat(entry.mark)));
        validGradesToSave.push({
          studentId: s.id,
          subjectId: selectedSubjectId,
          subjectName: targetSubject ? targetSubject.name : '',
          classId: selectedClassId,
          className: targetClass ? targetClass.name : '',
          trimester: trimester,
          examType: examType,
          mark: markVal,
          maxMark: maxMark,
          date: examDate,
          coefficient: coefficient,
          createdAt: nowIso,
          teacherName: currentTeacher ? `${currentTeacher.firstName} ${currentTeacher.lastName}` : 'Enseignant',
          teacherId: currentTeacher?.id,
          comment: entry.comment.trim()
        });
      }
    });

    if (validGradesToSave.length === 0) {
      setStatusAlert({
        type: 'error',
        message: "Veuillez saisir au moins une note valide avant d'enregistrer."
      });
      setTimeout(() => setStatusAlert(null), 3500);
      return;
    }

    // Save in centralized store (syncs with Firestore Cloud, localStorage and student bulletin directly)
    addBulkGrades(validGradesToSave);

    // Automatically send an in-app school communication broadcast for parents
    if (targetClass && targetSubject) {
      try {
        addCommunication({
          senderId: currentTeacher?.id || 'prof-01',
          senderName: currentTeacher ? `M./Mme ${currentTeacher.lastName} (${targetSubject.name})` : `Professeur de ${targetSubject.name}`,
          recipientGroup: 'PARENTS',
          subject: `Nouvelles notes publiées en ${targetSubject.name} (${targetClass.name})`,
          content: `Les notes de l'évaluation "${examType}" du ${examDate} en ${targetSubject.name} ont été renseignées pour la classe de ${targetClass.name}. Elles sont directement consultables sur le bulletin de l'élève.`,
          channels: ['SMS', 'WHATSAPP'],
          sentAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'LIVRE'
        });
      } catch (e) {}
    }

    setIsSavedSuccess(true);
    setStatusAlert({
      type: 'success',
      message: `✅ ${validGradesToSave.length} note(s) enregistrée(s) et intégrée(s) directement au bulletin officiel de chaque élève !`
    });
    setTimeout(() => {
      setIsSavedSuccess(false);
      setStatusAlert(null);
    }, 4500);
  };

  // 3-Day Modification History List for this teacher / school
  const recentTeacherGrades = useMemo(() => {
    return grades
      .filter(g => {
        if (selectedTeacherId && g.teacherId) {
          return g.teacherId === selectedTeacherId;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [grades, selectedTeacherId]);

  // Selected Grade for modal edit (only if within 3 days)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editedMark, setEditedMark] = useState<string>('');
  const [editedComment, setEditedComment] = useState<string>('');

  const handleOpenEditGrade = (grade: Grade) => {
    if (!isGradeModifiable(grade)) {
      setStatusAlert({
        type: 'error',
        message: "Délai de modification dépassé ! Conformément au règlement, les notes ne sont plus modifiables après 3 jours (72h)."
      });
      setTimeout(() => setStatusAlert(null), 4000);
      return;
    }
    setEditingGrade(grade);
    setEditedMark(String(grade.mark));
    setEditedComment(grade.comment || '');
  };

  const handleConfirmEditGrade = () => {
    if (!editingGrade) return;
    if (!isGradeModifiable(editingGrade)) {
      setStatusAlert({
        type: 'error',
        message: "Le délai de modification de 3 jours a expiré."
      });
      setEditingGrade(null);
      setTimeout(() => setStatusAlert(null), 3500);
      return;
    }

    const num = parseFloat(editedMark);
    if (isNaN(num)) {
      setStatusAlert({
        type: 'error',
        message: "Note invalide. Veuillez saisir un nombre valide."
      });
      setTimeout(() => setStatusAlert(null), 3500);
      return;
    }

    updateGrade(editingGrade.id, {
      mark: num,
      comment: editedComment.trim(),
      updatedAt: new Date().toISOString()
    });

    setEditingGrade(null);
    setStatusAlert({
      type: 'success',
      message: "Note modifiée avec succès et immédiatement répercutée sur le bulletin de l'élève !"
    });
    setTimeout(() => setStatusAlert(null), 3500);
  };

  // Quick statistics of current input session
  const stats = useMemo(() => {
    const marksArr: number[] = [];
    Object.values(studentMarks).forEach((entry: { mark: string; comment: string }) => {
      if (entry.mark !== '' && !isNaN(parseFloat(entry.mark))) {
        marksArr.push(parseFloat(entry.mark));
      }
    });

    if (marksArr.length === 0) return null;
    const avg = marksArr.reduce((a, b) => a + b, 0) / marksArr.length;
    const highest = Math.max(...marksArr);
    const lowest = Math.min(...marksArr);
    const passCount = marksArr.filter(m => m >= 10).length;
    const passRate = Math.round((passCount / marksArr.length) * 100);

    return {
      count: marksArr.length,
      avg: avg.toFixed(2),
      highest,
      lowest,
      passRate
    };
  }, [studentMarks]);

  // If no teacher profile is authenticated, show Teacher Registration and Login Gate
  if (!currentTeacher) {
    return (
      <TeacherAuthGate
        onSelectTeacher={(teacherId) => setSelectedTeacherId(teacherId)}
        onReturnToPlatform={onReturnToPlatform}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-12">
      
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3 overflow-hidden">
            {currentSchool.logoUrl ? (
              <img 
                src={currentSchool.logoUrl} 
                alt={currentSchool.name} 
                className="w-10 h-10 rounded-2xl object-cover border border-emerald-500/30 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shrink-0">
                {currentSchool.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="truncate">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Espace Saisie Professeur
              </span>
              <h1 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                {currentSchool.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleAppInstall}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center space-x-1.5 shadow cursor-pointer"
              title={isPC ? "Ajouter l'application sur votre écran de PC (Bureau) avec son logo" : "Ajouter à l'écran d'accueil"}
            >
              {isPC ? <Monitor className="w-4 h-4 text-emerald-200" /> : <Smartphone className="w-4 h-4 text-emerald-200" />}
              <span className="hidden sm:inline">{isPC ? "Installer sur PC" : "Ajouter à l'écran"}</span>
            </button>

            {onReturnToPlatform && (
              <button
                onClick={onReturnToPlatform}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 cursor-pointer"
                title="Quitter la prévisualisation et revenir à l'espace d'administration"
              >
                Retour Admin
              </button>
            )}
          </div>

        </div>

        {/* Active Teacher Profile Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow">
                {currentTeacher.firstName.slice(0, 1).toUpperCase()}{currentTeacher.lastName.slice(0, 1).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-xs font-black text-white block truncate">
                  {currentTeacher.teacherTitle === 'MAITRE' ? 'Maître ' : currentTeacher.teacherTitle === 'MAITRESSE' ? 'Maîtresse ' : 'Prof. '}
                  {currentTeacher.lastName.toUpperCase()} {currentTeacher.firstName}
                </span>
                <span className="text-[10px] text-indigo-300 flex items-center space-x-2">
                  <span className="font-bold text-emerald-400">📚 {currentTeacher.subjects[0] || 'Matière'}</span>
                  {currentTeacher.phone && <span>• 📞 {currentTeacher.phone}</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Délai modif : 72h</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(localStorageTeacherKey);
                  }
                  setSelectedTeacherId('');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer"
                title="Changer de compte enseignant ou se déconnecter"
              >
                <LogOut className="w-3 h-3 text-slate-400" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-5 w-full flex-1 space-y-5">
        
        {/* Navigation Mode Switcher (4 Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-sm">
          
          <button
            onClick={() => setViewMode('entry')}
            className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'entry'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="truncate">Saisie Notes</span>
          </button>

          <button
            onClick={() => setViewMode('history')}
            className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="truncate">Retouches (72h)</span>
          </button>

          <button
            onClick={() => setViewMode('epreuves')}
            className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'epreuves'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileUp className="w-4 h-4 text-amber-300" />
            <span className="truncate">Épreuves</span>
          </button>

          <button
            onClick={() => setViewMode('quiz-week')}
            className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'quiz-week'
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="truncate">Quiz Week</span>
          </button>

        </div>

        {/* SUCCESS & STATUS NOTIFICATION BANNER */}
        {statusAlert && (
          <div className={`p-4 rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            statusAlert.type === 'success'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
              : 'bg-gradient-to-r from-rose-600 to-red-600 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              {statusAlert.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 shrink-0 text-white" />
              ) : (
                <AlertCircle className="w-6 h-6 shrink-0 text-white" />
              )}
              <div>
                <p className="font-black">{statusAlert.message}</p>
                {statusAlert.type === 'success' && (
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Les moyennes, totaux et rangs sont calculés et reportés en direct sur les bulletins trimestriels.
                  </p>
                )}
              </div>
            </div>

            {statusAlert.type === 'success' && classStudents.length > 0 && selectedClass && (
              <button
                type="button"
                onClick={() => setPreviewStudentBulletin(classStudents[0])}
                className="px-3.5 py-2 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition-colors shadow-sm shrink-0 cursor-pointer flex items-center space-x-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>📄 Consulter le Bulletin Dressé</span>
              </button>
            )}
          </div>
        )}

        {/* VIEW MODE 1: GRADE ENTRY */}
        {viewMode === 'entry' && (
          <div className="space-y-5">
            
            {/* Class & Evaluation Setup Box */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Paramètres de l'évaluation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* Select Class */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Classe :</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    {teacherClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Matière :</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Coeff {s.coefficient})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evaluation Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Type d'Évaluation :</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="INTERRO_1">Interrogation 1</option>
                    <option value="INTERRO_2">Interrogation 2</option>
                    <option value="INTERRO_3">Interrogation 3</option>
                    <option value="DEVOIR_1">Devoir Surveillé 1 (DS1)</option>
                    <option value="DEVOIR_2">Devoir Surveillé 2 (DS2)</option>
                    <option value="COMPOSITION">Composition Trimestrielle</option>
                    <option value="TP">Travaux Pratiques (TP)</option>
                  </select>
                </div>

                {/* Trimester */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Trimestre :</label>
                  <select
                    value={trimester}
                    onChange={(e) => setTrimester(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value={1}>1er Trimestre</option>
                    <option value={2}>2ème Trimestre</option>
                    <option value={3}>3ème Trimestre</option>
                  </select>
                </div>

                {/* Evaluation Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Date de l'Épreuve :</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                  />
                </div>

                {/* Coefficient */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Coefficient :</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={coefficient}
                    onChange={(e) => setCoefficient(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                  />
                </div>

              </div>
            </div>

            {/* Live Stats Bar */}
            {stats && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between flex-wrap gap-3 text-xs">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{stats.count} note(s) saisie(s)</span>
                </div>
                <div className="flex items-center space-x-4 text-slate-300">
                  <span>Moyenne : <strong className="text-white">{stats.avg} / 20</strong></span>
                  <span>Plus haute : <strong className="text-emerald-400">{stats.highest}</strong></span>
                  <span>Plus basse : <strong className="text-rose-400">{stats.lowest}</strong></span>
                  <span>Taux de réussite : <strong className="text-amber-400">{stats.passRate}%</strong></span>
                </div>
              </div>
            )}

            {/* Direct Bulletin Sync Information Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-900 border border-emerald-500/40 flex items-center justify-between flex-wrap gap-3 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center space-x-2">
                    <span>Transmission Directe au Bulletin Officiel</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-black uppercase tracking-wider">Actif en Temps Réel</span>
                  </h4>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    Toute note ou appréciation saisie par le professeur vient directement s'inscrire sur le bulletin de l'élève (colonne correspondante, moyenne générale et classement).
                  </p>
                </div>
              </div>
              {classStudents.length > 0 && selectedClass && (
                <button
                  type="button"
                  onClick={() => handleOpenStudentBulletin(classStudents[0])}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow cursor-pointer transition-transform active:scale-95"
                  title="Vérifier l'aperçu du bulletin officiel pour cette classe"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Aperçu Bulletin Dressé</span>
                </button>
              )}
            </div>

            {/* Students Grade Input Table */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Liste des Élèves ({classStudents.length} élèves)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saisissez la note sur 20 et une appréciation éventuelle pour chaque élève. Elle est synchronisée instantanément sur son bulletin.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {classStudents.length > 0 && selectedClass && (
                    <button
                      type="button"
                      onClick={() => handleOpenStudentBulletin(classStudents[0])}
                      className="px-3.5 py-2.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                      title="Consulter le format officiel du bulletin dressé pour cette classe"
                    >
                      <FileText className="w-4 h-4 text-purple-300" />
                      <span>📄 Format Bulletin Dressé</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveGrades}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center space-x-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer & Publier les Notes</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {classStudents.map((std, idx) => {
                  const entry = studentMarks[std.id] || { mark: '', comment: '' };
                  const numVal = parseFloat(entry.mark);
                  const hasVal = entry.mark !== '' && !isNaN(numVal);
                  const isPassing = hasVal && numVal >= 10;
                  const isExcellent = hasVal && numVal >= 16;

                  return (
                    <div key={std.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Student info */}
                      <div className="flex items-center space-x-3 min-w-[200px]">
                        <span className="text-xs font-mono text-slate-500 w-6">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300 shrink-0 border border-slate-700">
                          {std.photoUrl ? (
                            <img src={std.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            std.firstName[0]
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">
                            {std.lastName.toUpperCase()} {std.firstName}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px]">
                            <span className="text-slate-400">Matricule : {std.registrationNumber}</span>
                            {hasVal && (
                              <span className="px-1.5 py-0.5 rounded font-black text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✓ Sur le Bulletin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Inputs & Direct Bulletin Preview */}
                      <div className="flex items-center space-x-2.5 flex-1 justify-end">
                        
                        {/* Note Input */}
                        <div className="relative w-28 shrink-0">
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={maxMark}
                            placeholder="Note /20"
                            value={entry.mark}
                            onChange={(e) => handleMarkChange(std.id, e.target.value)}
                            onBlur={() => autoSyncStudentGrade(std.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                autoSyncStudentGrade(std.id);
                              }
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-sm font-black text-center focus:outline-none transition-all ${
                              !hasVal
                                ? 'bg-slate-800 border border-slate-700 text-white'
                                : isExcellent
                                  ? 'bg-purple-950/80 border-2 border-purple-500 text-purple-200'
                                  : isPassing
                                    ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200'
                                    : 'bg-rose-950/80 border-2 border-rose-500 text-rose-200'
                            }`}
                          />
                        </div>

                        {/* Comment Input */}
                        <div className="flex-1 max-w-xs hidden md:block">
                          <input
                            type="text"
                            placeholder="Appréciation bulletin (ex: Très bien, En progrès)"
                            value={entry.comment}
                            onChange={(e) => handleCommentChange(std.id, e.target.value)}
                            onBlur={() => autoSyncStudentGrade(std.id)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500"
                          />
                        </div>

                        {/* Direct Bulletin Button for Student */}
                        <button
                          type="button"
                          onClick={() => handleOpenStudentBulletin(std)}
                          className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-[11px] font-bold flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer shadow-sm"
                          title={`Consulter le bulletin officiel de ${std.firstName} ${std.lastName} avec sa note en direct`}
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-300" />
                          <span>Voir Bulletin</span>
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveGrades}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-xl cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer et Diffuser aux Parents</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* VIEW MODE 2: HISTORY & STRICT 3-DAY MODIFICATIONS */}
        {viewMode === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Explanation box on 3-day rule */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 flex items-start space-x-3 text-xs text-amber-200 leading-relaxed">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-100 font-black">Règle de Modification sous 3 Jours (72h) :</strong>
                <p className="mt-1 text-amber-200/90">
                  Toute note renseignée reste modifiable par l'enseignant pendant exactement <strong>3 jours (72 heures)</strong> à compter de son enregistrement. Passé ce délai, elle est <strong>définitivement verrouillée</strong> pour garantir l'intégrité des bulletins trimestriels.
                </p>
              </div>
            </div>

            {/* List of recent grades */}
            {recentTeacherGrades.length === 0 ? (
              <div className="p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                Aucune note enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTeacherGrades.map(grade => {
                  const std = students.find(s => s.id === grade.studentId);
                  const cl = classes.find(c => c.id === grade.classId);
                  const sbj = subjects.find(s => s.id === grade.subjectId);
                  const deadlineInfo = getGradeDeadlineInfo(grade);
                  const modifiable = !deadlineInfo.isExpired;

                  return (
                    <div 
                      key={grade.id} 
                      className={`p-4 rounded-2xl bg-slate-900 border transition-all ${
                        modifiable ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-85'
                      }`}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-white">
                              {std ? `${std.lastName.toUpperCase()} ${std.firstName}` : 'Élève'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              • {cl?.name} • {sbj?.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {grade.examType} • Date : {grade.date}
                          </p>
                        </div>

                        {/* Grade mark badge */}
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-black px-3 py-1 rounded-xl bg-slate-800 text-white border border-slate-700">
                            {grade.mark} / {grade.maxMark || 20}
                          </span>

                          {modifiable ? (
                            <button
                              onClick={() => handleOpenEditGrade(grade)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modifier</span>
                            </button>
                          ) : (
                            <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold flex items-center space-x-1.5 border border-slate-700/60">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Verrouillé</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3-day countdown badge */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className={`font-bold flex items-center space-x-1 ${
                          modifiable ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {modifiable ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{deadlineInfo.text}</span>
                        </span>

                        <span className="text-slate-500 text-[10px]">
                          Enregistré le {grade.createdAt ? new Date(grade.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : grade.date}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* VIEW MODE 3: EXAM & EVALUATIONS SUBMISSION */}
        {viewMode === 'epreuves' && (
          <TeacherExamSubmissionTab currentTeacher={currentTeacher} />
        )}

        {/* VIEW MODE 4: QUIZ WEEK-END EXERCISES & CORRIGES */}
        {viewMode === 'quiz-week' && (
          <TeacherQuizWeekTab currentTeacher={currentTeacher} />
        )}

      </main>

      {/* Edit Grade Modal (within 3 days) */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              <span>Modifier la note (Délai 3 jours)</span>
            </h3>

            <p className="text-xs text-slate-400">
              {getGradeDeadlineInfo(editingGrade).text}
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nouvelle note sur 20 :</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="20"
                  value={editedMark}
                  onChange={(e) => setEditedMark(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-lg text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Commentaire / Appréciation :</label>
                <input
                  type="text"
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingGrade(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmEditGrade}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer"
              >
                Valider la modification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      <PwaInstallGuideModalProps
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        schoolName={currentSchool.name}
        appTitle="Notes Professeurs"
      />

      {/* Official Student Report Card (Bulletin) Modal */}
      {previewStudentBulletin && selectedClass && (
        <PrintBulletinModal
          isOpen={true}
          onClose={() => setPreviewStudentBulletin(null)}
          student={previewStudentBulletin}
          schoolClass={selectedClass}
          trimester={trimester}
        />
      )}

    </div>
  );
};
