import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { Grade } from '../../types';
import { X, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: Grade | null;
}

export const EditGradeModal: React.FC<EditGradeModalProps> = ({ isOpen, onClose, grade }) => {
  const { students, subjects, classes, updateGrade } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [examType, setExamType] = useState<any>('DEVOIR');
  const [mark, setMark] = useState('');
  const [maxMark, setMaxMark] = useState('20');
  const [coefficient, setCoefficient] = useState('1');
  const [date, setDate] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (grade) {
      setSelectedSubjectId(grade.subjectId);
      setTrimester((grade.trimester as 1 | 2 | 3) || 1);
      setExamType(grade.examType || 'DEVOIR');
      setMark(grade.mark.toString());
      setMaxMark((grade.maxMark || 20).toString());
      setCoefficient(grade.coefficient.toString());
      setDate(grade.date || new Date().toISOString().split('T')[0]);
      setSuccessMessage(null);
    }
  }, [grade]);

  // Handle escape key to close modal quickly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !grade) return null;

  const currentStudent = students.find(s => s.id === grade.studentId);
  const currentClass = classes.find(c => c.id === grade.classId || c.id === currentStudent?.classId);
  const currentLevel = currentClass?.level || currentStudent?.level || 'PRIMAIRE';

  // Filter subjects matching cycle/level
  const relevantSubjects = subjects.filter(sb => {
    if (currentLevel === 'PRIMAIRE') return sb.level === 'PRIMAIRE';
    if (currentLevel === 'MATERNELLE') return sb.level === 'MATERNELLE';
    if (currentLevel === 'COLLEGE') return sb.level === 'COLLEGE' || sb.level === 'LYCEE';
    if (currentLevel === 'LYCEE') return sb.level === 'LYCEE' || sb.level === 'COLLEGE' || sb.level === 'UNIVERSITE';
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numMark = parseFloat(mark);
    const numMaxMark = parseFloat(maxMark) || 20;

    if (isNaN(numMark) || numMark < 0 || numMark > numMaxMark) {
      alert(`Veuillez entrer une note valide comprise entre 0 et ${numMaxMark}.`);
      return;
    }

    updateGrade(grade.id, {
      subjectId: selectedSubjectId || grade.subjectId,
      trimester,
      examType,
      mark: numMark,
      maxMark: numMaxMark,
      coefficient: parseInt(coefficient) || 1,
      date
    });

    setSuccessMessage("✅ Note rectifiée et enregistrée avec succès !");
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg my-auto overflow-hidden flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white border border-white/20">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Modification de Note</h3>
              <p className="text-xs text-amber-100">
                Corrigez une note saisie avec erreur ou ajustez l'évaluation
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Student summary info banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={currentStudent?.photoUrl || '/icon.svg'}
              alt={currentStudent?.firstName || 'Élève'}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-500/40 shrink-0"
            />
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                {currentStudent ? `${currentStudent.lastName} ${currentStudent.firstName}` : 'Élève inconnu'}
              </p>
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>🏫 {currentClass?.name || 'Classe N/A'}</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400">Matricule : {currentStudent?.registrationNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-xs uppercase border border-amber-300 dark:border-amber-800">
            {currentLevel}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Subject selection */}
          <div>
            <label className="block font-black uppercase text-[11px] text-slate-700 dark:text-slate-300 mb-1.5">
              Matière / Discipline *
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => {
                const subId = e.target.value;
                setSelectedSubjectId(subId);
                const subObj = subjects.find(s => s.id === subId);
                if (subObj) setCoefficient(subObj.coefficient.toString());
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
            >
              {relevantSubjects.length > 0 ? (
                relevantSubjects.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name} (Code: {sb.code} • Coeff {sb.coefficient})
                  </option>
                ))
              ) : (
                subjects.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name} (Coeff {sb.coefficient})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Trimester */}
            <div>
              <label className="block font-black uppercase text-[11px] text-slate-700 dark:text-slate-300 mb-1.5">
                Trimestre *
              </label>
              <select
                value={trimester}
                onChange={e => setTrimester(parseInt(e.target.value) as 1 | 2 | 3)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value={1}>1er Trimestre</option>
                <option value={2}>2ème Trimestre</option>
                <option value={3}>3ème Trimestre</option>
              </select>
            </div>

            {/* Exam type */}
            <div>
              <label className="block font-black uppercase text-[11px] text-slate-700 dark:text-slate-300 mb-1.5">
                Type d'Évaluation *
              </label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="INTERRO">Interrogation Écrite</option>
                <option value="DEVOIR">Devoir Surveillé de Classe</option>
                <option value="COMPOSITION">Composition Trimestrielle</option>
                <option value="TP">Travaux Pratiques (TP)</option>
                <option value="PROJET">Projet / Exposé Oral</option>
              </select>
            </div>
          </div>

          {/* Mark & Max mark */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-black uppercase text-[11px] text-amber-950 dark:text-amber-200 mb-1.5">
                Note Obtenue *
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max={parseFloat(maxMark) || 20}
                required
                value={mark}
                onChange={e => setMark(e.target.value)}
                placeholder="ex: 14.5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-black text-base focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-[11px] text-amber-950 dark:text-amber-200 mb-1.5">
                Barème (Sur) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={maxMark}
                onChange={e => setMaxMark(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-[11px] text-amber-950 dark:text-amber-200 mb-1.5">
                Coefficient *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={coefficient}
                onChange={e => setCoefficient(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block font-black uppercase text-[11px] text-slate-700 dark:text-slate-300 mb-1.5">
              Date de l'évaluation
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 flex items-center space-x-2 cursor-pointer transition-all transform hover:scale-[1.01]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enregistrer la Correction</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
