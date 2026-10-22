import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../lib/store';
import { Student, SchoolClass, Subject, Grade } from '../../types';
import {
  X,
  Save,
  Edit3,
  Sparkles,
  CheckCircle2,
  Calculator,
  BookOpen,
  Users,
  User,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';

export interface InsertBulletinGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  classStudents?: Student[];
  schoolClass?: SchoolClass;
  trimester: 1 | 2 | 3;
  targetSubject?: Subject | null;
  availableSubjects: Subject[];
  onSaved?: () => void;
}

interface SubjectGradeEntry {
  interro1: string;
  interro2: string;
  devoir: string;
  compo: string;
  comment: string;
  teacherName: string;
}

interface ClassStudentGradeEntry {
  interro1: string;
  interro2: string;
  devoir: string;
  compo: string;
  comment: string;
}

export const InsertBulletinGradesModal: React.FC<InsertBulletinGradesModalProps> = ({
  isOpen,
  onClose,
  student,
  classStudents = [],
  schoolClass,
  trimester,
  targetSubject,
  availableSubjects,
  onSaved
}) => {
  const { grades, addBulkGrades, currentSchool, settings } = useApp();

  // Mode: 'STUDENT' (toutes les matières pour 1 élève) ou 'CLASS' (tous les élèves pour 1 matière)
  const [entryMode, setEntryMode] = useState<'STUDENT' | 'CLASS'>('STUDENT');

  // État de l'élève actif en mode STUDENT
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    return student?.id || classStudents[0]?.id || '';
  });

  // État de la matière active en mode CLASS
  const [activeSubjectId, setActiveSubjectId] = useState<string>(() => {
    return targetSubject?.id || availableSubjects[0]?.id || '';
  });

  const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync activeStudentId quand student change
  useEffect(() => {
    if (student?.id) {
      setActiveStudentId(student.id);
    } else if (classStudents.length > 0 && !classStudents.some(s => s.id === activeStudentId)) {
      setActiveStudentId(classStudents[0].id);
    }
  }, [student, classStudents]);

  // Sync activeSubjectId quand targetSubject change
  useEffect(() => {
    if (targetSubject?.id) {
      setActiveSubjectId(targetSubject.id);
    } else if (availableSubjects.length > 0 && !availableSubjects.some(s => s.id === activeSubjectId)) {
      setActiveSubjectId(availableSubjects[0].id);
    }
  }, [targetSubject, availableSubjects]);

  const activeStudent = useMemo(() => {
    return classStudents.find(s => s.id === activeStudentId) || student || classStudents[0];
  }, [classStudents, activeStudentId, student]);

  const subjectsToEdit = useMemo(() => {
    if (targetSubject && entryMode === 'STUDENT') return [targetSubject];
    return availableSubjects.length > 0 ? availableSubjects : [];
  }, [targetSubject, availableSubjects, entryMode]);

  // Saisie mode STUDENT : { [subjectId]: SubjectGradeEntry }
  const [studentFormEntries, setStudentFormEntries] = useState<Record<string, SubjectGradeEntry>>({});

  // Saisie mode CLASS : { [studentId]: ClassStudentGradeEntry }
  const [classFormEntries, setClassFormEntries] = useState<Record<string, ClassStudentGradeEntry>>({});

  // Fonctions de classification des évaluations
  const isInterro = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'INTERRO' || u === 'TP' || u.startsWith('INTERRO') || u.startsWith('TEST') || u.startsWith('INT');
  };
  const isDevoir = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'DEVOIR' || u.startsWith('DEVOIR') || u === 'DS' || u.startsWith('DS');
  };
  const isCompo = (t: string) => {
    const u = (t || '').toUpperCase().trim();
    return u === 'COMPOSITION' || u.startsWith('COMPO') || u === 'EXAMEN' || u.startsWith('EXAM');
  };

  // Recharger les notes pour le mode STUDENT quand activeStudent ou trimester changent
  useEffect(() => {
    if (!isOpen || !activeStudent) return;

    const initial: Record<string, SubjectGradeEntry> = {};
    const studentGrades = grades.filter(
      g => g.studentId === activeStudent.id && Number(g.trimester) === Number(trimester)
    );

    subjectsToEdit.forEach(sbj => {
      const sbjGrades = studentGrades.filter(g =>
        g.subjectId === sbj.id ||
        g.subjectId === sbj.name ||
        (sbj.code && g.subjectId === sbj.code) ||
        (g.subjectName && g.subjectName.toLowerCase() === sbj.name.toLowerCase())
      );

      const interroGrades = sbjGrades
        .filter(g => isInterro(g.examType))
        .sort((a, b) => {
          if (a.evaluationNumber && b.evaluationNumber) return a.evaluationNumber - b.evaluationNumber;
          if (a.evaluationNumber === 1) return -1;
          if (b.evaluationNumber === 1) return 1;
          return (a.date || '').localeCompare(b.date || '');
        });

      const int1 = interroGrades.find(g => g.evaluationNumber === 1) ||
        interroGrades.find(g => (g.comment || '').toLowerCase().includes('interro 1') || (g.comment || '').toLowerCase().includes('int 1') || (g.comment || '').toLowerCase().includes('interro n°1')) ||
        interroGrades[0];

      const int2 = interroGrades.find(g => g.evaluationNumber === 2) ||
        interroGrades.find(g => (g.comment || '').toLowerCase().includes('interro 2') || (g.comment || '').toLowerCase().includes('int 2') || (g.comment || '').toLowerCase().includes('interro n°2')) ||
        interroGrades.find(g => g !== int1);

      const devoirGrade = sbjGrades.find(g => isDevoir(g.examType));
      const compoGrade = sbjGrades.find(g => isCompo(g.examType));
      const comment = sbjGrades.find(g => g.comment && g.comment.trim().length > 0)?.comment || '';
      const teacherName = sbjGrades.find(g => g.teacherName)?.teacherName || '';

      initial[sbj.id] = {
        interro1: int1 ? String(int1.mark) : '',
        interro2: int2 ? String(int2.mark) : '',
        devoir: devoirGrade ? String(devoirGrade.mark) : '',
        compo: compoGrade ? String(compoGrade.mark) : '',
        comment: comment,
        teacherName: teacherName
      };
    });

    setStudentFormEntries(initial);
  }, [isOpen, activeStudent, trimester, subjectsToEdit, grades]);

  // Recharger les notes pour le mode CLASS quand activeSubjectId ou trimester changent
  useEffect(() => {
    if (!isOpen || !activeSubjectId) return;

    const sbj = availableSubjects.find(s => s.id === activeSubjectId);
    if (!sbj) return;

    const initial: Record<string, ClassStudentGradeEntry> = {};

    classStudents.forEach(st => {
      const studentGrades = grades.filter(
        g => g.studentId === st.id &&
             Number(g.trimester) === Number(trimester) &&
             (g.subjectId === sbj.id || g.subjectId === sbj.name || (sbj.code && g.subjectId === sbj.code) || (g.subjectName && g.subjectName.toLowerCase() === sbj.name.toLowerCase()))
      );

      const interroGrades = studentGrades
        .filter(g => isInterro(g.examType))
        .sort((a, b) => {
          if (a.evaluationNumber && b.evaluationNumber) return a.evaluationNumber - b.evaluationNumber;
          if (a.evaluationNumber === 1) return -1;
          if (b.evaluationNumber === 1) return 1;
          return (a.date || '').localeCompare(b.date || '');
        });

      const int1 = interroGrades.find(g => g.evaluationNumber === 1) ||
        interroGrades.find(g => (g.comment || '').toLowerCase().includes('interro 1') || (g.comment || '').toLowerCase().includes('int 1') || (g.comment || '').toLowerCase().includes('interro n°1')) ||
        interroGrades[0];

      const int2 = interroGrades.find(g => g.evaluationNumber === 2) ||
        interroGrades.find(g => (g.comment || '').toLowerCase().includes('interro 2') || (g.comment || '').toLowerCase().includes('int 2') || (g.comment || '').toLowerCase().includes('interro n°2')) ||
        interroGrades.find(g => g !== int1);

      const devoirGrade = studentGrades.find(g => isDevoir(g.examType));
      const compoGrade = studentGrades.find(g => isCompo(g.examType));
      const comment = studentGrades.find(g => g.comment && g.comment.trim().length > 0)?.comment || '';

      initial[st.id] = {
        interro1: int1 ? String(int1.mark) : '',
        interro2: int2 ? String(int2.mark) : '',
        devoir: devoirGrade ? String(devoirGrade.mark) : '',
        compo: compoGrade ? String(compoGrade.mark) : '',
        comment: comment
      };
    });

    setClassFormEntries(initial);
  }, [isOpen, activeSubjectId, classStudents, trimester, availableSubjects, grades]);

  if (!isOpen) return null;

  // Navigation élève précédent / suivant en mode STUDENT
  const currentStudentIndex = classStudents.findIndex(s => s.id === activeStudent?.id);
  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setActiveStudentId(classStudents[currentStudentIndex - 1].id);
    }
  };
  const handleNextStudent = () => {
    if (currentStudentIndex !== -1 && currentStudentIndex < classStudents.length - 1) {
      setActiveStudentId(classStudents[currentStudentIndex + 1].id);
    }
  };

  const handleStudentEntryChange = (subjectId: string, field: keyof SubjectGradeEntry, value: string) => {
    setStudentFormEntries(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || { interro1: '', interro2: '', devoir: '', compo: '', comment: '', teacherName: '' }),
        [field]: value
      }
    }));
  };

  const handleClassEntryChange = (studentId: string, field: keyof ClassStudentGradeEntry, value: string) => {
    setClassFormEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { interro1: '', interro2: '', devoir: '', compo: '', comment: '' }),
        [field]: value
      }
    }));
  };

  // Enregistrement Mode STUDENT
  const handleSaveStudentGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    const nowIso = new Date().toISOString();
    const gradesToSave: Omit<Grade, 'id'>[] = [];

    subjectsToEdit.forEach(sbj => {
      const entry = studentFormEntries[sbj.id];
      if (!entry) return;

      const baseGrade = {
        studentId: activeStudent.id,
        subjectId: sbj.id,
        subjectName: sbj.name,
        classId: schoolClass?.id || activeStudent.classId || '',
        className: schoolClass?.name || 'Classe',
        trimester: trimester as 1 | 2 | 3,
        maxMark: 20,
        date: examDate,
        coefficient: sbj.coefficient || 1,
        createdAt: nowIso,
        comment: entry.comment.trim(),
        teacherName: entry.teacherName.trim()
      };

      if (entry.interro1 !== '' && !isNaN(parseFloat(entry.interro1))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'INTERRO',
          evaluationNumber: 1,
          comment: entry.comment ? `${entry.comment} [Interro 1]` : '[Interro 1]',
          mark: Math.min(20, Math.max(0, parseFloat(entry.interro1)))
        });
      }

      if (entry.interro2 !== '' && !isNaN(parseFloat(entry.interro2))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'INTERRO',
          evaluationNumber: 2,
          comment: entry.comment ? `${entry.comment} [Interro 2]` : '[Interro 2]',
          mark: Math.min(20, Math.max(0, parseFloat(entry.interro2)))
        });
      }

      if (entry.devoir !== '' && !isNaN(parseFloat(entry.devoir))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'DEVOIR',
          mark: Math.min(20, Math.max(0, parseFloat(entry.devoir)))
        });
      }

      if (entry.compo !== '' && !isNaN(parseFloat(entry.compo))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'COMPOSITION',
          mark: Math.min(20, Math.max(0, parseFloat(entry.compo)))
        });
      }
    });

    if (gradesToSave.length === 0) {
      alert("Veuillez saisir au moins une note (Interro, Devoir ou Compo) avant d'enregistrer.");
      return;
    }

    addBulkGrades(gradesToSave);
    setSuccessMsg(`✅ ${gradesToSave.length} note(s) enregistrée(s) avec succès pour ${activeStudent.lastName} ${activeStudent.firstName} !`);
    if (onSaved) onSaved();

    setTimeout(() => {
      setSuccessMsg(null);
    }, 2500);
  };

  // Enregistrement Mode CLASS
  const handleSaveClassGrades = (e: React.FormEvent) => {
    e.preventDefault();
    const sbj = availableSubjects.find(s => s.id === activeSubjectId);
    if (!sbj) return;

    const nowIso = new Date().toISOString();
    const gradesToSave: Omit<Grade, 'id'>[] = [];

    classStudents.forEach(st => {
      const entry = classFormEntries[st.id];
      if (!entry) return;

      const baseGrade = {
        studentId: st.id,
        subjectId: sbj.id,
        subjectName: sbj.name,
        classId: schoolClass?.id || st.classId || '',
        className: schoolClass?.name || 'Classe',
        trimester: trimester as 1 | 2 | 3,
        maxMark: 20,
        date: examDate,
        coefficient: sbj.coefficient || 1,
        createdAt: nowIso,
        comment: entry.comment.trim(),
        teacherName: ''
      };

      if (entry.interro1 !== '' && !isNaN(parseFloat(entry.interro1))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'INTERRO',
          evaluationNumber: 1,
          comment: entry.comment ? `${entry.comment} [Interro 1]` : '[Interro 1]',
          mark: Math.min(20, Math.max(0, parseFloat(entry.interro1)))
        });
      }

      if (entry.interro2 !== '' && !isNaN(parseFloat(entry.interro2))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'INTERRO',
          evaluationNumber: 2,
          comment: entry.comment ? `${entry.comment} [Interro 2]` : '[Interro 2]',
          mark: Math.min(20, Math.max(0, parseFloat(entry.interro2)))
        });
      }

      if (entry.devoir !== '' && !isNaN(parseFloat(entry.devoir))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'DEVOIR',
          mark: Math.min(20, Math.max(0, parseFloat(entry.devoir)))
        });
      }

      if (entry.compo !== '' && !isNaN(parseFloat(entry.compo))) {
        gradesToSave.push({
          ...baseGrade,
          examType: 'COMPOSITION',
          mark: Math.min(20, Math.max(0, parseFloat(entry.compo)))
        });
      }
    });

    if (gradesToSave.length === 0) {
      alert("Veuillez saisir au moins une note pour un élève avant d'enregistrer.");
      return;
    }

    addBulkGrades(gradesToSave);
    setSuccessMsg(`✅ ${gradesToSave.length} note(s) enregistrée(s) pour la matière "${sbj.name}" sur la classe !`);
    if (onSaved) onSaved();

    setTimeout(() => {
      setSuccessMsg(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-900/10 via-slate-50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center space-x-2">
                <span>Saisie & Insertion Directe des Notes du Bulletin</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Trimestre {trimester}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {schoolClass?.name || 'Classe'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Les notes enregistrées ici calculent immédiatement les moyennes, rangs et mentions des bulletins officiels.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => setEntryMode('STUDENT')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  entryMode === 'STUDENT'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Par Élève</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('CLASS')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  entryMode === 'CLASS'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Toute la Classe</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SUB-HEADER / FILTERS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Mode Élève Selector & Navigation */}
          {entryMode === 'STUDENT' ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Élève à noter :</label>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handlePrevStudent}
                  disabled={currentStudentIndex <= 0}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Élève précédent"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>

                <select
                  value={activeStudentId}
                  onChange={e => setActiveStudentId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer min-w-[240px] max-w-xs truncate"
                >
                  {classStudents.map((st, idx) => (
                    <option key={st.id} value={st.id}>
                      {idx + 1}. {st.lastName.toUpperCase()} {st.firstName} ({st.registrationNumber})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleNextStudent}
                  disabled={currentStudentIndex === -1 || currentStudentIndex >= classStudents.length - 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Élève suivant"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeStudent && (
                <div className="flex items-center space-x-2 ml-2">
                  <img
                    src={activeStudent.photoUrl}
                    alt={activeStudent.firstName}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-500/30"
                  />
                  <span className="font-black text-purple-700 dark:text-purple-300">
                    {activeStudent.lastName.toUpperCase()} {activeStudent.firstName}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Mode Classe Subject Selector */
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Discipline / Matière :</label>
              <select
                value={activeSubjectId}
                onChange={e => setActiveSubjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 cursor-pointer min-w-[220px]"
              >
                {availableSubjects.map(sbj => (
                  <option key={sbj.id} value={sbj.id}>
                    {sbj.name} (Coeff {sbj.coefficient || 1})
                  </option>
                ))}
              </select>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                — {classStudents.length} élève(s) dans cette classe
              </span>
            </div>
          )}

          {/* Date Selector & Formula Info */}
          <div className="flex items-center space-x-3 ml-auto">
            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>Date :</span>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* BODY TAB 1: MODE STUDENT (Toutes les matières de l'élève) */}
        {entryMode === 'STUDENT' && (
          <form onSubmit={handleSaveStudentGrades} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 w-48">Discipline / Matière</th>
                      <th className="p-3 text-center w-20">Int 1 (/20)</th>
                      <th className="p-3 text-center w-20">Int 2 (/20)</th>
                      <th className="p-3 text-center w-20">Devoir (/20)</th>
                      <th className="p-3 text-center w-20">Compo (/20)</th>
                      <th className="p-3 text-center w-22 bg-blue-100/60 dark:bg-blue-950/40">Moy. /20</th>
                      <th className="p-3 text-center w-24 bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">Moy. Coeff</th>
                      <th className="p-3">Appréciation Enseignant sur le Bulletin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjectsToEdit.map((sbj, idx) => {
                      const entry = studentFormEntries[sbj.id] || { interro1: '', interro2: '', devoir: '', compo: '', comment: '', teacherName: '' };

                      // Real-time projected average for this subject
                      const int1Val = entry.interro1 !== '' ? parseFloat(entry.interro1) : undefined;
                      const int2Val = entry.interro2 !== '' ? parseFloat(entry.interro2) : undefined;
                      const devVal = entry.devoir !== '' ? parseFloat(entry.devoir) : undefined;
                      const compVal = entry.compo !== '' ? parseFloat(entry.compo) : undefined;

                      let interroParts = 0;
                      let interroSum = 0;
                      if (int1Val !== undefined && !isNaN(int1Val)) {
                        interroSum += int1Val;
                        interroParts += 1;
                      }
                      if (int2Val !== undefined && !isNaN(int2Val)) {
                        interroSum += int2Val;
                        interroParts += 1;
                      }
                      const interroAvg = interroParts > 0 ? (interroSum / interroParts) : undefined;

                      let totalPts = 0;
                      let totalDiv = 0;
                      if (interroAvg !== undefined) {
                        totalPts += interroAvg;
                        totalDiv += 1;
                      }
                      if (devVal !== undefined && !isNaN(devVal)) {
                        totalPts += devVal;
                        totalDiv += 1;
                      }
                      if (compVal !== undefined && !isNaN(compVal)) {
                        totalPts += compVal * 2;
                        totalDiv += 2;
                      }

                      const projectedAvg = totalDiv > 0 ? (totalPts / totalDiv) : null;
                      const coeff = sbj.coefficient || 1;
                      const projectedCoeff = projectedAvg !== null ? (projectedAvg * coeff) : null;

                      return (
                        <tr
                          key={sbj.id}
                          className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-900/40'}
                        >
                          <td className="p-3">
                            <div className="font-black text-sm text-slate-900 dark:text-white">
                              {sbj.name}
                            </div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                              Coefficient : {coeff}
                            </div>
                          </td>

                          {/* Interro 1 Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.interro1}
                              onChange={e => handleStudentEntryChange(sbj.id, 'interro1', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                              title="Note Interro 1"
                            />
                          </td>

                          {/* Interro 2 Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.interro2}
                              onChange={e => handleStudentEntryChange(sbj.id, 'interro2', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                              title="Note Interro 2"
                            />
                          </td>

                          {/* Devoir Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.devoir}
                              onChange={e => handleStudentEntryChange(sbj.id, 'devoir', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </td>

                          {/* Compo Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.compo}
                              onChange={e => handleStudentEntryChange(sbj.id, 'compo', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </td>

                          {/* Projected Average */}
                          <td className="p-2 text-center font-black bg-blue-50/50 dark:bg-blue-950/20">
                            {projectedAvg !== null ? (
                              <span className={`px-2 py-1 rounded-lg text-xs font-mono font-black ${
                                projectedAvg >= 14
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : projectedAvg >= 10
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              }`}>
                                {projectedAvg.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* Projected Coeff Average */}
                          <td className="p-2 text-center font-black bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200">
                            {projectedCoeff !== null ? (
                              <span className="font-mono font-black text-xs">
                                {projectedCoeff.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* Comment Input */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ex : Très bon travail, Régulier, En progrès..."
                              value={entry.comment}
                              onChange={e => handleStudentEntryChange(sbj.id, 'comment', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500">
                💡 Remplissez les notes d'Interro, Devoir et/ou Compo. Dès l'enregistrement, le bulletin et le classement sont recalculés en direct.
              </p>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer sur le Bulletin de l'Élève</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* BODY TAB 2: MODE CLASS (Tous les élèves pour 1 matière sélectionnée) */}
        {entryMode === 'CLASS' && (
          <form onSubmit={handleSaveClassGrades} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 w-10 text-center">N°</th>
                      <th className="p-3 w-52">Élève & Matricule</th>
                      <th className="p-3 text-center w-20">Int 1 (/20)</th>
                      <th className="p-3 text-center w-20">Int 2 (/20)</th>
                      <th className="p-3 text-center w-20">Devoir (/20)</th>
                      <th className="p-3 text-center w-20">Compo (/20)</th>
                      <th className="p-3 text-center w-22 bg-blue-100/60 dark:bg-blue-950/40">Moy. /20</th>
                      <th className="p-3 text-center w-24 bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">Moy. Coeff</th>
                      <th className="p-3">Appréciation Trimestre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classStudents.map((st, idx) => {
                      const entry = classFormEntries[st.id] || { interro1: '', interro2: '', devoir: '', compo: '', comment: '' };

                      const int1Val = entry.interro1 !== '' ? parseFloat(entry.interro1) : undefined;
                      const int2Val = entry.interro2 !== '' ? parseFloat(entry.interro2) : undefined;
                      const devVal = entry.devoir !== '' ? parseFloat(entry.devoir) : undefined;
                      const compVal = entry.compo !== '' ? parseFloat(entry.compo) : undefined;

                      let interroParts = 0;
                      let interroSum = 0;
                      if (int1Val !== undefined && !isNaN(int1Val)) {
                        interroSum += int1Val;
                        interroParts += 1;
                      }
                      if (int2Val !== undefined && !isNaN(int2Val)) {
                        interroSum += int2Val;
                        interroParts += 1;
                      }
                      const interroAvg = interroParts > 0 ? (interroSum / interroParts) : undefined;

                      let totalPts = 0;
                      let totalDiv = 0;
                      if (interroAvg !== undefined) {
                        totalPts += interroAvg;
                        totalDiv += 1;
                      }
                      if (devVal !== undefined && !isNaN(devVal)) {
                        totalPts += devVal;
                        totalDiv += 1;
                      }
                      if (compVal !== undefined && !isNaN(compVal)) {
                        totalPts += compVal * 2;
                        totalDiv += 2;
                      }

                      const projectedAvg = totalDiv > 0 ? (totalPts / totalDiv) : null;
                      const curSbjCoeff = availableSubjects.find(s => s.id === activeSubjectId)?.coefficient || 1;
                      const projectedCoeff = projectedAvg !== null ? (projectedAvg * curSbjCoeff) : null;

                      return (
                        <tr
                          key={st.id}
                          className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-900/40'}
                        >
                          <td className="p-3 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>

                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={st.photoUrl}
                                alt={st.firstName}
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-500/20 shrink-0"
                              />
                              <div>
                                <div className="font-black text-sm text-slate-900 dark:text-white">
                                  {st.lastName.toUpperCase()} {st.firstName}
                                </div>
                                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                                  {st.registrationNumber}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Interro 1 Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.interro1}
                              onChange={e => handleClassEntryChange(st.id, 'interro1', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                              title="Note Interro 1"
                            />
                          </td>

                          {/* Interro 2 Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.interro2}
                              onChange={e => handleClassEntryChange(st.id, 'interro2', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                              title="Note Interro 2"
                            />
                          </td>

                          {/* Devoir Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.devoir}
                              onChange={e => handleClassEntryChange(st.id, 'devoir', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </td>

                          {/* Compo Input */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              placeholder="-"
                              value={entry.compo}
                              onChange={e => handleClassEntryChange(st.id, 'compo', e.target.value)}
                              className="w-16 px-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-center focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </td>

                          {/* Projected Average */}
                          <td className="p-2 text-center font-black bg-blue-50/50 dark:bg-blue-950/20">
                            {projectedAvg !== null ? (
                              <span className={`px-2 py-1 rounded-lg text-xs font-mono font-black ${
                                projectedAvg >= 14
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : projectedAvg >= 10
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              }`}>
                                {projectedAvg.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* Projected Coeff Average */}
                          <td className="p-2 text-center font-black bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200">
                            {projectedCoeff !== null ? (
                              <span className="font-mono font-black text-xs">
                                {projectedCoeff.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* Comment Input */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ex : Bon niveau, Participation active..."
                              value={entry.comment}
                              onChange={e => handleClassEntryChange(st.id, 'comment', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500">
                💡 Remplissez rapidement la colonne des notes pour toute la classe. Seules les lignes avec des notes seront enregistrées.
              </p>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les Notes de la Classe</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
