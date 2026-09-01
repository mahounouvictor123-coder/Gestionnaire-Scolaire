import React from 'react';
import { useApp } from '../lib/store';

interface SchoolLogoProps {
  variant?: 'full' | 'header' | 'badge' | 'inline' | 'print';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  variant = 'header',
  className = '',
  size = 'md'
}) => {
  const { currentSchool, settings } = useApp();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-20 w-20',
    xl: 'h-32 w-32'
  };

  const hasCustomLogo = Boolean(
    settings.logoUrl && 
    !settings.logoUrl.includes('/icon.svg') && 
    !settings.logoUrl.includes('unsplash')
  );

  // Official 3D Shield Badge for GESTIONNAIRE SCOLAIRE
  const renderOfficialLogo = (badgeSize = 'h-12 w-12') => (
    <div className={`relative flex items-center justify-center shrink-0 ${badgeSize}`}>
      <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="goldGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="30%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          <linearGradient id="shieldGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="40%" stopColor="#1D4ED8" />
            <stop offset="80%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>

          <linearGradient id="blueArcL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="greenArcL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>

        <g transform="translate(0, -10)">
          {/* Blue Arc */}
          <path d="M 120 280 C 80 160 180 60 330 65 C 380 67 400 80 370 95 C 230 90 130 180 155 285 Z" fill="url(#blueArcL)" />
          {/* Green Arc */}
          <path d="M 390 220 C 430 330 340 430 180 430 C 130 430 110 415 140 400 C 270 405 380 320 355 215 Z" fill="url(#greenArcL)" />

          {/* Gold Shield */}
          <path d="M 256 75 C 330 100 375 110 380 180 C 380 290 320 370 256 415 C 192 370 132 290 132 180 C 137 110 182 100 256 75 Z" fill="url(#goldGradL)" />
          {/* Inner Blue Shield */}
          <path d="M 256 92 C 318 114 358 122 362 182 C 362 278 310 350 256 392 C 202 350 150 278 150 182 C 154 122 194 114 256 92 Z" fill="url(#shieldGradL)" />

          {/* Mortarboard */}
          <polygon points="256,120 325,145 256,170 187,145" fill="#0284C7" stroke="#FFFFFF" strokeWidth="3" />
          <polygon points="256,124 315,145 256,164 197,145" fill="#1E3A8A" />
          <path d="M 215 158 L 215 180 C 215 192 297 192 297 180 L 297 158 Z" fill="#0F172A" />
          <circle cx="256" cy="145" r="4" fill="#FDE047" />
          <path d="M 256 145 C 285 150 305 165 308 185" fill="none" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />

          {/* Open Book */}
          <path d="M 256 265 C 220 240 180 245 165 255 L 165 200 C 185 190 225 188 256 210 Z" fill="#FFFFFF" />
          <path d="M 256 265 C 292 240 332 245 347 255 L 347 200 C 327 190 287 188 256 210 Z" fill="#F8FAFC" />
          <path d="M 165 255 C 180 245 220 240 256 265 C 292 240 332 245 347 255" fill="none" stroke="#0284C7" strokeWidth="3" />

          {/* Avatars */}
          <circle cx="256" cy="292" r="16" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M 230 342 C 230 315 282 315 282 342 Z" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="212" cy="305" r="13" fill="#4ADE80" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M 190 346 C 190 325 234 325 234 346 Z" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="300" cy="305" r="13" fill="#4ADE80" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M 278 346 C 278 325 322 325 322 346 Z" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );

  const renderCustomSchoolLogo = (badgeSize = 'h-11 w-11') => (
    <div className={`relative flex items-center justify-center shrink-0 ${badgeSize}`}>
      <img
        src={settings.logoUrl || currentSchool?.logoUrl || "/icon.svg"}
        alt={settings.schoolName || currentSchool?.name}
        className="h-full w-full rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md bg-white"
      />
    </div>
  );

  const renderBadge = (sz = sizeClasses[size] || 'h-10 w-10') => {
    return hasCustomLogo ? renderCustomSchoolLogo(sz) : renderOfficialLogo(sz);
  };

  // Variant: Badge only
  if (variant === 'badge') {
    return renderBadge();
  }

  // Variant: Inline header logo
  if (variant === 'inline' || variant === 'header') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {renderBadge('h-10 w-10 sm:h-11 sm:w-11')}
        <div className="flex flex-col justify-center min-w-0">
          <div className="leading-tight">
            <span className="font-black text-xs sm:text-sm text-slate-950 dark:text-blue-300 tracking-tight uppercase line-clamp-1">
              GESTIONNAIRE SCOLAIRE
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase mt-0.5 line-clamp-1">
            {settings.schoolName || currentSchool?.name || 'ÉTABLISSEMENT SCOLAIRE'}
          </p>
        </div>
      </div>
    );
  }

  // Variant: Full showcase logo
  return (
    <div className={`flex flex-col items-center text-center p-4 ${className}`}>
      {renderBadge('h-24 w-24 sm:h-32 sm:w-32')}

      <div className="mt-3 space-y-1">
        <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          GESTIONNAIRE SCOLAIRE
        </h1>
        
        <div className="flex items-center justify-center space-x-2 my-1">
          <div className="h-0.5 w-6 bg-emerald-600 rounded-full" />
          <span className="text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-400 tracking-widest uppercase">
            {settings.schoolName || currentSchool?.name || 'PLATEFORME ÉDUCATIVE'}
          </span>
          <div className="h-0.5 w-6 bg-emerald-600 rounded-full" />
        </div>

        <p className="text-xs font-extrabold text-blue-900 dark:text-blue-300 tracking-wider italic">
          « {settings.motto || currentSchool?.motto || 'Discipline • Travail • Rigueur'} »
        </p>
      </div>
    </div>
  );
};
