import React from 'react';
import { Bus, Users, Phone } from 'lucide-react';

export const TransportView: React.FC = () => {
  const routes = [
    { id: '1', name: 'Ligne 1 - Rivera 3 & Palmeraie', driver: 'M. Ibrahim COULIBALY', phone: '+225 07 11 22 33', busNumber: 'Bus 01 (45 places)', enrolledStudents: 38 },
    { id: '2', name: 'Ligne 2 - Cocody Deux-Plateaux', driver: 'M. Antoine KOFFI', phone: '+225 05 44 55 66', busNumber: 'Bus 02 (30 places)', enrolledStudents: 26 },
    { id: '3', name: 'Ligne 3 - Marcory & Zone 4', driver: 'M. Moussa DIARRA', phone: '+225 01 77 88 99', busNumber: 'Bus 03 (50 places)', enrolledStudents: 42 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Bus className="h-6 w-6 text-blue-600" />
            <span>Transport Scolaire & Ramassage des Élèves</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lignes de bus, chauffeurs, arrêts de ramassage et élèves abonnés.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map(r => (
          <div key={r.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{r.name}</h4>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p><span className="font-bold">Véhicule:</span> {r.busNumber}</p>
              <p><span className="font-bold">Chauffeur:</span> {r.driver}</p>
              <p className="flex items-center space-x-1 text-slate-500">
                <Phone className="h-3.5 w-3.5" />
                <span>{r.phone}</span>
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold">
              <span className="text-slate-500">Élèves Transportés:</span>
              <span className="text-blue-600">{r.enrolledStudents} passagers</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
