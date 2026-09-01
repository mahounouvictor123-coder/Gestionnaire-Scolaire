import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { CalendarCheck, CheckCircle2, XCircle, Clock, Save, UserCheck } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { students, classes, saveBulkAttendance } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const classStudents = students.filter(s => s.classId === selectedClassId);
  const [statusState, setStatusState] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'RETARD' | 'JUSTIFIE'>>({});

  const setStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'RETARD' | 'JUSTIFIE') => {
    setStatusState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'PRESENT'> = {};
    classStudents.forEach(std => {
      updated[std.id] = 'PRESENT';
    });
    setStatusState(prev => ({ ...prev, ...updated }));
  };

  const handleSaveAttendance = () => {
    const records = classStudents.map(std => ({
      studentId: std.id,
      classId: selectedClassId,
      date: attendanceDate,
      status: statusState[std.id] || 'PRESENT'
    }));

    saveBulkAttendance(records);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Stats
  const presentCount = classStudents.filter(std => (statusState[std.id] || 'PRESENT') === 'PRESENT').length;
  const absentCount = classStudents.filter(std => statusState[std.id] === 'ABSENT').length;
  const retardCount = classStudents.filter(std => statusState[std.id] === 'RETARD').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarCheck className="h-6 w-6 text-blue-600" />
            <span>Registre des Présences & Discipline Quotidienne</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fiche d'appel par classe, relevé des retards et justification des absences.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 shadow-sm"
          >
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Tout Marquer Présent</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer l'Appel</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 font-bold text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Registre d'appel du {attendanceDate} enregistré avec succès dans la base de données !</span>
        </div>
      )}

      {/* Control Bar & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 text-xs col-span-2">
          <div className="flex-1 w-full">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sélection de la Classe</label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.roomNumber})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'Appel</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Live Counters */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-around text-center">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Présents</p>
            <p className="text-xl font-black text-emerald-600">{presentCount}</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase">Absents</p>
            <p className="text-xl font-black text-rose-600">{absentCount}</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase">Retards</p>
            <p className="text-xl font-black text-amber-600">{retardCount}</p>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">Élève</th>
              <th className="p-3">Matricule</th>
              <th className="p-3 text-center">Statut de Présence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {classStudents.map(std => {
              const currentStatus = statusState[std.id] || 'PRESENT';
              return (
                <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <img src={std.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                    <span>{std.lastName} {std.firstName}</span>
                  </td>
                  <td className="p-3 font-bold text-blue-600">{std.registrationNumber}</td>
                  <td className="p-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setStatus(std.id, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Présent</span>
                      </button>

                      <button
                        onClick={() => setStatus(std.id, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Absent</span>
                      </button>

                      <button
                        onClick={() => setStatus(std.id, 'RETARD')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                          currentStatus === 'RETARD'
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Retard</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

