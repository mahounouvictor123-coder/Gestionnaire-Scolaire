import React, { useState, useRef } from 'react';
import { useApp } from '../lib/store';
import {
  OfficialAnnouncement,
  AnnouncementAudience,
  AnnouncementCategory,
  Student
} from '../types';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  Lock,
  Globe,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Share2,
  X,
  Upload,
  Eye,
  Send,
  Phone,
  UserCheck,
  Tag,
  Sparkles,
  ExternalLink,
  MessageCircle,
  FileText,
  Clock,
  Pin
} from 'lucide-react';

interface OfficialAnnouncementsBoxProps {
  onNavigateToParentApp?: () => void;
}

export const OfficialAnnouncementsBox: React.FC<OfficialAnnouncementsBoxProps> = ({
  onNavigateToParentApp
}) => {
  const {
    currentSchool,
    students,
    classes,
    officialAnnouncements,
    addOfficialAnnouncement,
    deleteOfficialAnnouncement,
    currentUser,
    settings
  } = useApp();

  // Filters and UI states
  const [filterAudience, setFilterAudience] = useState<'ALL' | 'PUBLIC_ALL' | 'PUBLIC_CLASS' | 'PRIVATE_STUDENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<{ url: string; title: string } | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('PUBLIC_ALL');
  const [targetClassId, setTargetClassId] = useState<string>(classes[0]?.id || '');
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('CIRCULAIRE');
  const [priority, setPriority] = useState<'NORMALE' | 'IMPORTANTE' | 'URGENTE'>('NORMALE');
  const [authorName, setAuthorName] = useState(currentUser?.name || "Direction de l'Établissement");
  const [isPinned, setIsPinned] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const [isAdBanner, setIsAdBanner] = useState(false);
  const [adTag, setAdTag] = useState<string>('OFFICIEL');
  const [sponsorName, setSponsorName] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter announcements for current school
  const schoolAnnouncements = officialAnnouncements.filter(a => !a.schoolId || a.schoolId === currentSchool.id);

  // Filtered by tabs & search
  const filteredAnnouncements = schoolAnnouncements.filter(item => {
    if (filterAudience !== 'ALL' && item.audience !== filterAudience) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchStudent = item.targetStudentName?.toLowerCase().includes(q);
      const matchParent = item.targetParentName?.toLowerCase().includes(q);
      const matchPhone = item.targetParentPhone?.toLowerCase().includes(q);
      const matchClass = item.targetClassName?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchStudent && !matchParent && !matchPhone && !matchClass) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const totalCount = schoolAnnouncements.length;
  const publicCount = schoolAnnouncements.filter(a => a.audience === 'PUBLIC_ALL').length;
  const privateCount = schoolAnnouncements.filter(a => a.audience === 'PRIVATE_STUDENT').length;
  const classCount = schoolAnnouncements.filter(a => a.audience === 'PUBLIC_CLASS').length;
  const withPhotoCount = schoolAnnouncements.filter(a => Boolean(a.photoUrl)).length;

  // Student search results for private message
  const studentResults = studentSearchTerm.trim().length > 1
    ? students.filter(s => {
        const term = studentSearchTerm.toLowerCase();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const reg = (s.registrationNumber || '').toLowerCase();
        const parent = (s.parentName || '').toLowerCase();
        const phone = (s.parentPhone || '').toLowerCase();
        return fullName.includes(term) || reg.includes(term) || parent.includes(term) || phone.includes(term);
      }).slice(0, 5)
    : [];

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 4 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Submit announcement
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Veuillez saisir le titre de l'annonce.");
      return;
    }
    if (!content.trim()) {
      alert("Veuillez saisir le contenu du message.");
      return;
    }

    if (audience === 'PRIVATE_STUDENT' && !targetStudent) {
      alert("Veuillez rechercher et sélectionner un parent d'élève pour ce message privé.");
      return;
    }

    const targetClassObj = classes.find(c => c.id === targetClassId);

    const newAnnouncement: Omit<OfficialAnnouncement, 'id' | 'createdAt'> = {
      schoolId: currentSchool.id,
      title: title.trim(),
      content: content.trim(),
      audience: audience,
      targetClassId: audience === 'PUBLIC_CLASS' ? targetClassId : (targetStudent?.classId || undefined),
      targetClassName: audience === 'PUBLIC_CLASS' ? targetClassObj?.name : (targetStudent ? (classes.find(c => c.id === targetStudent.classId)?.name || 'Classe') : undefined),
      targetStudentId: audience === 'PRIVATE_STUDENT' ? targetStudent?.id : undefined,
      targetStudentName: audience === 'PRIVATE_STUDENT' ? `${targetStudent?.firstName} ${targetStudent?.lastName}` : undefined,
      targetStudentRegNumber: audience === 'PRIVATE_STUDENT' ? targetStudent?.registrationNumber : undefined,
      targetParentName: audience === 'PRIVATE_STUDENT' ? targetStudent?.parentName : undefined,
      targetParentPhone: audience === 'PRIVATE_STUDENT' ? targetStudent?.parentPhone : undefined,
      photoUrl: photoUrl || undefined,
      photoName: photoName || undefined,
      priority: priority,
      category: category,
      authorName: authorName.trim() || "Direction de l'Établissement",
      isPinned: isPinned,
      readReceipts: [],
      isAdBanner: isAdBanner || category === 'PUBLICITE' || category === 'PARTENAIRE',
      adTag: adTag || (category === 'PARTENAIRE' ? 'PARTENAIRE' : category === 'EVENEMENT' ? 'ÉVÉNEMENT' : 'OFFICIEL'),
      sponsorName: sponsorName.trim() || undefined,
      ctaText: ctaText.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined
    };

    addOfficialAnnouncement(newAnnouncement);

    // Reset & Close
    setIsCreateModalOpen(false);
    setTitle('');
    setContent('');
    setPhotoUrl('');
    setPhotoName('');
    setTargetStudent(null);
    setStudentSearchTerm('');
    setIsPinned(false);
    setIsAdBanner(false);
    setSponsorName('');
    setCtaText('');
    setCtaUrl('');

    const successMsg = audience === 'PRIVATE_STUDENT'
      ? `🔒 Message privé envoyé avec succès à ${targetStudent?.parentName || 'le parent'} (${targetStudent?.firstName} ${targetStudent?.lastName}) ! Visible instantanément sur son application.`
      : `📢 Annonce officielle publiée avec succès ! Diffusée directement sur l'application de tous les parents concernés.`;

    setNotificationBanner(successMsg);
    setTimeout(() => setNotificationBanner(null), 6000);
  };

  // Quick WhatsApp share helper
  const shareViaWhatsApp = (item: OfficialAnnouncement) => {
    let destPhone = item.targetParentPhone?.replace(/[^0-9]/g, '') || '';
    if (destPhone.startsWith('00')) destPhone = destPhone.substring(2);
    
    let text = `*${currentSchool.name.toUpperCase()} - ANNONCE OFFICIELLE*\n\n`;
    text += `📌 *Objet :* ${item.title}\n`;
    text += `👤 *De :* ${item.authorName}\n\n`;
    text += `${item.content}\n\n`;
    if (item.audience === 'PRIVATE_STUDENT') {
      text += `🔒 _Ce message est adressé personnellement pour le suivi de l'élève ${item.targetStudentName} (Matricule : ${item.targetStudentRegNumber || 'N/A'})._\n\n`;
    }
    text += `📱 Retrouvez l'intégralité de vos notes, bulletins et circulaires sur l'Espace Parents : ${window.location.origin}/?subapp=parent&school=${currentSchool.id}`;

    const waUrl = destPhone 
      ? `https://wa.me/${destPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-6 text-white">
      {/* Top Banner if recently published */}
      {notificationBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-start justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{notificationBanner}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            className="p-1 rounded-lg hover:bg-emerald-500/30 text-emerald-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header section with Stats & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Boîte d'Annonces Officielles & Messages Privés aux Parents
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase">
                  Direct Parents
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Toute annonce publique ou message privé créé ici est transmis instantanément dans l'application de chaque parent d'élève de <strong className="text-slate-200 font-bold">{currentSchool.name}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateToParentApp && (
            <button
              onClick={onNavigateToParentApp}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5"
              title="Ouvrir la vue parent pour voir les annonces en temps réel"
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
              <span>Aperçu Espace Parents</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Créer une Annonce / Message Privé</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Total Diffusé</span>
            <span className="text-lg font-black text-white">{totalCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Megaphone className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Publiques (Tous)</span>
            <span className="text-lg font-black text-emerald-400">{publicCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Globe className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Messages Privés</span>
            <span className="text-lg font-black text-amber-400">{privateCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Avec Photos / Affiches</span>
            <span className="text-lg font-black text-purple-400">{withPhotoCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <ImageIcon className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setFilterAudience('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterAudience === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Toutes ({totalCount})
          </button>
          <button
            onClick={() => setFilterAudience('PUBLIC_ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
              filterAudience === 'PUBLIC_ALL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>Publiques ({publicCount})</span>
          </button>
          <button
            onClick={() => setFilterAudience('PUBLIC_CLASS')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
              filterAudience === 'PUBLIC_CLASS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>Par Classe ({classCount})</span>
          </button>
          <button
            onClick={() => setFilterAudience('PRIVATE_STUDENT')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
              filterAudience === 'PRIVATE_STUDENT'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="h-3 w-3" />
            <span>Messages Privés ({privateCount})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, élève, parent..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Announcements Feed List */}
      <div className="space-y-3.5">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <Megaphone className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">Aucune annonce trouvée</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Créez votre première circulaire officielle, annonce par classe ou message privé destiné à un parent d'élève en cliquant sur le bouton ci-dessus.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all inline-flex items-center space-x-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publier une Annonce</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnnouncements.map(announcement => {
              const isPrivate = announcement.audience === 'PRIVATE_STUDENT';
              const isClass = announcement.audience === 'PUBLIC_CLASS';

              return (
                <div
                  key={announcement.id}
                  className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all border ${
                    isPrivate
                      ? 'bg-gradient-to-br from-slate-950 to-amber-950/30 border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20 shadow-lg'
                      : isClass
                      ? 'bg-gradient-to-br from-slate-950 to-indigo-950/30 border-indigo-500/40 hover:border-indigo-500/70'
                      : 'bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Top: Badges & Date */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Audience Badge */}
                        {isPrivate ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black flex items-center space-x-1">
                            <Lock className="h-3 w-3" />
                            <span>Message Privé Parent</span>
                          </span>
                        ) : isClass ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-black flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>Classe : {announcement.targetClassName || 'Spécifique'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>Publique (Tous les Parents)</span>
                          </span>
                        )}

                        {/* Category */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px]">
                          {announcement.category}
                        </span>

                        {/* Priority Badge */}
                        {announcement.priority === 'URGENTE' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-[10px] animate-pulse">
                            🚨 URGENTE
                          </span>
                        )}
                        {announcement.priority === 'IMPORTANTE' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                            ⭐ IMPORTANTE
                          </span>
                        )}

                        {announcement.isPinned && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-[10px] flex items-center space-x-1">
                            <Pin className="h-2.5 w-2.5" />
                            <span>Épinglée</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 text-slate-400 text-[10px] font-mono">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(announcement.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Private Recipient Info Banner */}
                    {isPrivate && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-black text-white">{announcement.targetStudentName}</span>
                            {announcement.targetStudentRegNumber && (
                              <span className="text-[10px] text-amber-300/80 ml-1.5 font-mono">
                                ({announcement.targetStudentRegNumber})
                              </span>
                            )}
                            <div className="text-[11px] text-amber-300/90 font-medium">
                              Parent : <strong>{announcement.targetParentName || 'Non spécifié'}</strong> {announcement.targetParentPhone && `• ${announcement.targetParentPhone}`}
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          Seul ce parent le voit
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-sm font-black text-white leading-snug">
                      {announcement.title}
                    </h3>

                    {/* Content */}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Photo attachment preview if any */}
                  {announcement.photoUrl && (
                    <div className="pt-2">
                      <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-black/40 max-h-48 flex items-center justify-center">
                        <img
                          src={announcement.photoUrl}
                          alt={announcement.photoName || announcement.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setActiveLightboxPhoto({ url: announcement.photoUrl!, title: announcement.title })}
                        />
                        <div
                          onClick={() => setActiveLightboxPhoto({ url: announcement.photoUrl!, title: announcement.title })}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer space-x-1.5 text-white text-xs font-bold"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Agrandir la Photo</span>
                        </div>
                      </div>
                      {announcement.photoName && (
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block truncate">
                          📎 {announcement.photoName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Bottom: Author, Status & Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">De : {announcement.authorName}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => shareViaWhatsApp(announcement)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center space-x-1"
                        title="Partager par WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Voulez-vous vraiment supprimer cette annonce (« ${announcement.title} ») ?`)) {
                            deleteOfficialAnnouncement(announcement.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-slate-700"
                        title="Supprimer l'annonce"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CRÉER UNE ANNONCE OU UN MESSAGE PRIVÉ                             */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Nouvelle Annonce Officielle ou Message Privé
                  </h3>
                  <p className="text-xs text-blue-200">
                    Sera instantanément synchronisé dans l'application de chaque parent
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
              {/* 1. SELECTION DU TYPE DE DIFFUSION (AUDIENCE) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag className="h-3.5 w-3.5 text-blue-400" />
                  <span>1. Choisissez la Cible du Message</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Public All */}
                  <button
                    type="button"
                    onClick={() => {
                      setAudience('PUBLIC_ALL');
                      setTargetStudent(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      audience === 'PUBLIC_ALL'
                        ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className={`h-4 w-4 ${audience === 'PUBLIC_ALL' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-black text-xs text-white">Publique (Tous)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Tous les parents d'élèves de l'école recevront cette annonce.
                    </p>
                  </button>

                  {/* Public Class */}
                  <button
                    type="button"
                    onClick={() => {
                      setAudience('PUBLIC_CLASS');
                      setTargetStudent(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      audience === 'PUBLIC_CLASS'
                        ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md shadow-indigo-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className={`h-4 w-4 ${audience === 'PUBLIC_CLASS' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="font-black text-xs text-white">Par Classe</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Uniquement les parents ayant un enfant dans la classe sélectionnée.
                    </p>
                  </button>

                  {/* Private Student */}
                  <button
                    type="button"
                    onClick={() => setAudience('PRIVATE_STUDENT')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      audience === 'PRIVATE_STUDENT'
                        ? 'bg-amber-950/50 border-amber-500 text-white shadow-md shadow-amber-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Lock className={`h-4 w-4 ${audience === 'PRIVATE_STUDENT' ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="font-black text-xs text-white">Message Privé</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Confidentiel : visible uniquement par le parent de l'élève choisi.
                    </p>
                  </button>
                </div>
              </div>

              {/* Sub-selector for CLASS */}
              {audience === 'PUBLIC_CLASS' && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-indigo-300">
                    Sélectionnez la classe destinataire :
                  </label>
                  <select
                    value={targetClassId}
                    onChange={e => setTargetClassId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-indigo-700/60 text-white text-xs font-bold focus:outline-none focus:border-indigo-400"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level}) - {c.studentCount} élève(s)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-selector for PRIVATE STUDENT */}
              {audience === 'PRIVATE_STUDENT' && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3 animate-in fade-in">
                  <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span>Rechercher et sélectionner l'élève / parent destinataire :</span>
                    {targetStudent && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Sélectionné !</span>
                      </span>
                    )}
                  </label>

                  {/* If student already selected, show card */}
                  {targetStudent ? (
                    <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/60 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs border border-amber-500/40">
                          {targetStudent.firstName[0]}{targetStudent.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {targetStudent.firstName} {targetStudent.lastName}
                          </div>
                          <div className="text-[11px] text-amber-300 font-medium">
                            Classe : {classes.find(c => c.id === targetStudent.classId)?.name || 'Classe'} • Parent : <strong>{targetStudent.parentName || 'Non renseigné'}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Tél : {targetStudent.parentPhone || 'Non renseigné'} • Matricule : {targetStudent.registrationNumber}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTargetStudent(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all border border-slate-700"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tapez le nom, prénom, matricule ou téléphone du parent..."
                          value={studentSearchTerm}
                          onChange={e => setStudentSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          autoFocus
                        />
                      </div>

                      {studentResults.length > 0 && (
                        <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 max-h-48 overflow-y-auto">
                          {studentResults.map(s => {
                            const cls = classes.find(c => c.id === s.classId);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setTargetStudent(s);
                                  setStudentSearchTerm('');
                                }}
                                className="w-full p-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between rounded-lg cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-white text-xs block">
                                    {s.firstName} {s.lastName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {cls?.name || 'N/A'} • Parent : {s.parentName} ({s.parentPhone})
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Choisir
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {studentSearchTerm.trim().length > 1 && studentResults.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">
                          Aucun élève trouvé correspondant à « {studentSearchTerm} ».
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PHOTO / AFFICHE IMPORTATION */}
              <div className="space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                  <span>2. Joindre une Photo, Affiche ou Circulaire (Optionnel)</span>
                </label>

                {photoUrl ? (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 truncate">
                      <img
                        src={photoUrl}
                        alt="Aperçu"
                        className="h-14 w-14 object-cover rounded-xl border border-slate-700 shrink-0"
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {photoName || 'image_jointe.jpg'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          ✓ Prête à être diffusée
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-slate-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/60 hover:bg-slate-950 transition-all text-center cursor-pointer space-y-2"
                  >
                    <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                    <div className="text-xs text-slate-300 font-bold">
                      Cliquez pour importer une photo / affiche / circulaire
                    </div>
                    <div className="text-[10px] text-slate-500">
                      PNG, JPG, WEBP jusqu'à 4 Mo (affiche d'événement, convocation signée, planning, etc.)
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* 3. DETAILS DE L'ANNONCE */}
              <div className="space-y-3">
                <label className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span>3. Détails du Message</span>
                </label>

                {/* Title */}
                <div>
                  <input
                    type="text"
                    placeholder="Titre / Objet de l'annonce ou convocation *"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>

                {/* Row: Category, Priority, Author */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Catégorie :</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as AnnouncementCategory)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    >
                      <option value="CIRCULAIRE">📄 Circulaire Officielle</option>
                      <option value="REUNION">🤝 Réunion de Parents</option>
                      <option value="PAIEMENT">💳 Paiement & Scolarité</option>
                      <option value="CONVOCATION">📨 Convocation</option>
                      <option value="DISCIPLINE">⚖️ Discipline & Conduite</option>
                      <option value="EVENEMENT">🎉 Événement / Fête</option>
                      <option value="BULLETINS">📊 Bulletins & Notes</option>
                      <option value="PUBLICITE">📢 Publicité & Bon Plan</option>
                      <option value="PARTENAIRE">🤝 Partenaire & Fournitures</option>
                      <option value="ACTIVITE">🚀 Activités & Ateliers</option>
                      <option value="URGENT">🚨 Message Urgent</option>
                      <option value="AUTRE">📌 Autre information</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Niveau d'Urgence :</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    >
                      <option value="NORMALE">Normale</option>
                      <option value="IMPORTANTE">⭐ Importante</option>
                      <option value="URGENTE">🚨 URGENTE (Alerte)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Signataire / Auteur :</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      placeholder="Ex: Direction Générale"
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Content Message */}
                <div>
                  <textarea
                    rows={4}
                    placeholder="Rédigez ici le texte complet de votre annonce officielle ou message destiné au parent..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-normal"
                    required
                  />
                </div>

                {/* ESPACE PUBLICITAIRE & CARROUSEL VISUEL TOGGLE */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="adBannerCheckbox"
                        checked={isAdBanner}
                        onChange={e => setIsAdBanner(e.target.checked)}
                        className="h-4 w-4 rounded bg-slate-950 border-amber-500/50 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="adBannerCheckbox" className="text-xs text-amber-200 font-black cursor-pointer select-none">
                        ✨ Mettre en avant dans l'Espace Publicitaire & Carrousel Visuel Parents
                      </label>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Bannière & Affiche
                    </span>
                  </div>

                  {isAdBanner && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-500/20">
                      <div>
                        <label className="text-[10px] font-bold text-amber-300 block mb-1">
                          Type de Badge Visuel :
                        </label>
                        <select
                          value={adTag}
                          onChange={e => setAdTag(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold"
                        >
                          <option value="OFFICIEL">📢 Annonce Officielle</option>
                          <option value="ÉVÉNEMENT">🎪 Événement / Fête</option>
                          <option value="PARTENAIRE">📚 Partenaire & Fournitures</option>
                          <option value="ACTIVITÉ">🚀 Activités & Clubs</option>
                          <option value="DIVERS">🏷️ Bons Plans & Divers</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-amber-300 block mb-1">
                          Nom du Partenaire / Organisateur (Optionnel) :
                        </label>
                        <input
                          type="text"
                          value={sponsorName}
                          onChange={e => setSponsorName(e.target.value)}
                          placeholder="Ex: Librairie Centrale, Sunu Assurances..."
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-amber-300 block mb-1">
                          Bouton d'Action CTA (Optionnel) :
                        </label>
                        <input
                          type="text"
                          value={ctaText}
                          onChange={e => setCtaText(e.target.value)}
                          placeholder="Ex: Commander sur WhatsApp, Participer..."
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-amber-300 block mb-1">
                          Lien d'Action / WhatsApp (Optionnel) :
                        </label>
                        <input
                          type="text"
                          value={ctaUrl}
                          onChange={e => setCtaUrl(e.target.value)}
                          placeholder="Ex: https://wa.me/22997000000..."
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinned toggle */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinCheckbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="pinCheckbox" className="text-xs text-slate-300 font-bold cursor-pointer select-none">
                    Épingler en haut de l'Espace Parents (Mise en avant prioritaire)
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-xl transition-all flex items-center space-x-2 cursor-pointer ${
                    audience === 'PRIVATE_STUDENT'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {audience === 'PRIVATE_STUDENT'
                      ? "Envoyer le Message Privé au Parent"
                      : "Diffuser l'Annonce Officielle"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX FOR PHOTO ZOOM                                                   */}
      {/* ========================================================================= */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white truncate max-w-md">
                {activeLightboxPhoto.title}
              </h4>
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-black">
              <img
                src={activeLightboxPhoto.url}
                alt={activeLightboxPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
