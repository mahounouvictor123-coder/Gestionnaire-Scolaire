import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/store';
import {
  Building,
  Upload,
  Save,
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface ExamHeaderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExamHeaderConfigModal: React.FC<ExamHeaderConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSettings } = useApp();

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

  const [ministryHeader, setMinistryHeader] = useState(
    settings.ministryHeader || "RÉPUBLIQUE DU BÉNIN\nMINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE"
  );
  const [regionalDirection, setRegionalDirection] = useState(
    settings.regionalDirection || "DIRECTION RÉGIONALE DE L'ENSEIGNEMENT SECONDAIRE"
  );
  const [examHeaderUrl, setExamHeaderUrl] = useState(
    settings.examHeaderUrl || settings.logoUrl || ''
  );

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExamHeaderUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings({
      ministryHeader,
      regionalDirection,
      examHeaderUrl
    });

    alert("En-Tête Officiel des Épreuves mis à jour pour l'établissement !");
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 backdrop-enter"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl modal-enter"
      >
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Configuration de l'En-Tête Officiel d'Épreuves</h2>
              <p className="text-xs text-blue-200">{settings.schoolName}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Official Ministry Header */}
          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 mb-1 block">
              En-Tête Ministère & République (A gauche) :
            </label>
            <textarea
              rows={3}
              value={ministryHeader}
              onChange={e => setMinistryHeader(e.target.value)}
              className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold leading-relaxed"
            />
          </div>

          {/* Regional Direction */}
          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 mb-1 block">
              Direction Régionale / Dren / Dp / Circo :
            </label>
            <input
              type="text"
              value={regionalDirection}
              onChange={e => setRegionalDirection(e.target.value)}
              className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          {/* Scanned Official Header Image or Logo */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
              Logo / Image d'En-tête de l'École (Au centre) :
            </label>

            <div className="flex items-center space-x-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {examHeaderUrl ? (
                <img
                  src={examHeaderUrl}
                  alt="En-tête"
                  className="h-16 w-16 object-contain rounded-xl border bg-white p-1"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  id="header-file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="header-file"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Scanner / Importer le Sceau Officiel</span>
                </label>
                <p className="text-[10px] text-slate-500">
                  Formats acceptés : PNG, JPG, WEBP, SVG.
                </p>
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
            <p className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Aperçu en direct sur les épreuves A4 :</p>
            <div className="p-3 border-b-2 border-slate-900 grid grid-cols-12 gap-2 text-center text-[10px] font-bold text-slate-900 dark:text-slate-100">
              <div className="col-span-5 whitespace-pre-line leading-tight">
                {ministryHeader}
                <br/>
                <span className="text-[9px] text-slate-600">{regionalDirection}</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                {examHeaderUrl && <img src={examHeaderUrl} className="h-10 w-10 object-contain" />}
              </div>
              <div className="col-span-5 leading-tight uppercase">
                <span className="text-blue-900 font-extrabold">{settings.schoolName}</span>
                <br/>
                <span className="italic lowercase text-slate-500 font-normal">{settings.motto}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer l'En-Tête</span>
          </button>
        </div>

      </div>
    </div>
  );
};
