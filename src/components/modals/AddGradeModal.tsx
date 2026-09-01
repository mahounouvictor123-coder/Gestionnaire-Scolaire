import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { X, ClipboardList } from 'lucide-react';

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGradeModal: React.FC<AddGradeModalProps> = ({ isOpen, onClose }) => {
  const { students, subjects, classes, addGrade } = useApp();

  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [examType, setExamType] = useState<'DEVOIR' | 'COMPOSITION' | 'TP' | 'PROJET'>('COMPOSITION');
  const [mark, setMark] = useState('15.5');
  const [coefficient, setCoefficient] = useState('2');

  // Escape key handler for smooth closing
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter classes by level
  const filteredClasses = selectedLevel === 'ALL'
    ? classes
    : classes.filter(c => c.level === selectedLevel);

  // Handle Level Change
  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel);
    const availableClasses = newLevel === 'ALL'
      ? classes
      : classes.filter(c => c.level === newLevel);
    
    const newClassId = availableClasses[0]?.id || 'ALL';
    setSelectedClassId(newClassId);

    const availableStudents = newClassId === 'ALL'
      ? students
      : students.filter(s => s.classId === newClassId);

    if (availableStudents.length > 0) {
      setSelectedStudentId(availableStudents[0].id);
    } else {
      setSelectedStudentId('');
    }
  };

  // Handle Class Change
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const availableStudents = newClassId === 'ALL'
      ? (selectedLevel === 'ALL' ? students : students.filter(s => {
          const c = classes.find(cl => cl.id === s.classId);
          return c?.level === selectedLevel;
        }))
      : students.filter(s => s.classId === newClassId);

    if (availableStudents.length > 0) {
      setSelectedStudentId(availableStudents[0].id);
    } else {
      setSelectedStudentId('');
    }
  };

  // Available students list based on level and class filter
  const filteredStudents = students.filter(s => {
    const studentClass = classes.find(c => c.id === s.classId);
    const matchesLevel = selectedLevel === 'ALL' || studentClass?.level === selectedLevel;
    const matchesClass = selectedClassId === 'ALL' || s.classId === selectedClassId;
    return matchesLevel && matchesClass;
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentClass = classes.find(c => c.id === selectedStudent?.classId);
  const activeLevel = studentClass?.level || (selectedLevel !== 'ALL' ? selectedLevel : 'ALL');

  // Filter subjects strictly according to the student or selected class level
  const relevantSubjects = subjects.filter(sb => {
    if (activeLevel === 'PRIMAIRE') return sb.level === 'PRIMAIRE';
    if (activeLevel === 'MATERNELLE') return sb.level === 'MATERNELLE';
    if (activeLevel === 'COLLEGE') return sb.level === 'COLLEGE' || sb.level === 'LYCEE';
    if (activeLevel === 'LYCEE') return sb.level === 'LYCEE' || sb.level === 'COLLEGE' || sb.level === 'UNIVERSITE';
    return true;
  });

  // Ensure selectedSubjectId points to a valid subject in relevantSubjects
  React.useEffect(() => {
    if (relevantSubjects.length > 0 && !relevantSubjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(relevantSubjects[0].id);
      setCoefficient(relevantSubjects[0].coefficient.toString());
    }
  }, [selectedStudentId, selectedClassId, selectedLevel, relevantSubjects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find(s => s.id === selectedStudentId);
    if (!std) return;

    addGrade({
      studentId: std.id,
      subjectId: selectedSubjectId,
      classId: std.classId,
      trimester,
      examType,
      mark: parseFloat(mark) || 0,
      maxMark: 20,
      coefficient: parseInt(coefficient) || 2,
      date: new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md my-auto overflow-hidden flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="p-4 bg-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-amber-300" />
            <h3 className="font-extrabold text-base">Saisie d'une Note d'Élève</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* STEP 1: LEVEL & CLASS SELECTION */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-200 dark:border-slate-700 space-y-3">
            
            {/* 1. Niveau / Cycle */}
            <div>
              <label className="block font-black uppercase text-[11px] text-indigo-900 dark:text-indigo-300 mb-1">
                1. Sélectionner le Niveau / Cycle *
              </label>
              <select
                value={selectedLevel}
                onChange={e => handleLevelChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">🏫 Tous les Niveaux ({classes.length} classes)</option>
                <option value="PRIMAIRE">🎒 PRIMAIRE ({classes.filter(c => c.level === 'PRIMAIRE').length} classes)</option>
                <option value="MATERNELLE">🧸 MATERNELLE ({classes.filter(c => c.level === 'MATERNELLE').length} classes)</option>
                <option value="COLLEGE">🏫 COLLÈGE ({classes.filter(c => c.level === 'COLLEGE').length} classes)</option>
                <option value="LYCEE">🎓 LYCÉE ({classes.filter(c => c.level === 'LYCEE').length} classes)</option>
              </select>
            </div>

            {/* 2. Classe */}
            <div>
              <label className="block font-black uppercase text-[11px] text-indigo-900 dark:text-indigo-300 mb-1">
                2. Choisir la Classe *
              </label>
              <select
                value={selectedClassId}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Toutes les classes du niveau ({filteredClasses.length})</option>
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    🏫 {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Élève */}
            <div>
              <label className="block font-black uppercase text-[11px] text-indigo-900 dark:text-indigo-300 mb-1">
                3. Sélectionner l'Élève *
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">Aucun élève trouvé dans ce choix</option>
                ) : (
                  filteredStudents.map(s => {
                    const studentClass = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        👤 {s.lastName} {s.firstName} [{studentClass?.name || 'Inconnu'}] — Mat: {s.registrationNumber}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Matière * {activeLevel === 'PRIMAIRE' && <span className="text-amber-600 font-extrabold">(7 Matières Officielles du Primaire)</span>}
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => {
                const subId = e.target.value;
                setSelectedSubjectId(subId);
                const subObj = relevantSubjects.find(s => s.id === subId);
                if (subObj) setCoefficient(subObj.coefficient.toString());
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            >
              {relevantSubjects.map(sb => (
                <option key={sb.id} value={sb.id}>
                  {sb.name} (Code: {sb.code}, Coeff {sb.coefficient})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trimestre</label>
              <select
                value={trimester}
                onChange={e => setTrimester(parseInt(e.target.value) as 1 | 2 | 3)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value={1}>1er Trimestre</option>
                <option value={2}>2ème Trimestre</option>
                <option value={3}>3ème Trimestre</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Type d'Évaluation</label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="DEVOIR">Devoir de Classe</option>
                <option value="COMPOSITION">Composition Trimestrielle</option>
                <option value="TP">Travaux Pratiques (TP)</option>
                <option value="PROJET">Projet / Exposé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Note Obtenue (/20) *</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                required
                value={mark}
                onChange={e => setMark(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm text-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Coefficient Note</label>
              <input
                type="number"
                min="1"
                max="10"
                value={coefficient}
                onChange={e => setCoefficient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow"
            >
              Enregistrer la Note
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
