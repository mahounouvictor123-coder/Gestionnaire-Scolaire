import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { PrintBulletinModal } from '../components/modals/PrintBulletinModal';
import { PrintReceiptModal } from '../components/modals/PrintReceiptModal';
import { HeartHandshake, FileCheck2, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

export const ParentPortalView: React.FC = () => {
  const { students, classes, payments, grades, settings } = useApp();
  
  // Simulate parent logged in with child Marc-Aurele (std-1)
  const child = students[0];
  const childClass = classes.find(c => c.id === child?.classId);
  const childPayments = payments.filter(p => p.studentId === child?.id);
  const childGrades = grades.filter(g => g.studentId === child?.id);

  const [showBulletinModal, setShowBulletinModal] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Parent Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 uppercase">
            Espace Délégué Parent
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Suivi Scolaire de {child?.firstName} {child?.lastName}
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Classe : {childClass?.name} | Matricule : {child?.registrationNumber}
          </p>
        </div>

        <button
          onClick={() => setShowBulletinModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow"
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Télécharger Bulletin Trimestriel</span>
        </button>
      </div>

      {/* Child Performance & Financial Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Child Grades */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-2">
            Dernières Notes Reçues
          </h3>
          <div className="space-y-2 text-xs">
            {childGrades.slice(0, 4).map(g => (
              <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{g.examType}</p>
                  <p className="text-[10px] text-slate-500">{g.date}</p>
                </div>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {g.mark} / 20
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Child Payments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-2">
            Situation des Frais de Scolarité
          </h3>
          <div className="space-y-2 text-xs">
            {childPayments.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex justify-between items-center">
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">Versements Effectué ({p.paymentType})</p>
                  <p className="text-[10px] text-slate-500">Reçu N° {p.receiptNumber} • {p.date}</p>
                </div>
                <span className="text-sm font-black text-emerald-600">
                  {p.amountPaid.toLocaleString()} {settings.currency}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showBulletinModal && child && (
        <PrintBulletinModal
          isOpen={showBulletinModal}
          onClose={() => setShowBulletinModal(false)}
          student={child}
          classObj={childClass || classes[0]}
          trimester={settings.currentTrimester}
        />
      )}

    </div>
  );
};
