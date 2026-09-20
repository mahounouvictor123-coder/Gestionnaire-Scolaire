import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/store';
import { ParentComplaintMessage, ParentComplaintCategory } from '../types';
import { 
  Inbox, 
  Mic, 
  Image as ImageIcon, 
  Phone, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Play, 
  Pause, 
  Eye, 
  X, 
  ExternalLink,
  Sparkles,
  UserCheck,
  Calendar,
  Trash2,
  Check
} from 'lucide-react';

export const ParentComplaintsInboxView: React.FC = () => {
  const { 
    parentComplaints, 
    updateParentComplaint, 
    deleteParentComplaint, 
    replyToParentComplaint, 
    markParentComplaintAsRead,
    currentUser,
    currentSchool 
  } = useApp();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterMediaOnly, setFilterMediaOnly] = useState<'ALL' | 'AUDIO' | 'PHOTO'>('ALL');
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);

  // Quick Reply form states
  const [replyText, setReplyText] = useState('');
  const [replierTitle, setReplierTitle] = useState(
    currentUser?.role === 'DIRECTEUR' ? 'Direction Générale' :
    currentUser?.role === 'CENSEUR' ? 'Direction des Études (Censeur)' :
    currentUser?.role === 'SURVEILLANT' ? 'Surveillance Générale' :
    currentUser?.role === 'COMPTABLE' ? 'Service Comptabilité' :
    'Secrétariat de l’Établissement'
  );

  // Audio Playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Photo Lightbox modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewPhotoTitle, setPreviewPhotoTitle] = useState<string>('');

  // Handle play/pause audio
  const togglePlayAudio = (id: string, audioUrl?: string) => {
    if (!audioUrl) {
      // If it's a demo voice without data url, play synthetic pleasant feedback
      playSyntheticVoiceFeedback();
      setPlayingAudioId(id);
      setTimeout(() => setPlayingAudioId(null), 3000);
      return;
    }

    if (playingAudioId === id) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudioId(null);
      audio.play().catch(e => {
        console.error('Audio play error', e);
        playSyntheticVoiceFeedback();
      });
      setAudioElement(audio);
      setPlayingAudioId(id);
    }
  };

  const playSyntheticVoiceFeedback = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return parentComplaints.filter(c => {
      // Filter by School ID if scoped
      if (c.schoolId && c.schoolId !== currentSchool.id) return false;

      // Category
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;

      // Status
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

      // Media
      if (filterMediaOnly === 'AUDIO' && !c.audioUrl && !c.audioDurationSeconds) return false;
      if (filterMediaOnly === 'PHOTO' && !c.photoUrl) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchStudent = c.studentName.toLowerCase().includes(query);
        const matchParent = c.parentName.toLowerCase().includes(query);
        const matchPhone = c.parentPhone.includes(query);
        const matchSubject = c.subject.toLowerCase().includes(query);
        const matchMessage = (c.messageText || '').toLowerCase().includes(query);
        const matchClass = (c.studentClass || '').toLowerCase().includes(query);
        return matchStudent || matchParent || matchPhone || matchSubject || matchMessage || matchClass;
      }

      return true;
    });
  }, [parentComplaints, currentSchool.id, selectedCategory, selectedStatus, filterMediaOnly, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = parentComplaints.filter(c => !c.schoolId || c.schoolId === currentSchool.id).length;
    const unread = parentComplaints.filter(c => (!c.schoolId || c.schoolId === currentSchool.id) && (!c.isReadBySchool || c.status === 'NOUVEAU')).length;
    const withAudio = parentComplaints.filter(c => (!c.schoolId || c.schoolId === currentSchool.id) && (c.audioUrl || c.audioDurationSeconds)).length;
    const withPhoto = parentComplaints.filter(c => (!c.schoolId || c.schoolId === currentSchool.id) && c.photoUrl).length;
    const resolved = parentComplaints.filter(c => (!c.schoolId || c.schoolId === currentSchool.id) && c.status === 'RESOLU').length;
    return { total, unread, withAudio, withPhoto, resolved };
  }, [parentComplaints, currentSchool.id]);

  const handleSelectComplaint = (complaint: ParentComplaintMessage) => {
    setActiveComplaintId(complaint.id);
    if (!complaint.isReadBySchool) {
      markParentComplaintAsRead(complaint.id);
    }
    setReplyText(complaint.schoolReply || '');
  };

  const handleSendReply = (complaintId: string) => {
    if (!replyText.trim()) return;
    replyToParentComplaint(complaintId, replyText.trim(), replierTitle);
  };

  const activeComplaint = useMemo(() => {
    return parentComplaints.find(c => c.id === activeComplaintId);
  }, [parentComplaints, activeComplaintId]);

  const getCategoryLabel = (category: ParentComplaintCategory) => {
    switch (category) {
      case 'ABSENCE': return { label: 'Absence / Retard', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300' };
      case 'SANTE': return { label: 'Santé & Allergie', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300' };
      case 'DISCIPLINE': return { label: 'Discipline', color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300' };
      case 'FINANCE': return { label: 'Scolarité / Caisse', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' };
      case 'PEDAGOGIE': return { label: 'Pédagogie / Notes', color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300' };
      case 'QUESTION': return { label: 'Renseignement', color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300' };
      default: return { label: 'Autre Réclamation', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300' };
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENTE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white uppercase animate-pulse">URGENTE</span>;
      case 'HAUTE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase">HAUTE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">Normale</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOUVEAU':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-600 text-white flex items-center space-x-1 shadow-xs">● Nouveau</span>;
      case 'EN_COURS':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500 text-white flex items-center space-x-1 shadow-xs">⏳ En cours</span>;
      case 'RESOLU':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white flex items-center space-x-1 shadow-xs">✓ Traité & Répondu</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Title Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black">
              <Inbox className="w-3.5 h-3.5" />
              <span>BOÎTE DE RÉCEPTION OFFICIELLE DE L'ÉCOLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
              <span>Audios & Plaintes des Parents</span>
              {stats.unread > 0 && (
                <span className="px-3 py-0.5 rounded-full bg-red-500 text-white text-xs font-black animate-bounce shadow-md">
                  {stats.unread} Nouveau(x)
                </span>
              )}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Consultez en direct les notes vocales (audios), les photos (ordonnances, certificats, carnets) et les réclamations envoyées par les parents d'élèves de <strong>{currentSchool.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-semibold">Audios Vocaux</p>
                <p className="text-lg font-black text-white">{stats.withAudio}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-semibold">Photos / Pièces</p>
                <p className="text-lg font-black text-white">{stats.withPhoto}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chercher par élève, parent, tél, sujet..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Toutes les Catégories</option>
            <option value="ABSENCE">Absences & Retards</option>
            <option value="SANTE">Santé & Cantine</option>
            <option value="FINANCE">Scolarité & Caisse</option>
            <option value="PEDAGOGIE">Pédagogie & Notes</option>
            <option value="DISCIPLINE">Discipline</option>
            <option value="QUESTION">Renseignements</option>
            <option value="AUTRE">Autres Plaintes</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les États</option>
            <option value="NOUVEAU">Nouveaux ({stats.unread})</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Résolus ({stats.resolved})</option>
          </select>

          {/* Media Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterMediaOnly('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterMediaOnly === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterMediaOnly('AUDIO')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                filterMediaOnly === 'AUDIO'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>Audios</span>
            </button>
            <button
              onClick={() => setFilterMediaOnly('PHOTO')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                filterMediaOnly === 'PHOTO'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Inbox Workspace: Split Master/Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: List of Complaints */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Messages Reçus ({filteredComplaints.length})
            </p>
            {stats.unread > 0 && (
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                {stats.unread} non lu(s)
              </span>
            )}
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Aucun message ou plainte trouvé
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Les nouveaux audios et plaintes envoyés par les parents d'élèves apparaîtront ici en temps réel.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredComplaints.map(complaint => {
                const isSelected = activeComplaintId === complaint.id;
                const cat = getCategoryLabel(complaint.category);
                const hasAudio = !!complaint.audioUrl || !!complaint.audioDurationSeconds;
                const hasPhoto = !!complaint.photoUrl;

                return (
                  <div
                    key={complaint.id}
                    onClick={() => handleSelectComplaint(complaint)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : !complaint.isReadBySchool
                        ? 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-900/60 shadow-sm hover:border-blue-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {!complaint.isReadBySchool && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 animate-ping" />
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${cat.color}`}>
                          {cat.label}
                        </span>
                        {getPriorityBadge(complaint.priority)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                        {new Date(complaint.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 dark:text-white mt-2 line-clamp-1">
                      {complaint.subject}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                      {complaint.messageText || (hasAudio ? "🎙️ Message vocal audio joint" : "Photo jointe")}
                    </p>

                    {/* Metadata Footer */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 truncate max-w-[130px]">
                          {complaint.studentName}
                        </span>
                        {complaint.studentClass && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                            {complaint.studentClass}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {hasAudio && (
                          <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" title="Audio joint">
                            <Mic className="w-3 h-3" />
                          </span>
                        )}
                        {hasPhoto && (
                          <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" title="Photo jointe">
                            <ImageIcon className="w-3 h-3" />
                          </span>
                        )}
                        {complaint.schoolReply ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
                            <Check className="w-3 h-3" />
                            <span>Répondu</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Complaint Detail & School Response Console */}
        <div className="lg:col-span-7">
          {activeComplaint ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-md space-y-6 animate-in fade-in">
              
              {/* Header Details */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getCategoryLabel(activeComplaint.category).color}`}>
                      {getCategoryLabel(activeComplaint.category).label}
                    </span>
                    {getPriorityBadge(activeComplaint.priority)}
                    {getStatusBadge(activeComplaint.status)}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                    {activeComplaint.subject}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reçu le {new Date(activeComplaint.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = activeComplaint.status === 'RESOLU' ? 'EN_COURS' : 'RESOLU';
                      updateParentComplaint(activeComplaint.id, { status: next });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      activeComplaint.status === 'RESOLU'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{activeComplaint.status === 'RESOLU' ? 'Marqué Résolu' : 'Marquer comme Résolu'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Voulez-vous supprimer ce message de la boîte ?")) {
                        deleteParentComplaint(activeComplaint.id);
                        setActiveComplaintId(null);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Supprimer de la boîte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Parent & Student Contact Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Parent Expéditeur
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {activeComplaint.parentName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <a
                      href={`tel:${activeComplaint.parentPhone}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{activeComplaint.parentPhone}</span>
                    </a>

                    <a
                      href={`https://wa.me/${activeComplaint.parentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${activeComplaint.parentName}, nous vous contactons depuis l'administration de ${currentSchool.name} concernant votre message.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black hover:bg-emerald-200 transition-colors"
                    >
                      <span>WhatsApp</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Élève Concerné
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {activeComplaint.studentName}
                  </p>
                  <p className="text-xs text-slate-500 font-bold">
                    Classe : {activeComplaint.studentClass || 'Non précisée'}
                  </p>
                </div>
              </div>

              {/* Message Content Area */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Texte du Message
                </p>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeComplaint.messageText || (
                    <span className="italic text-slate-400">
                      (Aucun texte écrit. Veuillez écouter la note vocale ou consulter la photo ci-dessous.)
                    </span>
                  )}
                </div>
              </div>

              {/* Audio Note Player Component */}
              {(activeComplaint.audioUrl || activeComplaint.audioDurationSeconds) && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300">
                      <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span className="font-extrabold text-xs">Note Vocale Enregistrée par le Parent</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      Durée : {activeComplaint.audioDurationSeconds ? `${activeComplaint.audioDurationSeconds}s` : 'Audio'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(activeComplaint.id, activeComplaint.audioUrl)}
                      className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      {playingAudioId === activeComplaint.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`bg-blue-600 h-full rounded-full ${
                            playingAudioId === activeComplaint.id ? 'w-full transition-all duration-[24000ms] ease-linear' : 'w-0'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-blue-800/80 dark:text-blue-300/80 font-bold">
                        {playingAudioId === activeComplaint.id ? "Lecture vocale en cours..." : "Cliquez sur Play pour écouter le message vocal"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo / Attached Document Preview */}
              {activeComplaint.photoUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Photo / Pièce Justificative Jointe</span>
                  </p>

                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div 
                      onClick={() => {
                        setPreviewPhotoUrl(activeComplaint.photoUrl || null);
                        setPreviewPhotoTitle(activeComplaint.photoName || activeComplaint.subject);
                      }}
                      className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer relative group border border-slate-300 dark:border-slate-700 shrink-0"
                    >
                      <img 
                        src={activeComplaint.photoUrl} 
                        alt="Pièce jointe" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {activeComplaint.photoName || "Pièce_jointe_parent.jpg"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPhotoUrl(activeComplaint.photoUrl || null);
                          setPreviewPhotoTitle(activeComplaint.photoName || activeComplaint.subject);
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Agrandir en plein écran</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* School Official Reply Section */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Réponse Officielle de l'Établissement</span>
                  </h4>

                  {activeComplaint.schoolReply && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Envoyée le {activeComplaint.repliedAt ? new Date(activeComplaint.repliedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-[11px] font-bold text-slate-500">Signataire :</label>
                    <input
                      type="text"
                      value={replierTitle}
                      onChange={(e) => setReplierTitle(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tapez ici la réponse qui apparaîtra directement sur le portail du parent..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                {/* Quick Reply Presets */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Réponses Rapides Types (1 Clic) :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Bonjour, nous avons bien pris note de l'absence et excusé l'élève.",
                      "Bonjour, le nécessaire a été fait avec le responsable cantine.",
                      "Bonjour, nous vous invitons à passer au secrétariat ce vendredi.",
                      "Bonjour, le devoir surveillé est confirmé pour cette semaine.",
                      "Bonjour, votre demande a été transmise au professeur principal."
                    ].map((quick, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(quick)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors text-left"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleSendReply(activeComplaint.id)}
                    disabled={!replyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer la Réponse au Parent</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Sélectionnez un message ou un audio
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cliquez sur un message dans la liste de gauche pour écouter la note vocale, voir la photo jointe et répondre directement au parent.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white truncate max-w-md">
                {previewPhotoTitle}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-black">
              <img 
                src={previewPhotoUrl} 
                alt={previewPhotoTitle} 
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
