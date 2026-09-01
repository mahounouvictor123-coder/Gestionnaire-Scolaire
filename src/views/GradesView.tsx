import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Grade } from '../types';
import { AddGradeModal } from '../components/modals/AddGradeModal';
import { EditGradeModal } from '../components/modals/EditGradeModal';
import { ScanGradesModal } from '../components/modals/ScanGradesModal';
import { AIGradesBulletinWhatsAppModal } from '../components/modals/AIGradesBulletinWhatsAppModal';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit3,
  Filter, 
  ScanLine, 
  Bot, 
  School, 
  Baby, 
  GraduationCap, 
  Award, 
  Layers,
  Search,
  BookOpen
} from 'lucide-react';

export const GradesView: React.FC = () => {
  const { grades, students, subjects, classes, settings, deleteGrade } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAiWhatsAppModal, setShowAiWhatsAppModal] = useState(false);
  const [selectedGradeForEdit, setSelectedGradeForEdit] = useState<Grade | null>(null);
  const [trimesterFilter, setTrimesterFilter] = useState<number>(settings.currentTrimester || 1);
  const [activeCycleTab, setActiveCycleTab] = useState<'PRIMAIRE' | 'MATERNELLE' | 'COLLEGE' | 'LYCEE' | 'ALL'>('PRIMAIRE');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredClasses = classes.filter(c => {
    if (activeCycleTab === 'ALL') return true;
    if (activeCycleTab === 'PRIMAIRE') return c.level === 'PRIMAIRE';
    if (activeCycleTab === 'MATERNELLE') return c.level === 'MATERNELLE';
    if (activeCycleTab === 'COLLEGE') return c.level === 'COLLEGE';
    if (activeCycleTab === 'LYCEE') return c.level === 'LYCEE' || c.level === 'UNIVERSITE' || c.level === 'FORMATION';
    return true;
  });

  const filteredGrades = grades.filter(g => {
    const matchesTrimester = g.trimester === trimesterFilter;
    const gradeClass = classes.find(c => c.id === g.classId);
    
    let matchesCycle = true;
    if (activeCycleTab === 'PRIMAIRE') {
      matchesCycle = gradeClass?.level === 'PRIMAIRE';
    } else if (activeCycleTab === 'MATERNELLE') {
      matchesCycle = gradeClass?.level === 'MATERNELLE';
    } else if (activeCycleTab === 'COLLEGE') {
      matchesCycle = gradeClass?.level === 'COLLEGE';
    } else if (activeCycleTab === 'LYCEE') {
      matchesCycle = gradeClass?.level === 'LYCEE' || gradeClass?.level === 'UNIVERSITE' || gradeClass?.level === 'FORMATION';
    }

    const matchesClass = classFilter === 'ALL' || g.classId === classFilter;
    
    const std = students.find(s => s.id === g.studentId);
    const sbj = subjects.find(s => s.id === g.subjectId);
    const matchesSearch = !searchTerm || 
      `${std?.lastName} ${std?.firstName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sbj?.name && sbj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sbj?.code && sbj.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTrimester && matchesCycle && matchesClass && matchesSearch;
  });

  const primaryGradesCount = grades.filter(g => {
    const c = classes.find(cl => cl.id === g.classId);
    return c?.level === 'PRIMAIRE';
  }).length;

  const maternelleGradesCount = grades.filter(g => {
    const c = classes.find(cl => cl.id === g.classId);
    return c?.level === 'MATERNELLE';
  }).length;

  const collegeGradesCount = grades.filter(g => {
    const c = classes.find(cl => cl.id === g.classId);
    return c?.level === 'COLLEGE';
  }).length;

  const lyceeGradesCount = grades.filter(g => {
    const c = classes.find(cl => cl.id === g.classId);
    return c?.level === 'LYCEE' || c?.level === 'UNIVERSITE';
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <ClipboardList className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            <span>Registre Scindé des Notes & Évaluations</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Évaluations distinctes pour l'Enseignement Primaire / Maternelle et le Secondaire (Collège & Lycée).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowAiWhatsAppModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <Bot className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>📲 WhatsApp Notes aux Parents</span>
          </button>

          <button
            onClick={() => setShowScanModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <ScanLine className="h-4 w-4 text-amber-300" />
            <span>Scan IA Notes de Classe</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Saisir une Note</span>
          </button>
        </div>
      </div>

      {/* Cycle Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setActiveCycleTab('PRIMAIRE');
            setClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'PRIMAIRE'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <School className="h-4 w-4 shrink-0" />
          <span>🎒 SECTION PRIMAIRE ({primaryGradesCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveCycleTab('MATERNELLE');
            setClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'MATERNELLE'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Baby className="h-4 w-4 shrink-0" />
          <span>🧸 MATERNELLE ({maternelleGradesCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveCycleTab('COLLEGE');
            setClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'COLLEGE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>🏫 COLLÈGE ({collegeGradesCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveCycleTab('LYCEE');
            setClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'LYCEE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="h-4 w-4 shrink-0" />
          <span>🎓 LYCÉE ({lyceeGradesCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveCycleTab('ALL');
            setClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span>🏛️ TOUTES LES NOTES ({grades.length})</span>
        </button>
      </div>

      {/* Primary Highlights Bar */}
      {activeCycleTab === 'PRIMAIRE' && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-amber-950 dark:text-amber-200">
              Disciplines Évaluées au Primaire :
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">Communication Écrite (CE)</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">Lecture</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">EST (Sciences)</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">ES (Sociale)</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">EA (Artistique)</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">Mathématiques</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 font-extrabold text-[11px] text-amber-950 dark:text-amber-200">Sport</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          
          <select
            value={trimesterFilter}
            onChange={e => setTrimesterFilter(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value={1}>1er Trimestre</option>
            <option value={2}>2ème Trimestre</option>
            <option value={3}>3ème Trimestre</option>
          </select>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          >
            <option value="ALL">Toutes les classes sélectionnées ({filteredClasses.length})</option>
            {filteredClasses.map(c => (
              <option key={c.id} value={c.id}>🏫 {c.name} ({c.level})</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher élève ou matière..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-black border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Élève & Classe</th>
              <th className="p-3.5">Section</th>
              <th className="p-3.5">Matière & Code</th>
              <th className="p-3.5">Type d'Épreuve</th>
              <th className="p-3.5 text-center">Coeff</th>
              <th className="p-3.5 text-center">Note Obtenue</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredGrades.length > 0 ? (
              filteredGrades.map(g => {
                const std = students.find(s => s.id === g.studentId);
                const sbj = subjects.find(s => s.id === g.subjectId);
                const gradeClass = classes.find(c => c.id === g.classId);
                const isPrimary = gradeClass?.level === 'PRIMAIRE';
                const isMaternelle = gradeClass?.level === 'MATERNELLE';
                const isPassing = g.mark >= 10;

                return (
                  <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {std ? `${std.lastName} ${std.firstName}` : 'Élève inconnu'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {gradeClass?.name || 'Classe N/A'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                          🎒 PRIMAIRE
                        </span>
                      )}
                      {isMaternelle && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                          🧸 MATERNELLE
                        </span>
                      )}
                      {!isPrimary && !isMaternelle && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800">
                          🏫 SECONDAIRE
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 block">
                        {sbj?.name || 'Matière'}
                      </span>
                      {sbj?.code && (
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          Code: {sbj.code}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[11px]">
                        {g.examType}
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-bold text-slate-600 dark:text-slate-400">
                      {g.coefficient}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm ${
                        isPassing 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {g.mark} / {g.maxMark || 20}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500 font-medium text-[11px]">
                      {g.date}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedGradeForEdit(g)}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                          title="Modifier cette note (corriger une erreur)"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Voulez-vous vraiment supprimer cette note ?")) {
                              deleteGrade(g.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Supprimer cette note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold italic">
                  Aucune note trouvée pour les critères et la section sélectionnés.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddGradeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {selectedGradeForEdit && (
        <EditGradeModal
          isOpen={!!selectedGradeForEdit}
          onClose={() => setSelectedGradeForEdit(null)}
          grade={selectedGradeForEdit}
        />
      )}

      <ScanGradesModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
      />

      <AIGradesBulletinWhatsAppModal
        isOpen={showAiWhatsAppModal}
        onClose={() => setShowAiWhatsAppModal(false)}
      />

    </div>
  );
};
