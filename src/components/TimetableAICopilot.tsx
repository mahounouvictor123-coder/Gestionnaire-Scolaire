import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/store';
import { TimetableSlot } from '../types';
import { clientFetch } from '../services/clientFetch.ts';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  Maximize2,
  Minimize2,
  Trash2
} from 'lucide-react';

interface TimetableAICopilotProps {
  selectedClassId: string;
  onSlotModified?: (message: string) => void;
  isCompact?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  changesApplied?: string[];
  slotsCount?: number;
}

export const TimetableAICopilot: React.FC<TimetableAICopilotProps> = ({
  selectedClassId,
  onSlotModified,
  isCompact = false
}) => {
  const { classes, subjects, teachers, timetable, replaceClassTimetable } = useApp();
  
  const currentClassObj = classes.find(c => c.id === selectedClassId) || classes[0];
  const currentClassSlots = timetable.filter(t => t.classId === selectedClassId);

  const [inputInstruction, setInputInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Bonjour ! Je suis votre Copilote IA Spécialiste de la Planification Scolaire pour la classe « ${currentClassObj?.name || 'Sélectionnée'} ». Donnez-moi vos consignes fermes et précises (ajout de cours, permutation, libération de créneaux, équilibrage complet) et je les exécuterai fidèlement.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      changesApplied: [
        `Grille actuelle : ${currentClassSlots.length} cours enregistrés`,
        "Prêt à recevoir vos consignes pédagogiques"
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Quick firm command templates
  const quickFirmCommands = [
    {
      label: "⚡ Générer emploi du temps équilibré",
      prompt: `Génère un emploi du temps hebdomadaire complet, réaliste et équilibré de 28h par semaine pour la classe de ${currentClassObj?.name || 'cette classe'}, en répartissant judicieusement les matières principales (Maths, Français, SVT, Physique-Chimie, Histoire-Géo, Anglais, EPS...) du Lundi au Samedi matin, avec des pauses appropriées.`
    },
    {
      label: "🧹 Libérer mercredi après-midi & samedi",
      prompt: `Libère et supprime tous les cours programmés le Mercredi après-midi (à partir de 13h30) ainsi que le Samedi après-midi pour cette classe.`
    },
    {
      label: "📐 4h Maths (Lun 8h-10h & Jeu 10h15-12h15)",
      prompt: `Place obligatoirement le cours de Mathématiques le Lundi de 08h00 à 10h00 et le Jeudi de 10h15 à 12h15 avec le professeur principal de Mathématiques en salle de classe habituelle.`
    },
    {
      label: "🏃 Placer EPS le samedi matin",
      prompt: `Programme la séance d'Éducation Physique et Sportive (EPS) le Samedi matin de 08h00 à 10h00 au Terrain de Sport.`
    },
    {
      label: "🔄 Permuter matinée Mardi & Jeudi",
      prompt: `Échange et permute intégralement les cours programmés le Mardi matin avec les cours du Jeudi matin.`
    },
    {
      label: "🗑️ Réinitialiser / Vider la grille",
      prompt: `Efface tous les cours actuels de cette classe pour me laisser une grille entièrement vierge.`
    }
  ];

  // Send firm instruction to AI Backend
  const handleExecuteFirmInstruction = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputInstruction;
    if (!promptToSend.trim()) return;

    if (!selectedClassId) {
      setErrorMessage("Veuillez sélectionner une classe active.");
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputInstruction('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Build previous chat history
      const chatHistoryPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await clientFetch('/api/ai/modify-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSlots: currentClassSlots,
          targetClassName: currentClassObj?.name || 'Classe',
          userInstruction: promptToSend,
          chatHistory: chatHistoryPayload,
          availableSubjects: subjects.map(s => ({ id: s.id, name: s.name, code: s.code })),
          availableTeachers: teachers.map(t => ({ id: t.id, lastName: t.lastName, firstName: t.firstName, specialty: t.specialty }))
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const updatedSlots: TimetableSlot[] = Array.isArray(data.updatedSlots) ? data.updatedSlots : [];

      // Format and replace in store
      const formattedForStore: (Omit<TimetableSlot, 'id' | 'classId'> & { id?: string; classId?: string })[] = updatedSlots.map((s, idx) => {
        // Find subject match
        let sbjId = s.subjectId;
        if (!sbjId && s.customSubject) {
          const foundSbj = subjects.find(sub => 
            sub.name.toLowerCase().trim() === s.customSubject?.toLowerCase().trim() ||
            sub.code.toLowerCase().trim() === s.customSubject?.toLowerCase().trim()
          );
          if (foundSbj) sbjId = foundSbj.id;
        }

        // Find teacher match
        let tchId = s.teacherId;
        if (!tchId && s.customTeacher) {
          const foundTch = teachers.find(t => 
            `${t.lastName} ${t.firstName}`.toLowerCase().includes(s.customTeacher!.toLowerCase().trim()) ||
            s.customTeacher!.toLowerCase().includes(t.lastName.toLowerCase().trim())
          );
          if (foundTch) tchId = foundTch.id;
        }

        return {
          id: s.id || `tbl-${Date.now()}-${idx}`,
          classId: selectedClassId,
          dayOfWeek: s.dayOfWeek || s.day || 'Lundi',
          day: s.dayOfWeek || s.day || 'Lundi',
          startTime: s.startTime || '08h00',
          endTime: s.endTime || '10h00',
          customSubject: s.customSubject || '',
          subjectId: sbjId,
          customTeacher: s.customTeacher || '',
          teacherId: tchId,
          room: s.room || currentClassObj?.roomNumber || 'Salle 101',
          roomNumber: s.room || currentClassObj?.roomNumber || 'Salle 101',
          notes: s.notes || ''
        };
      });

      // Apply changes to database/store immediately
      replaceClassTimetable(selectedClassId, formattedForStore);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.aiMessage || "Consignes exécutées fidèlement. La grille a été mise à jour.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changesApplied: data.changesApplied || ["Mise à jour des créneaux appliquée"],
        slotsCount: formattedForStore.length
      };

      setMessages(prev => [...prev, aiMsg]);

      if (onSlotModified) {
        onSlotModified(data.aiMessage || "Emploi du temps mis à jour fidèlement");
      }
    } catch (err: any) {
      console.error("Erreur Copilote IA Timetable:", err);
      setErrorMessage(err.message || "Impossible d'exécuter la consigne. Veuillez réessayer.");
      
      const errorReply: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        text: "Désolé, une erreur s'est produite lors de l'exécution de la consigne. Veuillez reformuler ou réessayer.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecuteFirmInstruction();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
      
      {/* Top Copilot Bar */}
      <div className="p-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-xs tracking-tight">Copilote IA Planificateur</h3>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[9px] uppercase">
                Exécution Directe
              </span>
            </div>
            <p className="text-[10px] text-blue-200/80">
              Classe : <strong className="text-white">{currentClassObj?.name}</strong> ({currentClassSlots.length} cours)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                text: `Conversation réinitialisée pour la classe « ${currentClassObj?.name} ». Donnez-moi vos nouvelles consignes fermes.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                changesApplied: ["Prêt"]
              }
            ]);
          }}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Réinitialiser l'historique"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Firm Action Chips */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>Consignes Rapides & Actions Fermes :</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickFirmCommands.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleExecuteFirmInstruction(cmd.prompt)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 font-bold text-[10px] shadow-2xs transition-all cursor-pointer disabled:opacity-50 text-left"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[220px] max-h-[380px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3 space-y-1.5 shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] opacity-75 pb-0.5">
                <span className="font-bold">
                  {msg.role === 'user' ? 'Votre Consigne Ferme' : 'Copilote IA'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </p>

              {/* Bullet points of applied changes */}
              {msg.changesApplied && msg.changesApplied.length > 0 && (
                <div className="pt-1 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Actions exécutées fidèlement :</span>
                  </p>
                  <ul className="space-y-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                    {msg.changesApplied.map((chg, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-black">•</span>
                        <span>{chg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span className="text-xs font-bold">L'IA exécute fidèlement votre consigne sur l'emploi du temps...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-1.5">
        {errorMessage && (
          <div className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center space-x-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center space-x-1.5">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputInstruction}
            onChange={e => setInputInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Donnez une consigne ferme (ex: "Mets SVT le mardi de 10h15 à 12h15 avec M. ADANLETE", "Libère le vendredi après-midi")...`}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
          />

          <button
            type="button"
            disabled={isLoading || !inputInstruction.trim()}
            onClick={() => handleExecuteFirmInstruction()}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black shadow-md shadow-blue-500/20 disabled:opacity-40 cursor-pointer transition-all shrink-0"
            title="Envoyer la consigne ferme à l'IA"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
          <span>Appuyez sur Entrée pour exécuter la consigne</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">Mise à jour en temps réel</span>
        </div>
      </div>

    </div>
  );
};
