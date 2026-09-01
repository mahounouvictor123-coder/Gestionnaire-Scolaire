import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/store';
import {
  Sparkles,
  Send,
  Loader2,
  Lock,
  Unlock,
  ShieldCheck,
  Zap,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Crown,
  Radio,
  Clock,
  ArrowRight,
  Terminal,
  History,
  Trash2
} from 'lucide-react';

interface AIMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  executiveSummary?: string;
  actionsExecuted?: Array<{
    actionType: string;
    schoolIds: string[];
    params?: any;
  }>;
  affectedSchools?: Array<{
    id: string;
    name: string;
    city: string;
    actionApplied: string;
    detail: string;
  }>;
  suggestedNext?: string[];
}

export const PromoterAICopilot: React.FC = () => {
  const {
    schools,
    executePromoterRemoteCommands,
    settings
  } = useApp();

  const [inputInstruction, setInputInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting message
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    const saved = localStorage.getItem('PROMOTER_AI_COPILOT_HISTORY');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: `Salutations Monsieur le Promoteur Général. Je suis votre **Commandant IA Suprême SaaS**.\n\nDonnez-moi n'importe quel ordre d'administration à distance pour piloter votre réseau de **${schools.length} établissements scolaires**. Dès validation, vos consignes sont exécutées et synchronisées en temps réel sur tous les appareils distants.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        executiveSummary: `Système prêt • ${schools.length} écoles sous gestion Cloud`,
        suggestedNext: [
          "Bloque toutes les écoles qui n'ont pas encore fait d'abonnement",
          "Débloque toutes les écoles du réseau",
          "Accorde 30 jours de pass VIP à toutes les écoles",
          "Active la protection par mot de passe partout"
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('PROMOTER_AI_COPILOT_HISTORY', JSON.stringify(messages));
    } catch (e) {
      // Ignore
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Command presets for 1-click execution
  const quickPresets = [
    {
      label: "🔒 Bloquer les écoles sans abonnement",
      prompt: "Bloque toutes les écoles qui n'ont pas encore fait d'abonnement actif ou dont la période d'essai a expiré.",
      color: "from-rose-600 to-red-700 text-white"
    },
    {
      label: "🟢 Débloquer toutes les écoles",
      prompt: "Débloque immédiatement toutes les écoles du réseau et valide leur accès.",
      color: "from-emerald-600 to-teal-700 text-white"
    },
    {
      label: "⏱️ Bloquer les essais expirés",
      prompt: "Vérifie les dates de validité et bloque toutes les écoles dont l'essai gratuit de 7 jours est dépassé.",
      color: "from-amber-600 to-orange-700 text-white"
    },
    {
      label: "🎁 Accorder 30j VIP partout",
      prompt: "Accorde 30 jours d'abonnement VIP gratuit à toutes les écoles du réseau.",
      color: "from-purple-600 to-indigo-700 text-white"
    },
    {
      label: "🔐 Verrouiller par mot de passe",
      prompt: "Active la protection stricte par mot de passe sur toutes les écoles du réseau.",
      color: "from-slate-700 to-slate-900 text-white"
    },
    {
      label: "📊 Audit financier & statut réseau",
      prompt: "Fais-moi un audit complet de toutes les écoles : statut de blocage, dates d'expiration et nombre d'élèves gérés.",
      color: "from-blue-600 to-cyan-700 text-white"
    }
  ];

  const handleSendCommand = async (instructionToRun?: string) => {
    const rawInstruction = instructionToRun || inputInstruction;
    const cleanPrompt = rawInstruction.trim();

    if (!cleanPrompt || isLoading) return;

    setInputInstruction('');
    setErrorMessage('');
    setSuccessNotice('');

    const userMsg: AIMessage = {
      id: `msg-usr-${Date.now()}`,
      sender: 'user',
      text: cleanPrompt,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/promoter-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoterInstruction: cleanPrompt,
          schools: schools,
          currentSettings: settings,
          history: messages.slice(-6)
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || `Erreur serveur (${response.status})`);
      }

      const data = await response.json();

      // Execute actions automatically across all remote schools
      let executionResult = { success: true, modifiedCount: 0, summary: "" };
      if (Array.isArray(data.actionsToExecute) && data.actionsToExecute.length > 0) {
        executionResult = executePromoterRemoteCommands(data.actionsToExecute);
      }

      const aiMsg: AIMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.aiMessage || "Ordre exécuté fidèlement.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        executiveSummary: data.executiveSummary || executionResult.summary,
        actionsExecuted: data.actionsToExecute || [],
        affectedSchools: data.affectedSchoolsSummary || [],
        suggestedNext: data.suggestedNextCommands || []
      };

      setMessages(prev => [...prev, aiMsg]);
      setSuccessNotice(`⚡ ${executionResult.modifiedCount} école(s) mise(s) à jour et synchronisée(s) en direct.`);
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      console.error("Erreur exécution ordre IA promoteur:", err);
      setErrorMessage(`Erreur : ${err.message || "Impossible de joindre le serveur IA"}`);
      const errorMsg: AIMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'system',
        text: `⚠️ Erreur lors de l'exécution de l'ordre : ${err.message}. Veuillez réessayer ou formuler la consigne autrement.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Effacer l'historique des conversations avec le Commandant IA ?")) {
      localStorage.removeItem('PROMOTER_AI_COPILOT_HISTORY');
      setMessages([
        {
          id: 'msg-welcome-reset',
          sender: 'ai',
          text: `Historique réinitialisé. À vos ordres Monsieur le Promoteur Général. Quelle consigne souhaitez-vous exécuter sur le réseau ?`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          executiveSummary: `${schools.length} écoles prêtes pour synchronisation Cloud`,
          suggestedNext: [
            "Bloque toutes les écoles qui n'ont pas encore fait d'abonnement",
            "Débloque toutes les écoles du réseau",
            "Accorde 30 jours de pass VIP à toutes les écoles"
          ]
        }
      ]);
    }
  };

  // Metrics for quick header display
  const blockedSchools = schools.filter(s => s.isBlocked === true || s.isValidatedByPromoter === false);
  const activeSchools = schools.filter(s => s.isBlocked !== true && s.isValidatedByPromoter !== false);

  return (
    <div className="space-y-6">
      {/* Top Commander HUD Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-500/40 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                  <Crown className="h-3 w-3 fill-amber-300" />
                  <span>Commandant IA Maître • Contrôle à Distance</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                  <span>Cloud Sync Actif</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Pilotage Centralisé des Écoles par IA
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mt-0.5">
                Donnez vos consignes fermes en langage naturel. L'IA interprète les critères, cible les établissements et applique automatiquement les blocages ou validations à distance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-center px-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Actives</p>
                <p className="text-lg font-black text-emerald-400">{activeSchools.length}</p>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-center px-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bloquées</p>
                <p className="text-lg font-black text-rose-400">{blockedSchools.length}</p>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-center px-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                <p className="text-lg font-black text-amber-300">{schools.length}</p>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              title="Effacer l'historique"
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Order Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center space-x-1.5">
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            <span>Ordres Fréquents du Promoteur (1-Clic) :</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendCommand(preset.prompt)}
                className={`py-2 px-3.5 rounded-xl bg-gradient-to-r ${preset.color} hover:opacity-90 active:scale-95 text-xs font-black shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Terminal & Conversation History Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[560px]">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="ml-2 font-mono text-xs font-bold text-slate-300 flex items-center space-x-1">
              <Terminal className="h-3.5 w-3.5 text-amber-400" />
              <span>terminal-ia-promoteur@saas-master:~$</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {messages.length} messages • Gemini 3.7 Flash Engine
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div className="flex items-center space-x-2 px-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {isUser ? 'Vous (Promoteur Général)' : '🤖 Commandant IA Suprême'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-2xl p-4 sm:p-5 rounded-3xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-tr-none shadow-md'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Executive Summary Card */}
                  {!isUser && msg.executiveSummary && (
                    <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>{msg.executiveSummary}</span>
                    </div>
                  )}

                  {/* Affected Schools Breakdown */}
                  {!isUser && Array.isArray(msg.affectedSchools) && msg.affectedSchools.length > 0 && (
                    <div className="mt-3.5 space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <p className="font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                        <Building2 className="h-3.5 w-3.5 text-amber-500" />
                        <span>Établissements Impactés à Distance ({msg.affectedSchools.length}) :</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.affectedSchools.map((item, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start space-x-2 text-[11px]"
                          >
                            <span className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                              item.actionApplied === 'BLOCKED'
                                ? 'bg-rose-500/20 text-rose-500'
                                : 'bg-emerald-500/20 text-emerald-500'
                            }`}>
                              {item.actionApplied === 'BLOCKED' ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </span>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {item.detail} • <span className="font-semibold">{item.city}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Step Recommendations */}
                  {!isUser && Array.isArray(msg.suggestedNext) && msg.suggestedNext.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>Suggestions de commandes suivantes :</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedNext.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSendCommand(suggestion)}
                            className="py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <span>{suggestion}</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md shadow-lg animate-pulse">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Analyse de la consigne et exécution à distance...
                </p>
                <p className="text-[10px] text-slate-400">
                  Application des modifications sur le Cloud et verrouillage/déverrouillage en direct.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCommand();
          }}
          className="p-3 sm:p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputInstruction}
              onChange={(e) => setInputInstruction(e.target.value)}
              placeholder="Ex : Bloque toutes les écoles sans abonnement / Débloque Complexe Scolaire Saint Jean..."
              disabled={isLoading}
              className="w-full py-3.5 pl-4 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!inputInstruction.trim() || isLoading}
            className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Exécuter</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
