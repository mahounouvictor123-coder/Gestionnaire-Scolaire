import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { SchoolLevel, Subject } from '../types';
import { OFFICIAL_PRIMARY_SUBJECTS, OFFICIAL_MATERNELLE_SUBJECTS } from '../data/initialData';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Search, 
  Filter,
  RefreshCw,
  Baby,
  School,
  Award
} from 'lucide-react';

export const SubjectsView: React.FC = () => {
  const { subjects, addSubject, deleteSubject } = useApp();

  const [activeCycleTab, setActiveCycleTab] = useState<'PRIMAIRE' | 'MATERNELLE' | 'COLLEGE' | 'LYCEE' | 'ALL'>('PRIMAIRE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [coefficient, setCoefficient] = useState('2');
  const [level, setLevel] = useState<SchoolLevel>('PRIMAIRE');
  const [category, setCategory] = useState<'LITTERAIRE' | 'SCIENTIFIQUE' | 'LANGUE' | 'DIVERS' | 'TECHNIQUE'>('LITTERAIRE');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Filter subjects based on cycle tab, category, and search
  const filteredSubjects = subjects.filter(sb => {
    let matchesCycle = true;
    if (activeCycleTab === 'PRIMAIRE') {
      matchesCycle = sb.level === 'PRIMAIRE';
    } else if (activeCycleTab === 'MATERNELLE') {
      matchesCycle = sb.level === 'MATERNELLE';
    } else if (activeCycleTab === 'COLLEGE') {
      matchesCycle = sb.level === 'COLLEGE';
    } else if (activeCycleTab === 'LYCEE') {
      matchesCycle = sb.level === 'LYCEE' || sb.level === 'UNIVERSITE' || sb.level === 'FORMATION';
    }

    const matchesCategory = selectedCategory === 'ALL' || sb.category === selectedCategory;
    const matchesSearch = 
      sb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sb.code.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCycle && matchesCategory && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addSubject({
      name,
      code: code || name.substring(0, 4).toUpperCase(),
      coefficient: parseInt(coefficient) || 2,
      level,
      category
    });

    setName('');
    setCode('');
    setShowAdd(false);
    setNoticeMsg(`Matière "${name}" ajoutée avec succès pour le niveau ${level} !`);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleInjectPrimaryPreset = () => {
    let count = 0;
    OFFICIAL_PRIMARY_SUBJECTS.forEach(pSub => {
      const exists = subjects.some(s => s.code === pSub.code && s.level === 'PRIMAIRE');
      if (!exists) {
        addSubject({
          name: pSub.name,
          code: pSub.code,
          coefficient: pSub.coefficient,
          level: 'PRIMAIRE',
          category: pSub.category
        });
        count++;
      }
    });

    setNoticeMsg(count > 0 ? `${count} matières officielles du Primaire synchronisées !` : 'Toutes les 7 matières officielles du Primaire sont déjà en place.');
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const primarySubjectsCount = subjects.filter(s => s.level === 'PRIMAIRE').length;
  const maternelleSubjectsCount = subjects.filter(s => s.level === 'MATERNELLE').length;
  const collegeSubjectsCount = subjects.filter(s => s.level === 'COLLEGE').length;
  const lyceeSubjectsCount = subjects.filter(s => s.level === 'LYCEE' || s.level === 'UNIVERSITE').length;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            <span>Gestion Scindée des Matières & Coefficients</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Séparation stricte du cycle Primaire / Maternelle et du cycle Secondaire (Collège / Lycée).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleInjectPrimaryPreset}
            className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-extrabold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span>✨ 7 Matières Officielles Primaire</span>
          </button>

          <button
            onClick={() => {
              setLevel(activeCycleTab === 'PRIMAIRE' ? 'PRIMAIRE' : activeCycleTab === 'MATERNELLE' ? 'MATERNELLE' : 'COLLEGE');
              setShowAdd(!showAdd);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une Matière</span>
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {noticeMsg && (
        <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-extrabold text-xs rounded-2xl flex items-center space-x-2.5 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Cycle Tabs Navigation (Scission Primaire / Maternelle / Secondaire) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveCycleTab('PRIMAIRE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'PRIMAIRE'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <School className="h-4 w-4 shrink-0" />
          <span>🎒 SECTION PRIMAIRE ({primarySubjectsCount})</span>
        </button>

        <button
          onClick={() => setActiveCycleTab('MATERNELLE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'MATERNELLE'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Baby className="h-4 w-4 shrink-0" />
          <span>🧸 SECTION MATERNELLE ({maternelleSubjectsCount})</span>
        </button>

        <button
          onClick={() => setActiveCycleTab('COLLEGE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'COLLEGE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>🏫 SECTION COLLÈGE ({collegeSubjectsCount})</span>
        </button>

        <button
          onClick={() => setActiveCycleTab('LYCEE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'LYCEE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="h-4 w-4 shrink-0" />
          <span>🎓 SECTION LYCÉE & TECH ({lyceeSubjectsCount})</span>
        </button>

        <button
          onClick={() => setActiveCycleTab('ALL')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeCycleTab === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span>🏛️ TOUTES ({subjects.length})</span>
        </button>
      </div>

      {/* Primary Specific Explanatory Banner */}
      {activeCycleTab === 'PRIMAIRE' && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm shrink-0">
              🎒
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-200">
                Programme Académique Officiel du Primaire (CI à CM2)
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                Les 7 disciplines fondamentales : <strong>Communication Écrite (CE)</strong>, <strong>Lecture</strong>, <strong>EST</strong> (Sciences), <strong>ES</strong> (Sociale), <strong>EA</strong> (Artistique), <strong>Mathématiques</strong>, <strong>Sport</strong>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400/40 rounded-full font-black text-[10px] uppercase tracking-wider shrink-0">
            Pédagogie Primaire
          </span>
        </div>
      )}

      {/* Filters Search & Category */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher une matière par nom ou code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-semibold text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Toutes les catégories</option>
            <option value="LITTERAIRE">Lettres & Humanités</option>
            <option value="SCIENTIFIQUE">Sciences & Technologie</option>
            <option value="LANGUE">Langues Vivantes</option>
            <option value="DIVERS">Arts & Sport</option>
            <option value="TECHNIQUE">Technique & Tertiaire</option>
          </select>
        </div>
      </div>

      {/* Add Modal / Form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Créer une Nouvelle Matière</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Pondération & Cycle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Intitulé de la matière *</label>
              <input
                type="text"
                required
                placeholder="Ex: Communication Écrite, Lecture, EST..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Code court</label>
              <input
                type="text"
                placeholder="Ex: CE, LECT, EST, ES, EA, MATH"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Coefficient de pondération</label>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="Coefficient (1, 2, 3...)"
                value={coefficient}
                onChange={e => setCoefficient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Niveau / Section *</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as SchoolLevel)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="PRIMAIRE">🎒 Primaire (CI à CM2)</option>
                <option value="MATERNELLE">🧸 Maternelle</option>
                <option value="COLLEGE">🏫 Collège (6ème à 3ème)</option>
                <option value="LYCEE">🎓 Lycée (2nde à Tle)</option>
                <option value="UNIVERSITE">🏛️ Université / Supérieur</option>
                <option value="FORMATION">🔧 Formation Pro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Catégorie disciplinaire</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="LITTERAIRE">Lettres, Langues & Humanités (CE, Lecture, Français...)</option>
                <option value="SCIENTIFIQUE">Sciences, Calcul & Technologie (Maths, EST, PC, SVT...)</option>
                <option value="LANGUE">Langues Vivantes (Anglais, Espagnol, Allemand...)</option>
                <option value="DIVERS">Arts, Sport & Éveil (EA, Sport, Musique...)</option>
                <option value="TECHNIQUE">Disciplines Techniques & Gestion (Comptabilité, Économie...)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md cursor-pointer"
            >
              Enregistrer la Matière
            </button>
          </div>
        </form>
      )}

      {/* Grid or Table of Subjects */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-black border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Code & Matière</th>
              <th className="p-3.5">Section / Cycle</th>
              <th className="p-3.5">Catégorie</th>
              <th className="p-3.5 text-center">Coefficient</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map(sb => {
                const isPrimary = sb.level === 'PRIMAIRE';
                const isMaternelle = sb.level === 'MATERNELLE';
                const isCollege = sb.level === 'COLLEGE';
                const isLycee = sb.level === 'LYCEE';

                return (
                  <tr key={sb.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl font-black text-[11px] flex items-center justify-center shrink-0 ${
                          isPrimary
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : isMaternelle
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isCollege
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {sb.code.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                            {sb.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Code : <span className="font-black text-slate-700 dark:text-slate-300">{sb.code}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {isPrimary && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                          <span>🎒</span>
                          <span>PRIMAIRE</span>
                        </span>
                      )}
                      {isMaternelle && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                          <span>🧸</span>
                          <span>MATERNELLE</span>
                        </span>
                      )}
                      {isCollege && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800">
                          <span>🏫</span>
                          <span>COLLÈGE</span>
                        </span>
                      )}
                      {isLycee && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                          <span>🎓</span>
                          <span>LYCÉE</span>
                        </span>
                      )}
                      {!isPrimary && !isMaternelle && !isCollege && !isLycee && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {sb.level}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-400">
                      {sb.category === 'LITTERAIRE' ? 'Lettres & Humanités' :
                       sb.category === 'SCIENTIFIQUE' ? 'Sciences & Technologie' :
                       sb.category === 'LANGUE' ? 'Langues' :
                       sb.category === 'DIVERS' ? 'Arts & Sport' :
                       sb.category === 'TECHNIQUE' ? 'Technique & Gestion' : sb.category}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700">
                        Coef. {sb.coefficient}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => deleteSubject(sb.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                        title="Supprimer cette matière"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                  Aucune matière trouvée pour cette sélection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
