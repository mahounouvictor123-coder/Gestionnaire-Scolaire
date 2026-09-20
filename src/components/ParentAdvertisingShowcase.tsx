import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OfficialAnnouncement } from '../types';
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Share2,
  Phone,
  MessageCircle,
  Tag,
  Calendar,
  Sparkles,
  ShoppingBag,
  Award,
  BookOpen,
  Info,
  X,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

interface ParentAdvertisingShowcaseProps {
  announcements: OfficialAnnouncement[];
  schoolName: string;
  onViewAnnouncementDetail?: (announcement: OfficialAnnouncement) => void;
}

export const ParentAdvertisingShowcase: React.FC<ParentAdvertisingShowcaseProps> = ({
  announcements,
  schoolName,
  onViewAnnouncementDetail
}) => {
  // Filter for visual announcements or ads (must have a photo or be marked isAdBanner or category is PUBLICITE/PARTENAIRE/EVENEMENT)
  const visualAds = useMemo(() => {
    return announcements.filter(a => {
      if (a.audience === 'PRIVATE_STUDENT') return false; // Private is not for ad space
      return (
        a.isAdBanner ||
        Boolean(a.photoUrl) ||
        a.category === 'PUBLICITE' ||
        a.category === 'PARTENAIRE' ||
        a.category === 'EVENEMENT' ||
        a.category === 'ACTIVITE'
      );
    });
  }, [announcements]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [selectedAdForModal, setSelectedAdForModal] = useState<OfficialAnnouncement | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<'ALL' | 'OFFICIAL' | 'EVENT' | 'PARTNER' | 'OTHER'>('ALL');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || visualAds.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visualAds.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlay, visualAds.length]);

  if (visualAds.length === 0) {
    return null;
  }

  const currentAd = visualAds[currentIndex] || visualAds[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? visualAds.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % visualAds.length);
  };

  // Helper to get ad badge style
  const getBadgeConfig = (ad: OfficialAnnouncement) => {
    if (ad.category === 'PARTENAIRE' || ad.adTag === 'PARTENAIRE') {
      return {
        label: 'PARTENAIRE & SERVICES',
        bg: 'bg-emerald-500 text-slate-950',
        border: 'border-emerald-400',
        icon: ShoppingBag
      };
    }
    if (ad.category === 'EVENEMENT' || ad.adTag === 'ÉVÉNEMENT') {
      return {
        label: 'ÉVÉNEMENT & VIE SCOLAIRE',
        bg: 'bg-amber-400 text-slate-950',
        border: 'border-amber-300',
        icon: Sparkles
      };
    }
    if (ad.category === 'ACTIVITE' || ad.adTag === 'ACTIVITÉ') {
      return {
        label: 'ACTIVITÉS & ATELIERS',
        bg: 'bg-indigo-500 text-white',
        border: 'border-indigo-400',
        icon: Compass
      };
    }
    if (ad.category === 'PUBLICITE' || ad.adTag === 'DIVERS') {
      return {
        label: 'ANNONCE & BONS PLANS',
        bg: 'bg-rose-500 text-white',
        border: 'border-rose-400',
        icon: Tag
      };
    }
    return {
      label: 'ANNONCE OFFICIELLE',
      bg: 'bg-blue-600 text-white',
      border: 'border-blue-400',
      icon: Megaphone
    };
  };

  const badge = getBadgeConfig(currentAd);
  const BadgeIcon = badge.icon;

  // WhatsApp share
  const handleShareWhatsApp = (ad: OfficialAnnouncement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const text = `📢 *${ad.title}*\n\n${ad.content}\n\n🏫 *${schoolName}*${ad.sponsorName ? ` | ${ad.sponsorName}` : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Open CTA link
  const handleCtaClick = (ad: OfficialAnnouncement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ad.ctaUrl) {
      window.open(ad.ctaUrl, '_blank');
    } else {
      setSelectedAdForModal(ad);
    }
  };

  // Filtered gallery ads
  const filteredGalleryAds = visualAds.filter(ad => {
    if (galleryFilter === 'OFFICIAL') return ad.category === 'CIRCULAIRE' || ad.category === 'REUNION' || ad.adTag === 'OFFICIEL';
    if (galleryFilter === 'EVENT') return ad.category === 'EVENEMENT' || ad.adTag === 'ÉVÉNEMENT';
    if (galleryFilter === 'PARTNER') return ad.category === 'PARTENAIRE' || ad.adTag === 'PARTENAIRE';
    if (galleryFilter === 'OTHER') return ad.category === 'ACTIVITE' || ad.category === 'PUBLICITE' || ad.adTag === 'DIVERS';
    return true;
  });

  return (
    <section className="space-y-3" aria-label="Espace Publicitaire et Annonces Officielles">
      {/* Top Header of the Showcase Space */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-200 tracking-wide uppercase flex items-center space-x-1.5">
              <span>Espace Publicitaire & Visuels Officiels</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(true)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 hover:underline cursor-pointer bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 transition-all"
          >
            <span>Voir Tout ({visualAds.length})</span>
            <Maximize2 className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Advertising Banner & Visual Showcase */}
      <div
        className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl transition-all group"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        {/* Background Visual Flyer with Overlay */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
          {currentAd.photoUrl ? (
            <img
              src={currentAd.photoUrl}
              alt={currentAd.title}
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 filter brightness-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6 text-slate-700">
              <Megaphone className="w-24 h-24 opacity-20" />
            </div>
          )}

          {/* Premium Gradient Overlay for perfect typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
        </div>

        {/* Content Floating over the Visual Banner */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between z-10">
          {/* Top Row: Category Badge, School/Partner tag & Lightbox shortcut */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider flex items-center space-x-1.5 shadow-md ${badge.bg}`}>
                <BadgeIcon className="w-3 h-3" />
                <span>{badge.label}</span>
              </span>

              {currentAd.sponsorName && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                  {currentAd.sponsorName}
                </span>
              )}

              {currentAd.priority === 'URGENTE' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                  🚨 URGENT
                </span>
              )}
            </div>

            {/* Quick action buttons on top-right */}
            <div className="flex items-center space-x-1.5">
              {currentAd.photoUrl && (
                <button
                  type="button"
                  onClick={() => setLightboxImage({ url: currentAd.photoUrl!, title: currentAd.title })}
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-transform active:scale-95 cursor-pointer shadow"
                  title="Agrandir l'affiche visuelle"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleShareWhatsApp(currentAd, e)}
                className="p-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/30 backdrop-blur-md transition-transform active:scale-95 cursor-pointer shadow"
                title="Partager sur WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Area: Title, Content snippet and Action CTA */}
          <div className="space-y-2.5">
            <h4 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md line-clamp-2">
              {currentAd.title}
            </h4>

            <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed drop-shadow max-w-2xl font-medium">
              {currentAd.content}
            </p>

            {/* CTA & Details Row */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                {currentAd.ctaUrl ? (
                  <button
                    type="button"
                    onClick={(e) => handleCtaClick(currentAd, e)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center space-x-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>{currentAd.ctaText || 'Profiter / En savoir plus'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedAdForModal(currentAd)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg flex items-center space-x-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>Voir le Communiqué</span>
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAdForModal(currentAd)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer"
                >
                  Détails
                </button>
              </div>

              {/* Slider Dots & Nav arrows */}
              {visualAds.length > 1 && (
                <div className="flex items-center space-x-2 bg-slate-950/70 px-2.5 py-1 rounded-full border border-slate-800/80 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    aria-label="Affiche précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {visualAds.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentIndex
                            ? 'w-5 bg-amber-400'
                            : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                        aria-label={`Aller au visuel ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    aria-label="Affiche suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FULL AD & ANNOUNCEMENT DETAILS MODAL                             */}
      {/* ========================================================================= */}
      {selectedAdForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedAdForModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${getBadgeConfig(selectedAdForModal).bg}`}>
                    {getBadgeConfig(selectedAdForModal).label}
                  </span>
                  {selectedAdForModal.sponsorName && (
                    <span className="text-[11px] font-bold text-amber-300">
                      {selectedAdForModal.sponsorName}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white leading-snug">
                  {selectedAdForModal.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAdForModal(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attached Photo */}
            {selectedAdForModal.photoUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-72 group bg-black/40">
                <img
                  src={selectedAdForModal.photoUrl}
                  alt={selectedAdForModal.title}
                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                  onClick={() => setLightboxImage({ url: selectedAdForModal.photoUrl!, title: selectedAdForModal.title })}
                />
                <button
                  type="button"
                  onClick={() => setLightboxImage({ url: selectedAdForModal.photoUrl!, title: selectedAdForModal.title })}
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[10px] font-bold flex items-center space-x-1 shadow backdrop-blur-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Agrandir</span>
                </button>
              </div>
            )}

            {/* Content text */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {selectedAdForModal.content}
            </div>

            {/* Author / School Info */}
            <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Diffusé par : <strong>{selectedAdForModal.authorName || schoolName}</strong></span>
              </span>
              <span>
                {new Date(selectedAdForModal.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={(e) => handleShareWhatsApp(selectedAdForModal, e)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager aux Parents</span>
              </button>

              {selectedAdForModal.ctaUrl && (
                <button
                  type="button"
                  onClick={(e) => handleCtaClick(selectedAdForModal, e)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg"
                >
                  <span>{selectedAdForModal.ctaText || 'Accéder au Service'}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULL GALLERY / CATALOG OF ALL VISUAL ADS & POSTERS               */}
      {/* ========================================================================= */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsGalleryOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Panneau d'Affichage & Encart Publicitaire des Écoles
                  </h3>
                  <p className="text-xs text-slate-400">
                    Découvrez toutes les affiches officielles, événements, partenaires et bons plans scolaires
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setGalleryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  galleryFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Tous ({visualAds.length})
              </button>

              <button
                type="button"
                onClick={() => setGalleryFilter('OFFICIAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  galleryFilter === 'OFFICIAL'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Annonces Écoles
              </button>

              <button
                type="button"
                onClick={() => setGalleryFilter('EVENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  galleryFilter === 'EVENT'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Événements & Fêtes
              </button>

              <button
                type="button"
                onClick={() => setGalleryFilter('PARTNER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  galleryFilter === 'PARTNER'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Partenaires & Librairies
              </button>

              <button
                type="button"
                onClick={() => setGalleryFilter('OTHER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  galleryFilter === 'OTHER'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Divers & Activités
              </button>
            </div>

            {/* Grid of Ads */}
            <div className="overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredGalleryAds.map(ad => {
                  const itemBadge = getBadgeConfig(ad);
                  const ItemBadgeIcon = itemBadge.icon;

                  return (
                    <article
                      key={ad.id}
                      className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-md"
                    >
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        {ad.photoUrl ? (
                          <img
                            src={ad.photoUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                            <Megaphone className="w-12 h-12 opacity-30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                        <div className="absolute top-2.5 left-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow ${itemBadge.bg}`}>
                            {itemBadge.label}
                          </span>
                        </div>

                        {ad.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ url: ad.photoUrl!, title: ad.title })}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="font-black text-sm text-white line-clamp-2 leading-snug">
                            {ad.title}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {ad.content}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-bold truncate max-w-[130px]">
                            {ad.sponsorName || ad.authorName}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleShareWhatsApp(ad, e)}
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                              title="Partager WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsGalleryOpen(false);
                                setSelectedAdForModal(ad);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-xs"
                            >
                              Voir
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIGHTBOX HIGH RESOLUTION PHOTO VIEWER                           */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
            />

            <div className="mt-3 text-center">
              <h4 className="text-sm font-bold text-slate-200">
                {lightboxImage.title}
              </h4>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
