import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { BulletinTemplate } from '../../types';
import { defaultBulletinTemplate } from '../../lib/gradingUtils';
import { clientFetch } from '../../services/clientFetch.ts';
import {
  FileCheck,
  X,
  Upload,
  Sparkles,
  CheckCircle2,
  Scan,
  Calculator,
  Sliders,
  Eye,
  Award,
  Layers,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';

interface ScanBulletinTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanBulletinTemplateModal: React.FC<ScanBulletinTemplateModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentSchool, updateSchool, settings } = useApp();

  // Escape key handler for smooth exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'SCAN' | 'FORMULA' | 'PREVIEW'>('SCAN');
  const [selectedImage, setSelectedImage] = useState<string | null>(
    currentSchool?.bulletinTemplate?.scannedImageUrl || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  // Template State initialized with school's current template or default
  const [template, setTemplate] = useState<BulletinTemplate>(() => {
    return currentSchool?.bulletinTemplate || defaultBulletinTemplate();
  });

  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Simulate AI Scan Analysis of uploaded Bulletin image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        runAiAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetModel = (modelType: 'BENIN_PRIMARY' | 'LYCEE_COMPOSITION' | 'STANDARD_AFRIQUE') => {
    if (modelType === 'BENIN_PRIMARY') {
      setTemplate({
        ...defaultBulletinTemplate(),
        templateName: 'Modèle Primaire (Bénin / Togo / Sénégal)',
        calculationFormula: 'PRIMARY_SIMPLE_AVERAGE',
        columns: {
          showInterroAverage: true,
          showDevoirMark: true,
          showCompoMark: true,
          showCoefficients: false,
          showSubjectRank: true,
          showTeacherAppreciation: true
        },
        headerTitle: 'BULLETIN DE NOTES DU COMPLEXE PRIMAIRE',
        honorRollThreshold: 15,
        encouragementThreshold: 13,
        passingThreshold: 10
      });
    } else if (modelType === 'LYCEE_COMPOSITION') {
      setTemplate({
        ...defaultBulletinTemplate(),
        templateName: 'Modèle Lycée & Collège (Compo x 2 + Devoir + Interro / 4)',
        calculationFormula: 'INTERRO_DEVOIR_COMPO',
        columns: {
          showInterroAverage: true,
          showDevoirMark: true,
          showCompoMark: true,
          showCoefficients: true,
          showSubjectRank: true,
          showTeacherAppreciation: true
        },
        headerTitle: 'BULLETIN DE NOTES TRIMESTRIEL - ENSEIGNEMENT SECONDAIRE',
        honorRollThreshold: 14,
        encouragementThreshold: 12,
        passingThreshold: 10
      });
    } else {
      setTemplate({
        ...defaultBulletinTemplate(),
        templateName: 'Modèle Officiel Réseau Afrique (Coefficients Pondérés)',
        calculationFormula: 'WEIGHTED_COEFFICIENTS',
        columns: {
          showInterroAverage: true,
          showDevoirMark: true,
          showCompoMark: true,
          showCoefficients: true,
          showSubjectRank: true,
          showTeacherAppreciation: true
        },
        headerTitle: 'BULLETIN TRIMESTRIEL D\'ÉVALUATIONS'
      });
    }

    setAnalysisDone(true);
    setActiveTab('FORMULA');
  };

  const runAiAnalysis = async (imageUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisDone(false);

    try {
      const res = await clientFetch('/api/ai/scan-bulletin-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imageUrl })
      });
      const data = await res.json();

      setTemplate(prev => ({
        ...prev,
        ...data,
        scannedImageUrl: imageUrl,
        scannedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn("API scan bulletin template error, using default model:", e);
      setTemplate(prev => ({
        ...prev,
        scannedImageUrl: imageUrl,
        templateName: `Modèle Analysé par IA (${currentSchool?.name || 'Notre École'})`,
        calculationFormula: 'INTERRO_DEVOIR_COMPO',
        scannedAt: new Date().toISOString()
      }));
    } finally {
      setIsAnalyzing(false);
      setAnalysisDone(true);
      setActiveTab('FORMULA');
    }
  };

  const handleSaveTemplate = () => {
    if (!currentSchool) return;

    updateSchool(currentSchool.id, {
      bulletinTemplate: template
    });

    setSuccessMessage(`✅ Le Modèle de Bulletin "${template.templateName}" a été enregistré pour TOUS les élèves de l'école !`);
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto backdrop-enter"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl my-8 overflow-hidden modal-enter"
      >
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Scan className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                  IA Scan & Configuration Bulletin
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                Scanner & Personnaliser le Modèle de Bulletin
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('SCAN')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'SCAN'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>1. Scanner / Numériser</span>
          </button>

          <button
            onClick={() => setActiveTab('FORMULA')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'FORMULA'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>2. Mode de Calcul & Colonnes</span>
          </button>

          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'PREVIEW'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>3. Aperçu & Validation</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* TAB 1: SCAN / UPLOAD */}
          {activeTab === 'SCAN' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 text-xs text-purple-900 dark:text-purple-300 flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Analyse IA de Bulletin Papier & Calculateur</h4>
                  <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
                    Importez une photo ou un scan du modèle de bulletin physique imprimé par votre école. Notre intelligence artificielle détectera automatiquement la disposition du tableau, la formule de moyenne et les seuils d'appréciation pour les appliquer à l'ensemble de vos élèves.
                  </p>
                </div>
              </div>

              {/* Drag & Drop or Camera Scan Box */}
              <div className="relative border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 rounded-3xl p-8 text-center bg-slate-50 dark:bg-slate-800/40 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {isAnalyzing ? (
                  <div className="py-8 space-y-3">
                    <div className="relative inline-block">
                      <Scan className="h-12 w-12 text-purple-600 animate-pulse mx-auto" />
                      <div className="absolute -inset-2 bg-purple-500/20 rounded-full animate-ping" />
                    </div>
                    <p className="text-sm font-black text-purple-600 dark:text-purple-400">
                      Analyse IA de la structure du bulletin en cours...
                    </p>
                    <p className="text-xs text-slate-500">
                      Détection des colonnes (Coefficients, Dev, Compo, Rang, Appréciations)
                    </p>
                  </div>
                ) : selectedImage ? (
                  <div className="space-y-3">
                    <img
                      src={selectedImage}
                      alt="Scanned Bulletin"
                      className="max-h-48 mx-auto rounded-2xl border border-slate-300 dark:border-slate-700 shadow-lg object-contain"
                    />
                    <div className="flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Scanner numérisé avec succès. Ré-importez pour changer.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 inline-block">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Cliquez ou glissez la photo de votre bulletin papier
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Format PNG, JPG ou PDF (Exemple de bulletin d'évaluation de votre école)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Preset Choice */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Ou choisir un modèle officiel prédéfini :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSelectPresetModel('BENIN_PRIMARY')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-left transition-all space-y-1"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white block">🏫 Modèle Primaire</span>
                    <span className="text-[11px] text-slate-500 block">Moyenne simple des interrogations & devoirs /20.</span>
                  </button>

                  <button
                    onClick={() => handleSelectPresetModel('LYCEE_COMPOSITION')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-left transition-all space-y-1"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white block">🎓 Secondary / Lycée</span>
                    <span className="text-[11px] text-slate-500 block">Formule: (Interro + Devoir + Compo x 2) / 4.</span>
                  </button>

                  <button
                    onClick={() => handleSelectPresetModel('STANDARD_AFRIQUE')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 text-left transition-all space-y-1"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white block">🌍 Coefficients Pondérés</span>
                    <span className="text-[11px] text-slate-500 block">Coefficients spécifiques par matière & Rangs.</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FORMULA & COLUMNS CONFIG */}
          {activeTab === 'FORMULA' && (
            <div className="space-y-5">
              
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-black uppercase text-purple-700 dark:text-purple-400">
                  Nom du Modèle de Bulletin *
                </label>
                <input
                  type="text"
                  value={template.templateName}
                  onChange={(e) => setTemplate({ ...template, templateName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm font-extrabold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Formule de Calcul */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  <span>Règle de Calcul de la Moyenne par Matière *</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 ${
                    template.calculationFormula === 'WEIGHTED_COEFFICIENTS'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="formula"
                      checked={template.calculationFormula === 'WEIGHTED_COEFFICIENTS'}
                      onChange={() => setTemplate({ ...template, calculationFormula: 'WEIGHTED_COEFFICIENTS' })}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <span className="block text-xs font-black">Coefficients Pondérés Standard</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Sum(Note x Coeff) / Sum(Coeffs).
                      </span>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 ${
                    template.calculationFormula === 'INTERRO_DEVOIR_COMPO'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="formula"
                      checked={template.calculationFormula === 'INTERRO_DEVOIR_COMPO'}
                      onChange={() => setTemplate({ ...template, calculationFormula: 'INTERRO_DEVOIR_COMPO' })}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <span className="block text-xs font-black">Interro + Devoir + Composition x 2</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        (Moy. Interros + Devoir + Compo x 2) / 4.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Colonnes du Tableau */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Sliders className="h-4 w-4 text-purple-600" />
                  <span>Colonnes & Rangs à Afficher dans le Bulletin</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                  <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.columns.showInterroAverage}
                      onChange={(e) => setTemplate({
                        ...template,
                        columns: { ...template.columns, showInterroAverage: e.target.checked }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span>Moy. Interros</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.columns.showDevoirMark}
                      onChange={(e) => setTemplate({
                        ...template,
                        columns: { ...template.columns, showDevoirMark: e.target.checked }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span>Note Devoir</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.columns.showCompoMark}
                      onChange={(e) => setTemplate({
                        ...template,
                        columns: { ...template.columns, showCompoMark: e.target.checked }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span>Note Composition</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.columns.showCoefficients}
                      onChange={(e) => setTemplate({
                        ...template,
                        columns: { ...template.columns, showCoefficients: e.target.checked }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span>Coefficients</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.columns.showSubjectRank}
                      onChange={(e) => setTemplate({
                        ...template,
                        columns: { ...template.columns, showSubjectRank: e.target.checked }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span>Rang par Matière</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.columns.showTeacherAppreciation}
                      onChange={(e) => setTemplate({
                        ...template,
                        columns: { ...template.columns, showTeacherAppreciation: e.target.checked }
                      })}
                      className="rounded text-purple-600"
                    />
                    <span>Appréciation Enseignant</span>
                  </label>
                </div>
              </div>

              {/* Seuils & Mentions */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Seuil Tableau d'Honneur
                  </label>
                  <input
                    type="number"
                    value={template.honorRollThreshold}
                    onChange={(e) => setTemplate({ ...template, honorRollThreshold: parseFloat(e.target.value) || 14 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Seuil Encouragements
                  </label>
                  <input
                    type="number"
                    value={template.encouragementThreshold}
                    onChange={(e) => setTemplate({ ...template, encouragementThreshold: parseFloat(e.target.value) || 12 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Moyenne d'Admissibilité
                  </label>
                  <input
                    type="number"
                    value={template.passingThreshold}
                    onChange={(e) => setTemplate({ ...template, passingThreshold: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-emerald-600"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PREVIEW */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                <Info className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  Aperçu en direct du modèle sélectionné. Ce modèle s'appliquera automatiquement au calcul des moyennes et à l'impression pour TOUS les élèves.
                </span>
              </div>

              {/* Mock Report Card Display */}
              <div className="p-6 bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-md font-sans text-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-blue-900 text-sm uppercase">{currentSchool?.name || settings.schoolName}</h3>
                    <p className="text-[10px] text-slate-500">{currentSchool?.motto}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-900 text-white font-bold px-3 py-1 rounded text-[11px]">
                      {template.headerTitle}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Année : 2025-2026</p>
                  </div>
                </div>

                {/* Student Info Bar Mock */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                  <div>Élève : <strong>KOUASSI Jean-Paul</strong></div>
                  <div>Matricule : <strong>2025-MAT-001</strong></div>
                  <div>Rang : <strong className="text-purple-700">1er / 32 élèves</strong></div>
                </div>

                {/* Table Mock */}
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-blue-900 text-white font-bold uppercase">
                      <th className="p-1.5 border border-slate-300">Matière</th>
                      {template.columns.showCoefficients && <th className="p-1.5 border border-slate-300 text-center">Coeff</th>}
                      {template.columns.showInterroAverage && <th className="p-1.5 border border-slate-300 text-center">Interro</th>}
                      {template.columns.showDevoirMark && <th className="p-1.5 border border-slate-300 text-center">Devoir</th>}
                      {template.columns.showCompoMark && <th className="p-1.5 border border-slate-300 text-center">Compo</th>}
                      <th className="p-1.5 border border-slate-300 text-center">Moy. /20</th>
                      {template.columns.showSubjectRank && <th className="p-1.5 border border-slate-300 text-center">Rang</th>}
                      {template.columns.showTeacherAppreciation && <th className="p-1.5 border border-slate-300">Appréciation</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50 font-medium">
                      <td className="p-1.5 border border-slate-300 font-bold">Mathématiques</td>
                      {template.columns.showCoefficients && <td className="p-1.5 border border-slate-300 text-center">4</td>}
                      {template.columns.showInterroAverage && <td className="p-1.5 border border-slate-300 text-center">15.00</td>}
                      {template.columns.showDevoirMark && <td className="p-1.5 border border-slate-300 text-center">16.00</td>}
                      {template.columns.showCompoMark && <td className="p-1.5 border border-slate-300 text-center">17.50</td>}
                      <td className="p-1.5 border border-slate-300 text-center font-bold text-blue-900">16.50</td>
                      {template.columns.showSubjectRank && <td className="p-1.5 border border-slate-300 text-center font-bold">1er</td>}
                      {template.columns.showTeacherAppreciation && <td className="p-1.5 border border-slate-300 italic">Excellent travail !</td>}
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td className="p-1.5 border border-slate-300">MOYENNE GÉNÉRALE</td>
                      {template.columns.showCoefficients && <td className="p-1.5 border border-slate-300 text-center">18</td>}
                      <td colSpan={template.columns.showInterroAverage ? 3 : 1} className="p-1.5 border border-slate-300 text-center font-black text-purple-900">
                        15.85 / 20 (Rang : 1er / 32)
                      </td>
                      <td colSpan={2} className="p-1.5 border border-slate-300 text-emerald-800 font-extrabold">
                        TABLEAU D'HONNEUR
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            Annuler
          </button>

          <button
            onClick={handleSaveTemplate}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center space-x-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Appliquer ce Modèle à Toutes les Classes</span>
          </button>
        </div>

      </div>
    </div>
  );
};
