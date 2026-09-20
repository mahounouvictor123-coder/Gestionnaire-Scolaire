import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { SchoolClass, TuitionTranche } from '../../types';
import {
  X,
  DollarSign,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Printer,
  Calendar,
  HelpCircle,
  TrendingUp,
  Percent,
  RefreshCw
} from 'lucide-react';

interface ConfigureClassFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassId?: string; // If specified, highlights/filters this class
}

export const ConfigureClassFeesModal: React.FC<ConfigureClassFeesModalProps> = ({
  isOpen,
  onClose,
  targetClassId
}) => {
  const { classes, updateClass, settings, currentSchool } = useApp();

  // Helper to extract default 3 tranches if not already configured
  const getInitialClassData = () => {
    return classes.map(cls => {
      const tuitionTotal = cls.tuitionFee || 100000;
      let t1 = Math.round(tuitionTotal * 0.4);
      let t2 = Math.round(tuitionTotal * 0.35);
      let t3 = tuitionTotal - (t1 + t2);

      let d1 = "30 Novembre";
      let d2 = "28 Février";
      let d3 = "31 Mai";

      if (cls.tranches && cls.tranches.length >= 3) {
        t1 = cls.tranches[0]?.amount ?? t1;
        t2 = cls.tranches[1]?.amount ?? t2;
        t3 = cls.tranches[2]?.amount ?? t3;
        d1 = cls.tranches[0]?.dueDate || d1;
        d2 = cls.tranches[1]?.dueDate || d2;
        d3 = cls.tranches[2]?.dueDate || d3;
      }

      return {
        id: cls.id,
        name: cls.name,
        level: cls.level,
        tuitionFee: tuitionTotal,
        tranche1: t1,
        dueDate1: d1,
        tranche2: t2,
        dueDate2: d2,
        tranche3: t3,
        dueDate3: d3
      };
    });
  };

  const [feeRows, setFeeRows] = useState(getInitialClassData);
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [isSaved, setIsSaved] = useState(false);
  const [showBatchApply, setShowBatchApply] = useState(false);
  const [batchLevel, setBatchLevel] = useState<string>('LYCEE');
  const [batchTotal, setBatchTotal] = useState<number>(120000);
  const [batchSplitMode, setBatchSplitMode] = useState<'40_35_25' | '50_30_20' | '33_33_34'>('40_35_25');

  if (!isOpen) return null;

  const handleFieldChange = (
    classId: string,
    field: 'tuitionFee' | 'tranche1' | 'tranche2' | 'tranche3' | 'dueDate1' | 'dueDate2' | 'dueDate3',
    value: any
  ) => {
    setFeeRows(prev =>
      prev.map(row => {
        if (row.id !== classId) return row;

        const updated = { ...row, [field]: value };

        // If user modifies total tuition fee, auto-suggest balanced tranches
        if (field === 'tuitionFee') {
          const total = Number(value) || 0;
          const t1 = Math.round(total * 0.4);
          const t2 = Math.round(total * 0.35);
          const t3 = total - (t1 + t2);
          updated.tranche1 = t1;
          updated.tranche2 = t2;
          updated.tranche3 = t3;
        }

        return updated;
      })
    );
    setIsSaved(false);
  };

  const autoBalanceRow = (classId: string, mode: '40_35_25' | '50_30_20' | '33_33_34' = '40_35_25') => {
    setFeeRows(prev =>
      prev.map(row => {
        if (row.id !== classId) return row;
        const total = Number(row.tuitionFee) || 0;
        let t1 = 0, t2 = 0, t3 = 0;
        if (mode === '40_35_25') {
          t1 = Math.round(total * 0.4);
          t2 = Math.round(total * 0.35);
          t3 = total - (t1 + t2);
        } else if (mode === '50_30_20') {
          t1 = Math.round(total * 0.5);
          t2 = Math.round(total * 0.3);
          t3 = total - (t1 + t2);
        } else {
          t1 = Math.round(total / 3);
          t2 = Math.round(total / 3);
          t3 = total - (t1 + t2);
        }
        return {
          ...row,
          tranche1: t1,
          tranche2: t2,
          tranche3: t3
        };
      })
    );
  };

  const applyBatchToLevel = () => {
    setFeeRows(prev =>
      prev.map(row => {
        if (batchLevel !== 'ALL' && row.level !== batchLevel) return row;
        const total = Number(batchTotal) || 0;
        let t1 = 0, t2 = 0, t3 = 0;
        if (batchSplitMode === '40_35_25') {
          t1 = Math.round(total * 0.4);
          t2 = Math.round(total * 0.35);
          t3 = total - (t1 + t2);
        } else if (batchSplitMode === '50_30_20') {
          t1 = Math.round(total * 0.5);
          t2 = Math.round(total * 0.3);
          t3 = total - (t1 + t2);
        } else {
          t1 = Math.round(total / 3);
          t2 = Math.round(total / 3);
          t3 = total - (t1 + t2);
        }

        return {
          ...row,
          tuitionFee: total,
          tranche1: t1,
          tranche2: t2,
          tranche3: t3
        };
      })
    );
    setShowBatchApply(false);
  };

  const handleSaveAll = () => {
    feeRows.forEach(row => {
      const tranches: TuitionTranche[] = [
        {
          id: `${row.id}-t1`,
          name: '1ère Tranche',
          amount: Number(row.tranche1) || 0,
          dueDate: row.dueDate1 || '30 Novembre',
          description: 'Rentrée scolaire & Inscription'
        },
        {
          id: `${row.id}-t2`,
          name: '2ème Tranche',
          amount: Number(row.tranche2) || 0,
          dueDate: row.dueDate2 || '28 Février',
          description: 'Deuxième trimestre'
        },
        {
          id: `${row.id}-t3`,
          name: '3ème Tranche',
          amount: Number(row.tranche3) || 0,
          dueDate: row.dueDate3 || '31 Mai',
          description: 'Troisième trimestre'
        }
      ];

      updateClass(row.id, {
        tuitionFee: Number(row.tuitionFee) || 0,
        tranches: tranches
      });
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const filteredRows = feeRows.filter(r => {
    if (targetClassId) return r.id === targetClassId;
    if (levelFilter === 'ALL') return true;
    return r.level === levelFilter;
  });

  const totalSchoolBudget = feeRows.reduce((acc, r) => {
    const cls = classes.find(c => c.id === r.id);
    const count = cls?.studentCount || 0;
    return acc + count * (Number(r.tuitionFee) || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide flex items-center space-x-2">
                <span>Barème des Frais de Scolarité & Tranches par Classe</span>
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {currentSchool?.name || settings.schoolName} • Définition des montants de scolarité totale, 1ère, 2ème et 3ème tranches
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Tools & Level Filters Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center space-x-1">
              <Layers className="h-3.5 w-3.5" />
              <span>Filtrer :</span>
            </span>

            {['ALL', 'MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE'].map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {lvl === 'ALL' ? `Toutes (${feeRows.length})` : lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowBatchApply(!showBatchApply)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>🪄 Appliquer en Lot par Niveau</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
              title="Imprimer la grille des tarifs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer Grille</span>
            </button>
          </div>
        </div>

        {/* Batch Config Drawer (Collapsible) */}
        {showBatchApply && (
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-900 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-2 duration-150">
            <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
              Appliquer à tout le niveau :
            </span>

            <select
              value={batchLevel}
              onChange={e => setBatchLevel(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Toutes les classes</option>
              <option value="MATERNELLE">Maternelle</option>
              <option value="PRIMAIRE">Primaire</option>
              <option value="COLLEGE">Collège (6ème à 3ème)</option>
              <option value="LYCEE">Lycée (2nde à Tle)</option>
            </select>

            <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700">
              <span className="text-[11px] text-slate-500 font-bold">Total :</span>
              <input
                type="number"
                value={batchTotal}
                onChange={e => setBatchTotal(Number(e.target.value) || 0)}
                className="w-24 bg-transparent font-black text-xs text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[10px] text-slate-400 font-bold">{settings.currency}</span>
            </div>

            <select
              value={batchSplitMode}
              onChange={e => setBatchSplitMode(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="40_35_25">Répartition 40% (T1) / 35% (T2) / 25% (T3)</option>
              <option value="50_30_20">Répartition 50% (T1) / 30% (T2) / 20% (T3)</option>
              <option value="33_33_34">Répartition Équitable (1/3 par tranche)</option>
            </select>

            <button
              type="button"
              onClick={applyBatchToLevel}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
            >
              Appliquer aux classes
            </button>
          </div>
        )}

        {/* Classes Fees Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase text-[10px] text-slate-500 font-black border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Classe & Niveau</th>
                  <th className="p-3.5 text-center min-w-[150px]">Frais Total Scolarité</th>
                  <th className="p-3.5 text-center min-w-[150px]">1ère Tranche (Sept-Nov)</th>
                  <th className="p-3.5 text-center min-w-[150px]">2ème Tranche (Déc-Fév)</th>
                  <th className="p-3.5 text-center min-w-[150px]">3ème Tranche (Mars-Mai)</th>
                  <th className="p-3.5 text-center">Équilibre</th>
                  <th className="p-3.5 text-center">Auto-Ajuster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRows.map(row => {
                  const sumTranches = (Number(row.tranche1) || 0) + (Number(row.tranche2) || 0) + (Number(row.tranche3) || 0);
                  const isBalanced = sumTranches === (Number(row.tuitionFee) || 0);
                  const diff = sumTranches - (Number(row.tuitionFee) || 0);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Class Name */}
                      <td className="p-3.5">
                        <p className="font-black text-slate-900 dark:text-white text-xs">{row.name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {row.level}
                        </span>
                      </td>

                      {/* Total Tuition Fee Input */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500">
                          <input
                            type="number"
                            value={row.tuitionFee}
                            onChange={e => handleFieldChange(row.id, 'tuitionFee', Number(e.target.value) || 0)}
                            className="w-24 bg-transparent font-black text-sm text-emerald-800 dark:text-emerald-300 text-right outline-none"
                          />
                          <span className="text-[10px] font-bold text-emerald-600">{settings.currency}</span>
                        </div>
                      </td>

                      {/* Tranche 1 */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center space-x-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-amber-500">
                            <input
                              type="number"
                              value={row.tranche1}
                              onChange={e => handleFieldChange(row.id, 'tranche1', Number(e.target.value) || 0)}
                              className="w-20 bg-transparent font-black text-xs text-slate-900 dark:text-white text-right outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">{settings.currency}</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <input
                              type="text"
                              value={row.dueDate1}
                              onChange={e => handleFieldChange(row.id, 'dueDate1', e.target.value)}
                              className="w-24 bg-transparent border-b border-dashed border-slate-300 text-center outline-none text-[10px]"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tranche 2 */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center space-x-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-amber-500">
                            <input
                              type="number"
                              value={row.tranche2}
                              onChange={e => handleFieldChange(row.id, 'tranche2', Number(e.target.value) || 0)}
                              className="w-20 bg-transparent font-black text-xs text-slate-900 dark:text-white text-right outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">{settings.currency}</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <input
                              type="text"
                              value={row.dueDate2}
                              onChange={e => handleFieldChange(row.id, 'dueDate2', e.target.value)}
                              className="w-24 bg-transparent border-b border-dashed border-slate-300 text-center outline-none text-[10px]"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tranche 3 */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center space-x-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-amber-500">
                            <input
                              type="number"
                              value={row.tranche3}
                              onChange={e => handleFieldChange(row.id, 'tranche3', Number(e.target.value) || 0)}
                              className="w-20 bg-transparent font-black text-xs text-slate-900 dark:text-white text-right outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">{settings.currency}</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <input
                              type="text"
                              value={row.dueDate3}
                              onChange={e => handleFieldChange(row.id, 'dueDate3', e.target.value)}
                              className="w-24 bg-transparent border-b border-dashed border-slate-300 text-center outline-none text-[10px]"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Balance Status */}
                      <td className="p-3.5 text-center">
                        {isBalanced ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>OK (100%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]" title={`Somme tranches: ${sumTranches} F (${diff > 0 ? '+' : ''}${diff} F)`}>
                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                            <span>{diff > 0 ? `+${diff}` : diff} F</span>
                          </span>
                        )}
                      </td>

                      {/* Auto Balance Button */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => autoBalanceRow(row.id, '40_35_25')}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 dark:text-slate-400 font-extrabold text-[10px] flex items-center space-x-1 mx-auto transition-all cursor-pointer"
                          title="Calculer 40% T1, 35% T2, 25% T3 automatiquement"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>40/35/25</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Notice */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-400">
            <HelpCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Synchronisation automatique de la Comptabilité et de la Vie Scolaire :
              </p>
              <p className="mt-0.5 text-[11px]">
                Dès l'enregistrement, ces montants personnalisés de scolarité et de tranches seront instantanément appliqués aux reçus de caisse, aux relances IA des parents par SMS/WhatsApp, et aux tableaux de bord de trésorerie de chaque classe.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Save Action */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            <span>{feeRows.length} classes configurées • Budget global scolarité : </span>
            <strong className="text-slate-900 dark:text-white font-mono">{totalSchoolBudget.toLocaleString()} {settings.currency}</strong>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaved}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>Enregistré avec succès !</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Enregistrer les Frais & Tranches</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
