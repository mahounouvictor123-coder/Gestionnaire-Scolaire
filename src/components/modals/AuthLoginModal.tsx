import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { SchoolLogo } from '../SchoolLogo';
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  X,
  UserCheck,
  KeyRound,
  LogIn
} from 'lucide-react';
import { UserRole } from '../../types';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateSchoolModal?: () => void;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateSchoolModal
}) => {
  const {
    schools,
    currentSchool,
    currentSchoolId,
    switchSchool,
    loginUser,
    switchRole,
    hasCreatedSchool
  } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DIRECTEUR');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchoolId);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim()) {
      setErrorMessage('Veuillez saisir votre adresse e-mail.');
      return;
    }

    loginUser(
      emailInput.trim(),
      undefined,
      selectedRole,
      selectedSchoolId
    );

    setSuccessMessage('Connexion réussie ! Chargement de votre espace...');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 700);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setSelectedRole(role);
    switchRole(role);
    const roleEmail = role === 'SUPER_ADMIN' 
      ? 'mahounouvictor123@gmail.com' 
      : `${role.toLowerCase()}@${currentSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`;
    loginUser(roleEmail, undefined, role, currentSchoolId);
    setSuccessMessage(`Connecté en tant que ${role} !`);
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
              <LogIn className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-extrabold uppercase border border-emerald-400/30">
                Portail Authentification
              </span>
              <h3 className="text-xl font-black text-white mt-1">Connexion Utilisateur</h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Accédez à votre espace sécurisé de gestion scolaire
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">

          {successMessage ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="inline-flex p-3 bg-emerald-500 text-white rounded-full shadow-lg">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                {successMessage}
              </h4>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1-CLICK SOCIAL LOGINS (Google, Gmail, Apple) */}
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                  Inscription / Connexion Rapide (En 1-Clic) :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Google / Gmail */}
                  <button
                    type="button"
                    onClick={() => {
                      loginUser('directeur.google@gmail.com', 'Directeur (Google Auth)', 'DIRECTEUR', currentSchoolId);
                      setSuccessMessage('Connecté avec succès via Google / Gmail !');
                      setTimeout(() => {
                        setSuccessMessage('');
                        onClose();
                      }, 600);
                    }}
                    className="py-3 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 text-xs font-black flex items-center justify-center space-x-2.5 shadow-sm transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continuer avec Google / Gmail</span>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => {
                      loginUser('directeur.apple@icloud.com', 'Directeur (Apple Auth)', 'DIRECTEUR', currentSchoolId);
                      setSuccessMessage('Connecté avec succès via Apple ID !');
                      setTimeout(() => {
                        setSuccessMessage('');
                        onClose();
                      }, 600);
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white border border-slate-800 text-xs font-black flex items-center justify-center space-x-2.5 shadow-sm transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.33.13-9.13-1.9-14.42-6.08-3.69-3.04-7.66-7.85-11.91-14.43-8.8-13.62-15.12-28.52-18.96-44.7-3.83-16.18-5.75-31.54-5.75-46.08 0-18.82 4.67-34.1 14.01-45.85 9.34-11.75 21.08-17.72 35.22-17.92 4.45 0 9.53 1.14 15.24 3.42 5.71 2.28 9.68 3.42 11.91 3.42 2.01 0 5.92-1.11 11.74-3.32 5.82-2.21 10.87-3.26 15.15-3.15 11.03.43 20.5 4.3 28.42 11.61 5.91 5.43 10.27 11.89 13.08 19.38-10.8 6.53-16.09 15.66-15.87 27.39.22 9.13 3.69 16.74 10.42 22.83 6.73 6.09 14.78 9.57 24.15 10.44-2.12 6.31-4.78 12.51-7.98 18.6zM119.22 31.84c0-7.39 2.72-14.62 8.16-21.69 5.44-7.07 12.35-11.2 20.73-12.39.22 1.09.33 2.07.33 2.94 0 7.39-2.77 14.62-8.32 21.69-5.55 7.07-12.45 11.1-20.7 12.1-0.11-.87-0.2-1.75-0.2-2.65z"/>
                    </svg>
                    <span>Continuer avec Apple</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Ou avec e-mail & mot de passe</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                
                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* School Selector / Dedicated School Display */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Établissement Scolaire</span>
                  </label>
                  {localStorage.getItem('GESTIONNAIRE_PROMOTER_AUTH') === 'true' ? (
                    <select
                      value={selectedSchoolId}
                      onChange={e => setSelectedSchoolId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>
                          🏫 {sch.name} ({sch.city || 'Bénin'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                      <img
                        src={currentSchool?.logoUrl}
                        alt={currentSchool?.name}
                        className="h-7 w-7 rounded-lg object-cover bg-white shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {currentSchool?.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {currentSchool?.city} • {currentSchool?.officialCode || 'Bénin'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Profil Utilisateur</span>
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SUPER_ADMIN">👑 Promoteur Network</option>
                    <option value="DIRECTEUR">🏢 Directeur / Administrateur Général</option>
                    <option value="SECRETAIRE">📝 Secrétaire Administrative</option>
                    <option value="COMPTABLE">💰 Comptable / Gestionnaire Financier</option>
                    <option value="ENSEIGNANT">👨‍🏫 Enseignant / Professeur</option>
                    <option value="PARENT">👨‍👩‍👧 Parent d'Élève</option>
                    <option value="ELEVE">🎓 Élève / Étudiant</option>
                  </select>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Mail className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Adresse E-mail</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="monadresse@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Mot de Passe</span>
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <span>Connexion au Compte</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

              </form>

              {/* CREATE MY SCHOOL EXPLICIT CALLOUT - Only show if no school created yet */}
              {onOpenCreateSchoolModal && !hasCreatedSchool && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/40 text-white space-y-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Vous êtes Directeur ou Fondateur ?
                        </h4>
                        <p className="text-[11px] text-emerald-200/90 font-medium">
                          Cliquez sur le bouton ci-dessous pour renseigner le nom, la ville et les détails de votre école.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCreateSchoolModal();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-slate-950" />
                      <span>🏫 CRÉER MON ÉCOLE (Saisir le nom & détails)</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Quick Preset Login Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Connexion Rapide par Rôle (Accès Démo Instantané) :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickDemoLogin('SUPER_ADMIN')}
                className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-left transition-all text-xs font-bold"
              >
                👑 Promoteur
              </button>
              <button
                onClick={() => handleQuickDemoLogin('DIRECTEUR')}
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-left transition-all text-xs font-bold"
              >
                🏢 Directeur
              </button>
              <button
                onClick={() => handleQuickDemoLogin('ENSEIGNANT')}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-left transition-all text-xs font-bold"
              >
                👨‍🏫 Enseignant
              </button>
              <button
                onClick={() => handleQuickDemoLogin('PARENT')}
                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-left transition-all text-xs font-bold"
              >
                👨‍👩‍👧 Parent
              </button>
            </div>
          </div>

          {/* Create school prompt - Only show if no school created yet */}
          {onOpenCreateSchoolModal && !hasCreatedSchool && (
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Votre établissement n'est pas encore enregistré ?{' '}
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateSchoolModal();
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
                >
                  Créer un compte école
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
