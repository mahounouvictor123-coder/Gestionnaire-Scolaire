import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Student } from '../types';
import { AddStudentModal } from '../components/modals/AddStudentModal';
import { EditStudentModal } from '../components/modals/EditStudentModal';
import { PrintStudentCardModal } from '../components/modals/PrintStudentCardModal';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import {
  Users,
  Search,
  UserPlus,
  FileCheck2,
  CreditCard,
  Trash2,
  Edit,
  Filter,
  Eye,
  FileText,
  ScanLine,
  Sparkles
} from 'lucide-react';

interface StudentsViewProps {
  onNavigateToScanRoster?: (classId?: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onNavigateToScanRoster }) => {
  const { students, classes, deleteStudent, settings } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'SINGLE' | 'BULK_PASTE'>('SINGLE');
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);

  // Filter classes according to selectedLevelFilter
  const availableClassesForFilter = classes.filter(c => {
    if (selectedLevelFilter === 'ALL') return true;
    return c.level === selectedLevelFilter;
  });

  // Filter students
  const filteredStudents = students.filter(std => {
    const matchesSearch =
      std.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.parentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevelFilter === 'ALL' || std.level === selectedLevelFilter;
    const matchesClass = selectedClassFilter === 'ALL' || std.classId === selectedClassFilter;

    return matchesSearch && matchesLevel && matchesClass;
  });

  const countPrimaire = students.filter(s => s.level === 'PRIMAIRE').length;
  const countMaternelle = students.filter(s => s.level === 'MATERNELLE').length;
  const countCollege = students.filter(s => s.level === 'COLLEGE').length;
  const countLycee = students.filter(s => s.level === 'LYCEE' || s.level === 'UNIVERSITE').length;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            <span>Gestion Scindée du Dossier Scolaire des Élèves</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {students.length} élèves inscrits. Gestion séparée de la section Primaire / Maternelle et du Secondaire (Collège & Lycée).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setAddModalMode('BULK_PASTE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>📋 Inscription Copier-Coller (IA A-Z)</span>
          </button>

          {onNavigateToScanRoster && (
            <button
              onClick={() => onNavigateToScanRoster(selectedClassFilter !== 'ALL' ? selectedClassFilter : undefined)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <ScanLine className="h-4 w-4 text-amber-300" />
              <span>Scan Photo de Classe (IA)</span>
            </button>
          )}

          <button
            onClick={() => {
              setAddModalMode('SINGLE');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Saisie Unique</span>
          </button>
        </div>
      </div>

      {/* Section / Cycle Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setSelectedLevelFilter('PRIMAIRE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'PRIMAIRE'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎒</span>
          <span>SECTION PRIMAIRE ({countPrimaire})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('MATERNELLE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'MATERNELLE'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🧸</span>
          <span>MATERNELLE ({countMaternelle})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('COLLEGE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'COLLEGE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏫</span>
          <span>COLLÈGE ({countCollege})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('LYCEE');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'LYCEE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎓</span>
          <span>LYCÉE & TECH ({countLycee})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLevelFilter('ALL');
            setSelectedClassFilter('ALL');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            selectedLevelFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏛️</span>
          <span>TOUT L'ÉTABLISSEMENT ({students.length})</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, prénom, matricule, parent..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
          />
        </div>

        {/* Level Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedLevelFilter}
            onChange={(e) => {
              setSelectedLevelFilter(e.target.value);
              setSelectedClassFilter('ALL');
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">Tous les Niveaux</option>
            <option value="PRIMAIRE">🎒 Primaire</option>
            <option value="MATERNELLE">🧸 Maternelle</option>
            <option value="COLLEGE">🏫 Collège</option>
            <option value="LYCEE">🎓 Lycée</option>
            <option value="UNIVERSITE">🏛️ Université</option>
            <option value="FORMATION">🔧 Formation Pro</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">Toutes les Classes ({availableClassesForFilter.length})</option>
            {availableClassesForFilter.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Student List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Élève & Matricule</th>
                <th className="p-3">Niveau / Classe</th>
                <th className="p-3">Sexe & Né(e) le</th>
                <th className="p-3">Parent & Contact</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions / Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(std => {
                  const cls = classes.find(c => c.id === std.classId);
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Photo & Name */}
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={std.photoUrl}
                            alt={std.firstName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {std.lastName} {std.firstName}
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              {std.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {cls?.name || std.classId}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{std.level}</span>
                      </td>

                      {/* Gender & Birth */}
                      <td className="p-3">
                        <p className="font-medium text-slate-900 dark:text-white">{std.dateOfBirth}</p>
                        <p className="text-[10px] text-slate-500">Sexe: {std.gender} | Groupe: {std.bloodGroup || 'O+'}</p>
                      </td>

                      {/* Parent */}
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white">{std.parentName}</p>
                        <p className="text-[10px] text-slate-500">{std.parentPhone}</p>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {std.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedStudentForEdit(std)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-600 transition-colors cursor-pointer"
                          title="Modifier le dossier / la photo de l'élève"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setSelectedStudentForCard(std)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 transition-colors cursor-pointer"
                          title="Carte Scolaire (Modifier / Imprimer)"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setSelectedStudentForBulletin(std)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 transition-colors cursor-pointer"
                          title="Bulletin Trimestriel"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Supprimer l'élève ${std.firstName} ${std.lastName} ?`)) {
                              deleteStudent(std.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                    Aucun élève ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialMode={addModalMode}
        initialClassId={selectedClassFilter !== 'ALL' ? selectedClassFilter : undefined}
      />

      {selectedStudentForEdit && (
        <EditStudentModal
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
          student={selectedStudentForEdit}
          onOpenCard={(s) => setSelectedStudentForCard(s)}
          onOpenBulletin={(s) => setSelectedStudentForBulletin(s)}
        />
      )}

      {selectedStudentForCard && (
        <PrintStudentCardModal
          isOpen={!!selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
          student={selectedStudentForCard}
          classObj={classes.find(c => c.id === selectedStudentForCard.classId)}
        />
      )}

      {selectedStudentForBulletin && (
        <PrintBulletinModal
          isOpen={!!selectedStudentForBulletin}
          onClose={() => setSelectedStudentForBulletin(null)}
          student={selectedStudentForBulletin}
          classObj={classes.find(c => c.id === selectedStudentForBulletin.classId) || classes[0]}
          trimester={settings.currentTrimester}
        />
      )}

    </div>
  );
};
