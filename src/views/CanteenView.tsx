import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { CanteenMenuItem, CanteenPlan } from '../types';
import {
  UtensilsCrossed,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Users,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Coffee,
  Check,
  CreditCard
} from 'lucide-react';

export const CanteenView: React.FC = () => {
  const {
    canteenMenus,
    addCanteenMenu,
    updateCanteenMenu,
    deleteCanteenMenu,
    canteenPlans,
    addCanteenPlan,
    updateCanteenPlan,
    deleteCanteenPlan,
    students,
    classes,
    settings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'MENUS' | 'PLANS'>('MENUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<CanteenMenuItem | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<CanteenMenuItem | null>(null);

  const [menuForm, setMenuForm] = useState<{
    day: string;
    dish: string;
    accompaniment?: string;
    dessert?: string;
    beverage?: string;
    price?: number;
    allergens?: string;
    notes?: string;
  }>({
    day: 'Lundi',
    dish: '',
    accompaniment: 'Salade de crudités',
    dessert: 'Fruit frais de saison',
    beverage: 'Eau minérale',
    price: 1500,
    allergens: 'Aucun',
    notes: 'Préparé avec des produits locaux frais'
  });

  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CanteenPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<CanteenPlan | null>(null);

  const [planForm, setPlanForm] = useState<{
    name: string;
    studentId?: string;
    studentName?: string;
    className?: string;
    price: number;
    mealsPerWeek: number;
    description: string;
    dietaryRestrictions?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  }>({
    name: 'Forfait Complet Déjeuner',
    studentId: '',
    studentName: '',
    className: '',
    price: 25000,
    mealsPerWeek: 5,
    description: 'Repas du midi complet du Lundi au Vendredi',
    dietaryRestrictions: 'Aucune restriction',
    status: 'ACTIVE'
  });

  // Handle Menu Save
  const handleOpenCreateMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      day: 'Lundi',
      dish: '',
      accompaniment: 'Salade de crudités',
      dessert: 'Fruit frais de saison',
      beverage: 'Eau minérale',
      price: 1500,
      allergens: 'Aucun',
      notes: 'Préparé avec des produits locaux frais'
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item: CanteenMenuItem) => {
    setEditingMenu(item);
    setMenuForm({
      day: item.day,
      dish: item.dish,
      accompaniment: item.accompaniment || '',
      dessert: item.dessert || '',
      beverage: item.beverage || '',
      price: item.price || 1500,
      allergens: item.allergens || '',
      notes: item.notes || ''
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.dish.trim()) return;

    if (editingMenu) {
      updateCanteenMenu(editingMenu.id, {
        day: menuForm.day,
        dish: menuForm.dish,
        accompaniment: menuForm.accompaniment,
        dessert: menuForm.dessert,
        beverage: menuForm.beverage,
        price: Number(menuForm.price) || 0,
        allergens: menuForm.allergens,
        notes: menuForm.notes
      });
    } else {
      addCanteenMenu({
        day: menuForm.day,
        dish: menuForm.dish,
        accompaniment: menuForm.accompaniment,
        dessert: menuForm.dessert,
        beverage: menuForm.beverage,
        price: Number(menuForm.price) || 0,
        allergens: menuForm.allergens,
        notes: menuForm.notes
      });
    }

    setIsMenuModalOpen(false);
    setEditingMenu(null);
  };

  // Handle Plan Save
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    const firstStudent = students[0];
    const firstClass = classes.find(c => c.id === firstStudent?.classId);
    setPlanForm({
      name: 'Forfait Complet Déjeuner',
      studentId: firstStudent?.id || '',
      studentName: firstStudent ? `${firstStudent.firstName} ${firstStudent.lastName}` : '',
      className: firstClass ? firstClass.name : '6ème A',
      price: 25000,
      mealsPerWeek: 5,
      description: 'Repas complets du midi du Lundi au Vendredi',
      dietaryRestrictions: 'Aucune allergie signalée',
      status: 'ACTIVE'
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: CanteenPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      studentId: plan.studentId || '',
      studentName: plan.studentName || '',
      className: plan.className || '',
      price: plan.price,
      mealsPerWeek: plan.mealsPerWeek,
      description: plan.description || '',
      dietaryRestrictions: plan.dietaryRestrictions || '',
      status: plan.status || 'ACTIVE'
    });
    setIsPlanModalOpen(true);
  };

  const handlePlanStudentChange = (newStudentId: string) => {
    const std = students.find(s => s.id === newStudentId);
    if (!std) return;
    const stdClass = classes.find(c => c.id === std.classId);
    setPlanForm(prev => ({
      ...prev,
      studentId: std.id,
      studentName: `${std.firstName} ${std.lastName}`,
      className: stdClass ? stdClass.name : prev.className
    }));
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) return;

    if (editingPlan) {
      updateCanteenPlan(editingPlan.id, {
        name: planForm.name,
        studentId: planForm.studentId,
        studentName: planForm.studentName,
        className: planForm.className,
        price: Number(planForm.price) || 0,
        mealsPerWeek: Number(planForm.mealsPerWeek) || 5,
        description: planForm.description,
        dietaryRestrictions: planForm.dietaryRestrictions,
        status: planForm.status
      });
    } else {
      addCanteenPlan({
        name: planForm.name,
        studentId: planForm.studentId,
        studentName: planForm.studentName,
        className: planForm.className,
        price: Number(planForm.price) || 0,
        mealsPerWeek: Number(planForm.mealsPerWeek) || 5,
        description: planForm.description,
        dietaryRestrictions: planForm.dietaryRestrictions,
        status: planForm.status
      });
    }

    setIsPlanModalOpen(false);
    setEditingPlan(null);
  };

  // Filtered Menus
  const filteredMenus = canteenMenus.filter(m => {
    const matchesDay = selectedDayFilter === 'ALL' || m.day === selectedDayFilter;
    const matchesSearch =
      m.dish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.accompaniment && m.accompaniment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.dessert && m.dessert.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDay && matchesSearch;
  });

  // Filtered Plans
  const filteredPlans = canteenPlans.filter(p => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.studentName && p.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.className && p.className.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="space-y-6">
      {/* Top Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <UtensilsCrossed className="h-6 w-6 text-amber-500" />
            <span>Gestion de la Cantine & Restauration Scolaire</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestion complète des menus quotidiens, plats équilibrés, forfaits et abonnements repas des élèves.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'MENUS' ? (
            <button
              onClick={handleOpenCreateMenu}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-slate-950" />
              <span>Ajouter un Plat au Menu</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreatePlan}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Inscrire un Élève au Forfait</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => {
            setActiveTab('MENUS');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'MENUS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>Menus & Plats de la Semaine ({canteenMenus.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('PLANS');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'PLANS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Abonnements & Forfaits Élèves ({canteenPlans.length})</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'MENUS' ? "Rechercher plat, dessert..." : "Rechercher élève, forfait..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          />
        </div>

        {activeTab === 'MENUS' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDayFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDayFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tous les Jours
            </button>
            {daysOfWeek.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDayFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDayFilter === d
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: MENUS GRID */}
      {activeTab === 'MENUS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenus.map(m => (
            <div
              key={m.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative group hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-black text-xs uppercase tracking-wide border border-amber-200 dark:border-amber-800">
                    {m.day}
                  </span>
                  {m.price && (
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {m.price.toLocaleString()} {settings.currency || 'FCFA'}
                    </span>
                  )}
                </div>

                <h4 className="font-black text-sm text-slate-900 dark:text-white pt-1 flex items-start space-x-2">
                  <UtensilsCrossed className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{m.dish}</span>
                </h4>

                {m.accompaniment && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">Accompagnement :</strong> {m.accompaniment}
                  </p>
                )}

                {m.dessert && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">Dessert :</strong> {m.dessert}
                  </p>
                )}

                {m.beverage && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">Boisson :</strong> {m.beverage}
                  </p>
                )}

                {m.allergens && (
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    Allergènes : {m.allergens}
                  </div>
                )}
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEditMenu(m)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => setMenuToDelete(m)}
                  className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Supprimer ce plat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredMenus.length === 0 && (
            <div className="col-span-full text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <UtensilsCrossed className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Aucun plat au menu pour ces critères.
              </p>
              <button
                onClick={handleOpenCreateMenu}
                className="px-4 py-2 rounded-xl bg-amber-500 font-black text-slate-950 text-xs shadow inline-flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Créer un Plat de Cantine</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORFAITS & ABONNEMENTS */}
      {activeTab === 'PLANS' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Liste des Abonnements & Forfaits Repas ({filteredPlans.length})
              </h3>
              <p className="text-xs text-slate-500">
                Suivi des élèves souscripteurs, régimes particuliers et états de paiement cantine.
              </p>
            </div>

            <button
              onClick={handleOpenCreatePlan}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Inscrire un Élève</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Forfait</th>
                  <th className="px-4 py-3">Élève & Classe</th>
                  <th className="px-4 py-3">Fréquence & Tarif</th>
                  <th className="px-4 py-3">Régime / Allergies</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPlans.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-900 dark:text-white">{plan.name}</p>
                      <p className="text-[11px] text-slate-500">{plan.description || 'Formule repas complets'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{plan.studentName || 'Tous les élèves inscrits'}</p>
                      <p className="text-[11px] text-slate-500">Classe : {plan.className || 'Multi-niveaux'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {plan.price.toLocaleString()} {settings.currency || 'FCFA'}
                      </p>
                      <p className="text-[11px] text-slate-500">{plan.mealsPerWeek} repas / semaine</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {plan.dietaryRestrictions || 'Normal (sans restriction)'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        plan.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-600 border-rose-300'
                      }`}>
                        {plan.status === 'ACTIVE' ? 'Actif' : 'Suspendu / Expiré'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="Modifier le forfait"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPlanToDelete(plan)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Supprimer le forfait"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MENU MODAL: ADD / EDIT */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {editingMenu ? 'Modifier le Plat du Menu' : 'Nouveau Plat à la Cantine'}
                </h3>
              </div>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jour de la Semaine</label>
                  <select
                    value={menuForm.day}
                    onChange={e => setMenuForm({ ...menuForm, day: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {daysOfWeek.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prix Unitaire</label>
                  <input
                    type="number"
                    value={menuForm.price}
                    onChange={e => setMenuForm({ ...menuForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plat Principal</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Riz au Gras Poulet Braisé"
                  value={menuForm.dish}
                  onChange={e => setMenuForm({ ...menuForm, dish: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Accompagnement / Entrée</label>
                <input
                  type="text"
                  placeholder="ex: Salade de crudités & vinaigrette"
                  value={menuForm.accompaniment}
                  onChange={e => setMenuForm({ ...menuForm, accompaniment: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dessert</label>
                  <input
                    type="text"
                    placeholder="ex: Fruit de saison"
                    value={menuForm.dessert}
                    onChange={e => setMenuForm({ ...menuForm, dessert: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Boisson</label>
                  <input
                    type="text"
                    placeholder="ex: Jus de bissap"
                    value={menuForm.beverage}
                    onChange={e => setMenuForm({ ...menuForm, beverage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Allergènes & Restrictions</label>
                <input
                  type="text"
                  placeholder="ex: Contient arachides / Sans gluten"
                  value={menuForm.allergens}
                  onChange={e => setMenuForm({ ...menuForm, allergens: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-slate-950 shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-slate-950" />
                  <span>{editingMenu ? 'Mettre à Jour' : 'Enregistrer le Plat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN MODAL: ADD / EDIT */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {editingPlan ? 'Modifier le Forfait Cantine' : 'Nouvel Abonnement Cantine'}
                </h3>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Forfait</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Forfait Mensuel Complet"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Élève Bénéficiaire</label>
                <select
                  value={planForm.studentId}
                  onChange={e => handlePlanStudentChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="">-- Sélectionner un élève inscrit --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tarif (FCFA)</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Repas / Semaine</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={planForm.mealsPerWeek}
                    onChange={e => setPlanForm({ ...planForm, mealsPerWeek: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Régime / Allergies Élève</label>
                <input
                  type="text"
                  placeholder="ex: Sans porc, allergie aux arachides"
                  value={planForm.dietaryRestrictions}
                  onChange={e => setPlanForm({ ...planForm, dietaryRestrictions: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Statut du Forfait</label>
                <select
                  value={planForm.status}
                  onChange={e => setPlanForm({ ...planForm, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="ACTIVE">Actif (En règle)</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="EXPIRED">Expiré / À renouveler</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingPlan ? 'Mettre à Jour Forfait' : 'Enregistrer Forfait'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MENU MODAL */}
      {menuToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Confirmer la suppression</h4>
              <p className="text-xs text-slate-500 mt-1">
                Supprimer le plat <strong>{menuToDelete.dish}</strong> ({menuToDelete.day}) du menu ?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setMenuToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteCanteenMenu(menuToDelete.id);
                  setMenuToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-xs text-white shadow"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PLAN MODAL */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Confirmer la suppression</h4>
              <p className="text-xs text-slate-500 mt-1">
                Supprimer le forfait <strong>{planToDelete.name}</strong> pour l'élève <strong>{planToDelete.studentName}</strong> ?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteCanteenPlan(planToDelete.id);
                  setPlanToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-xs text-white shadow"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
