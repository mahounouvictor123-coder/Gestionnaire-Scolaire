import React from 'react';
import { Sparkles, Brain, Bot, FileCheck2, Building } from 'lucide-react';

interface AIStudioViewProps {
  onOpenAiModal: () => void;
}

export const AIStudioView: React.FC<AIStudioViewProps> = ({ onOpenAiModal }) => {
  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
            Moteur d'Intelligence Artificielle Gemini
          </span>
        </div>
        <h2 className="text-2xl font-black">Module IA Pro - GESTIONNAIRE SCOLAIRE</h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
          Générez des appréciations pédagogiques pour les bulletins, offrez un assistant conversationnel aux parents, détectez proactivement les élèves en difficulté et soutenez les décisions stratégiques du directeur.
        </p>

        <button
          onClick={onOpenAiModal}
          className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm shadow-lg transition-transform hover:scale-105 flex items-center space-x-2"
        >
          <Sparkles className="h-5 w-5 text-slate-900" />
          <span>Ouvrir l'Assistant IA Complet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <FileCheck2 className="h-6 w-6 text-blue-600" />
          <h4 className="font-extrabold text-slate-900 dark:text-white">Appréciations Bulletins</h4>
          <p className="text-slate-500">Rédaction automatique de commentaires constructifs et personnalisés pour chaque élève.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <Bot className="h-6 w-6 text-emerald-600" />
          <h4 className="font-extrabold text-slate-900 dark:text-white">Assistant Parents ScolaAI</h4>
          <p className="text-slate-500">Réponse H24 aux questions d'examens, frais et organisation scolaire.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h4 className="font-extrabold text-slate-900 dark:text-white">Détection des Risques</h4>
          <p className="text-slate-500">Analyse prédictive des baisses de notes et plans de remédiation individualisés.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <Building className="h-6 w-6 text-amber-600" />
          <h4 className="font-extrabold text-slate-900 dark:text-white">Aide à la Décision Directeur</h4>
          <p className="text-slate-500">Synthèses financières, taux de recouvrement et orientations pédagogiques.</p>
        </div>
      </div>
    </div>
  );
};
