import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../lib/store';
import { compressExamImage } from '../../lib/imageCompression';
import { presetLogos } from '../../data/initialSchools';
import {
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Save,
  X,
  FileText,
  Award,
  Sparkles,
  Trash2,
  Building,
  GraduationCap
} from 'lucide-react';

interface SchoolLogoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: 'GENERAL' | 'BULLETIN' | 'EPREUVE';
}

export const SchoolLogoImportModal: React.FC<SchoolLogoImportModalProps> = ({
  isOpen,
  onClose,
  initialContext = 'GENERAL'
}) => {
  const { settings, currentSchool, updateSettings, updateSchool } = useApp();

  const [previewLogo, setPreviewLogo] = useState<string>(
    settings.logoUrl || currentSchool?.logoUrl || settings.examHeaderUrl || ''
  );
  const [logoSizeText, setLogoSizeText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setPreviewLogo(settings.logoUrl || currentSchool?.logoUrl || settings.examHeaderUrl || '');
      setSaveSuccess(false);
    }
  }, [isOpen, settings.logoUrl, settings.examHeaderUrl, currentSchool?.logoUrl]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Compress and optimize HD image (scales down large photos to ~50-90KB)
      const { dataUrl, sizeKb } = await compressExamImage(file, 1200, 0.85);
      setPreviewLogo(dataUrl);
      setLogoSizeText(`${sizeKb} Ko (Format optimisé HD)`);
    } catch (err) {
      // Fallback
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const raw = loadEvt.target?.result as string;
        setPreviewLogo(raw);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveLogo = () => {
    const cleanLogo = previewLogo.trim();

    // 1. Update Settings (for bulletins, exam header, certificates, cards)
    updateSettings({
      logoUrl: cleanLogo,
      examHeaderUrl: cleanLogo
    });

    // 2. Update School Registry
    if (currentSchool?.id) {
      updateSchool(currentSchool.id, {
        logoUrl: cleanLogo
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    setPreviewLogo('/icon.svg');
    setLogoSizeText('');
  };

  const schoolName = (settings.schoolName && settings.schoolName !== 'GESTIONNAIRE SCOLAIRE') 
    ? settings.schoolName 
    : (currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE');

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-md">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center space-x-2">
                <span>Importer le Logo Officiel de l'Établissement</span>
              </h2>
              <p className="text-xs text-blue-200">
                {schoolName} • Appliqué automatiquement sur tous les bulletins et épreuves Word
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Automatic Propagation Notice */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-xs">Synchronisation Automatique & Universelle</p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Le logo importé ici sera immédiatement et automatiquement affiché sur :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-bold">
                <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300">
                  <span>✓</span>
                  <span>Tous les Bulletins Scolaires Trimestriels</span>
                </div>
                <div className="flex items-center space-x-1.5 text-indigo-800 dark:text-indigo-300">
                  <span>✓</span>
                  <span>Toutes les Épreuves Word (.doc) & Imprimées</span>
                </div>
                <div className="flex items-center space-x-1.5 text-blue-800 dark:text-blue-300">
                  <span>✓</span>
                  <span>Les Reçus de Scolarité & Certificats</span>
                </div>
                <div className="flex items-center space-x-1.5 text-teal-800 dark:text-teal-300">
                  <span>✓</span>
                  <span>Les Cartes d'Identité Scolaires des Élèves</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload & Picker */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
              
              {/* Logo Preview Circle / Square */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner p-2">
                  {previewLogo ? (
                    <img 
                      src={previewLogo} 
                      alt="Logo École" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-bold block">Aucun logo</span>
                    </div>
                  )}
                </div>

                {previewLogo && previewLogo !== '/icon.svg' && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-all cursor-pointer"
                    title="Supprimer ce logo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Upload Actions */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Sélectionner l'image de votre Logo
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Formats supportés : PNG transparent (recommandé), JPG, WEBP, SVG.
                  </p>
                  {logoSizeText && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      ✓ {logoSizeText}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isProcessing ? 'Traitement en cours...' : 'Parcourir les fichiers (PC / Mobile)'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Ou coller l'adresse URL d'une image en ligne :
                  </label>
                  <input
                    type="text"
                    value={previewLogo}
                    onChange={(e) => setPreviewLogo(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>

                {/* Preset School Logos */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    Ou sélectionner un écusson / emblème académique prédéfini :
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {presetLogos.map((preset) => {
                      const isSelected = previewLogo === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setPreviewLogo(preset.url);
                            setLogoSizeText('Modèle académique officiel');
                          }}
                          className={`p-1.5 rounded-xl border flex items-center space-x-1.5 transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-7 h-7 object-contain rounded-lg p-0.5 bg-white shrink-0"
                          />
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Side-by-side Dual Live Preview: Bulletins vs Épreuves Word */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Aperçu en direct du Logo sur les documents finaux :</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Preview 1: Sur les Bulletins de Notes */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm">
                <div className="flex items-center justify-between border-b pb-1.5 text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">
                  <span className="flex items-center space-x-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>En-Tête du Bulletin Scolaire</span>
                  </span>
                  <span className="text-emerald-600 font-bold">✓ Prêt</span>
                </div>

                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Logo Bulletin" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[8px] text-slate-400">Sans Logo</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-blue-900 dark:text-blue-200 text-xs truncate uppercase">
                      {schoolName}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 italic truncate">
                      {settings.motto || currentSchool?.motto || 'Discipline • Travail • Succès'}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      BULLETIN OFFICIEL DU TRIMESTRE • CLASSEMENT
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview 2: Sur les Épreuves Word (.doc) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm">
                <div className="flex items-center justify-between border-b pb-1.5 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
                  <span className="flex items-center space-x-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>En-Tête de l'Épreuve Word IA (.doc)</span>
                  </span>
                  <span className="text-emerald-600 font-bold">✓ Prêt</span>
                </div>

                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Logo Épreuve" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[8px] text-slate-400">Sans Logo</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 dark:text-white text-xs truncate uppercase">
                      {schoolName}
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-bold truncate">
                      DEVOIR SURVEILLÉ / COMPOSITION NATIONALE
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Année Scolaire : {settings.academicYear || '2025-2026'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSaveLogo}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span>Logo Appliqué Partout avec Succès !</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Enregistrer & Appliquer le Logo Partout</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
