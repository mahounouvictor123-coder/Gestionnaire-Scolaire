import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { School } from '../../types';
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, ArrowRight, X, Building2, CheckCircle2 } from 'lucide-react';

interface SchoolPasswordModalProps {
  isOpen: boolean;
  school: School;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const SchoolPasswordModal: React.FC<SchoolPasswordModalProps> = ({
  isOpen,
  school,
  onSuccess,
  onCancel
}) => {
  const { unlockSchool } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Veuillez saisir le mot de passe de cet établissement.');
      return;
    }

    const success = unlockSchool(school.id, password);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        onSuccess();
      }, 600);
    } else {
      setError('Mot de passe incorrect. Veuillez vérifier le mot de passe renseigné par l\'établissement.');
    }
  };

  const handleUseDemoPassword = () => {
    const demoPwd = school.accessPassword || 'Tmp1@202';
    setPassword(demoPwd);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 p-6 text-white text-center relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-inner">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt={school.name} className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-emerald-400" />
            )}
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-400/30 mb-2">
            🔐 Espace Protégé
          </span>

          <h3 className="text-lg font-black tracking-tight text-white leading-snug line-clamp-2">
            {school.name}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Accès sécurisé réservé à cet établissement
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
              <KeyRound className="h-4 w-4 text-emerald-500" />
              <span>Saisissez le mot de passe à 8 caractères</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Les données de cet établissement (élèves, notes, finances, enseignants) sont strictement isolées et protégées par son mot de passe administrateur.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2 animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mot de passe à 8 caractères *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ex: Tmp1@202"
                className="w-full pl-4 pr-11 py-3 text-base tracking-widest font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-bold text-center"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
              <span>Longueur : {password.length}/8 caractères</span>
              {password.length === 8 && <span className="text-emerald-500 font-bold">✓ 8/8 OK</span>}
            </div>
          </div>

          {/* Demo hint for demo schools */}
          {school.isDemo && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
              <span className="text-amber-800 dark:text-amber-300 font-medium text-[11px]">
                🔑 Mot de passe Démo : <strong className="font-mono font-bold">{school.accessPassword || '12345678'}</strong>
              </span>
              <button
                type="button"
                onClick={handleUseDemoPassword}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase transition-colors"
              >
                Remplir
              </button>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSuccess}
              className={`w-full py-3.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
                isSuccess
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>MOT DE PASSE VALIDÉ ! ACCÈS AUTORISÉ</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>DÉVERROUILLER LE TABLEAU DE BORD</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Retour au portail multi-écoles
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
