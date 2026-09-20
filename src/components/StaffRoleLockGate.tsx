import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { StaffRoleType, StaffRoleConfig } from '../types';
import { defaultStaffRolePermissions } from '../data/initialData';
import { SchoolLogo } from './SchoolLogo';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  CalendarCheck,
  Wallet,
  FileText,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface StaffRoleLockGateProps {
  schoolId: string;
  role: StaffRoleType;
  staffName?: string;
  onUnlockSuccess: (staffUser: any) => void;
  onCancelToLanding: () => void;
}

const ROLE_THEMES: Record<StaffRoleType, {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  gradient: string;
  badgeBg: string;
  borderAccent: string;
  btnBg: string;
  avatar: string;
}> = {
  CENSEUR: {
    label: 'Espace Censeur / Dir. Études',
    sublabel: 'Pédagogie, Examens, Bulletins & Notes',
    icon: GraduationCap,
    gradient: 'from-cyan-900 via-blue-950 to-slate-900',
    badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    borderAccent: 'border-cyan-500/40',
    btnBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
  },
  SURVEILLANT: {
    label: 'Espace Surveillant Général',
    sublabel: 'Discipline, Présences, Retards & Vie Scolaire',
    icon: CalendarCheck,
    gradient: 'from-purple-900 via-indigo-950 to-slate-900',
    badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    borderAccent: 'border-purple-500/40',
    btnBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
  },
  COMPTABLE: {
    label: 'Espace Comptable / Économe',
    sublabel: 'Frais de Scolarité, Caisse & Trésorerie',
    icon: Wallet,
    gradient: 'from-emerald-900 via-teal-950 to-slate-900',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    borderAccent: 'border-emerald-500/40',
    btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
  },
  SECRETAIRE: {
    label: 'Espace Secrétariat Administratif',
    sublabel: 'Inscriptions, Fiches Élèves & Scan OCR Listes',
    icon: FileText,
    gradient: 'from-amber-900 via-orange-950 to-slate-900',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    borderAccent: 'border-amber-500/40',
    btnBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
  },
  DIRECTEUR: {
    label: 'Espace Direction Générale',
    sublabel: 'Supervision Totale & Paramètres',
    icon: ShieldCheck,
    gradient: 'from-blue-900 via-indigo-950 to-slate-900',
    badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    borderAccent: 'border-blue-500/40',
    btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
  }
};

export const StaffRoleLockGate: React.FC<StaffRoleLockGateProps> = ({
  schoolId,
  role,
  staffName,
  onUnlockSuccess,
  onCancelToLanding
}) => {
  const { schools, currentSchool, settings } = useApp();
  const [inputCode, setInputCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const targetSchool = schools.find(s => s.id === schoolId) || currentSchool;
  const roleTheme = ROLE_THEMES[role] || ROLE_THEMES.CENSEUR;
  const RoleIcon = roleTheme.icon;

  // Retrieve configured permissions and codes for this school
  const staffConfigs: StaffRoleConfig[] = targetSchool?.staffRolePermissions || settings.staffRolePermissions || defaultStaffRolePermissions;
  const roleConfig = staffConfigs.find(s => s.role === role) || defaultStaffRolePermissions.find(d => d.role === role);

  const assignedTitulaire = staffName || roleConfig?.assignedTo || (
    role === 'CENSEUR' ? 'M. Le Censeur' :
    role === 'SURVEILLANT' ? 'M. Le Surveillant Général' :
    role === 'COMPTABLE' ? 'Mme / M. Le Comptable' :
    role === 'SECRETAIRE' ? 'Secrétariat Général' :
    'Direction Générale'
  );

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = inputCode.trim();
    if (!cleanInput) {
      setError('Veuillez renseigner votre Code Secret pour déverrouiller votre tableau de bord.');
      return;
    }

    setIsVerifying(true);

    const expectedCode = (roleConfig?.accessCode || '').trim();
    const schoolMasterPwd = (targetSchool.accessPassword || '12345678').trim();

    // Check match against role access code or master school password
    const isMatch = (expectedCode && cleanInput.toUpperCase() === expectedCode.toUpperCase()) ||
                    (schoolMasterPwd && cleanInput === schoolMasterPwd);

    setTimeout(() => {
      setIsVerifying(false);

      if (isMatch) {
        setIsSuccess(true);

        const staffUser = {
          id: `usr-${role.toLowerCase()}-${Date.now()}`,
          name: assignedTitulaire,
          email: roleConfig?.email || `${role.toLowerCase()}@${targetSchool.id.toLowerCase()}.educ`,
          role: role,
          schoolName: targetSchool.name,
          avatar: roleTheme.avatar
        };

        // Persist session verification in storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`STAFF_VERIFIED_${schoolId}_${role}`, 'true');
          sessionStorage.setItem(`STAFF_VERIFIED_NAME_${schoolId}_${role}`, assignedTitulaire);
        }

        setTimeout(() => {
          onUnlockSuccess(staffUser);
        }, 600);
      } else {
        setError(
          `Code secret invalide pour ${roleTheme.label}. Le tableau de bord reste confidentiel et verrouillé. Veuillez vérifier le code exact fourni par votre Directeur.`
        );
      }
    }, 350);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className={`w-full max-w-xl rounded-3xl bg-gradient-to-b ${roleTheme.gradient} text-white border-2 ${roleTheme.borderAccent} shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative`}>
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* School Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <SchoolLogo variant="badge" size="md" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Établissement Scolaire Officiel
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate max-w-xs sm:max-w-md">
                {targetSchool?.name || settings.schoolName}
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                {targetSchool?.city || settings.city || 'Bénin'} • Année {targetSchool?.academicYear || settings.academicYear || '2025-2026'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white shadow-inner hidden sm:flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-300" />
          </div>
        </div>

        {/* Role Identity Badge */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-white/15 border border-white/20">
              <RoleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${roleTheme.badgeBg}`}>
                  Poste Cloisonné
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {roleTheme.label}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Titulaire : <strong className="text-white">{assignedTitulaire}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 space-y-1.5">
          <div className="flex items-center space-x-2 font-black text-amber-300 text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Verrouillage de Sécurité Actif</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-100 font-medium">
            Tant que vous n'avez pas renseigné votre <strong>Code Secret personnel</strong> défini par la Direction, le tableau de bord et les fenêtres de travail restent <strong>strictement inaccessibles</strong>.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Code Secret Personnel :</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                (fourni par le Directeur)
              </span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: CENS-3021, SURV-4410, SEC-1490..."
                className="w-full py-3.5 pl-4 pr-12 rounded-xl bg-slate-950/80 border-2 border-white/20 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-sm tracking-wider outline-none transition-all"
                autoFocus
                autoComplete="off"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Masquer le code' : 'Afficher le code'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-xs text-rose-200 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">✓ Code Secret vérifié avec succès ! Ouverture de votre espace...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || isSuccess}
            className={`w-full py-4 rounded-xl text-white font-black text-sm shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${roleTheme.btnBg} ${
              (isVerifying || isSuccess) ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
            }`}
          >
            {isVerifying ? (
              <span>Vérification du code secret...</span>
            ) : isSuccess ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Espace Déverrouillé !</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Unlock className="w-4 h-4 text-white" />
                <span>Déverrouiller & Ouvrir Mon Tableau de Bord</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            )}
          </button>
        </form>

        {/* Footer info & Cancel */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={onCancelToLanding}
            className="text-slate-300 hover:text-white underline flex items-center space-x-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retourner à l'accueil général</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Cloisonnement Strict Sécurisé
          </span>
        </div>

      </div>
    </div>
  );
};
