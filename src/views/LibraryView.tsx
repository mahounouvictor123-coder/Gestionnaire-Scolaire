import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Book, BookLoan } from '../types';
import {
  BookMarked,
  Search,
  Plus,
  X,
  CheckCircle2,
  BookOpen,
  Edit3,
  Trash2,
  RotateCcw,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  BookmarkCheck,
  Check
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const {
    books,
    addBook,
    updateBook,
    deleteBook,
    bookLoans,
    addBookLoan,
    updateBookLoan,
    deleteBookLoan,
    returnBookLoan,
    students,
    classes
  } = useApp();

  const [activeTab, setActiveTab] = useState<'BOOKS' | 'LOANS'>('BOOKS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Book Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [bookForm, setBookForm] = useState<{
    title: string;
    author: string;
    category: string;
    isbn: string;
    shelfLocation?: string;
    totalCopies: number;
    availableCopies: number;
  }>({
    title: '',
    author: '',
    category: 'Littérature Africaine',
    isbn: '978-2-000000',
    shelfLocation: 'Rayon A-1',
    totalCopies: 20,
    availableCopies: 20
  });

  // Loan Modal State
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<BookLoan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<BookLoan | null>(null);

  const [loanForm, setLoanForm] = useState<{
    bookId: string;
    bookTitle: string;
    studentId: string;
    studentName: string;
    studentClass?: string;
    loanDate: string;
    dueDate: string;
    status: 'EN_COURS' | 'RETOURNE' | 'EN_RETARD';
    notes?: string;
  }>({
    bookId: '',
    bookTitle: '',
    studentId: '',
    studentName: '',
    studentClass: '',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'EN_COURS',
    notes: 'Manuel scolaire remis en bon état'
  });

  // Book Handlers
  const handleOpenCreateBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      category: 'Littérature Africaine',
      isbn: `978-2-${Math.floor(100000 + Math.random() * 900000)}`,
      shelfLocation: 'Rayon A-1',
      totalCopies: 15,
      availableCopies: 15
    });
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn || '',
      shelfLocation: book.shelfLocation || 'Rayon A-1',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies
    });
    setIsBookModalOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim()) return;

    if (editingBook) {
      updateBook(editingBook.id, {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        isbn: bookForm.isbn,
        shelfLocation: bookForm.shelfLocation,
        totalCopies: Number(bookForm.totalCopies) || 1,
        availableCopies: Number(bookForm.availableCopies) || 0
      });
    } else {
      addBook({
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        isbn: bookForm.isbn,
        shelfLocation: bookForm.shelfLocation,
        totalCopies: Number(bookForm.totalCopies) || 1,
        availableCopies: Number(bookForm.availableCopies) || Number(bookForm.totalCopies) || 1
      });
    }

    setIsBookModalOpen(false);
    setEditingBook(null);
  };

  // Loan Handlers
  const handleOpenCreateLoan = (targetBook?: Book) => {
    setEditingLoan(null);
    const firstBook = targetBook || books[0];
    const firstStudent = students[0];
    const stdClass = classes.find(c => c.id === firstStudent?.classId);
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setLoanForm({
      bookId: firstBook?.id || '',
      bookTitle: firstBook?.title || '',
      studentId: firstStudent?.id || '',
      studentName: firstStudent ? `${firstStudent.firstName} ${firstStudent.lastName}` : '',
      studentClass: stdClass ? stdClass.name : '6ème A',
      loanDate: today,
      dueDate: due,
      status: 'EN_COURS',
      notes: 'Manuel prêté pour 14 jours'
    });
    setIsLoanModalOpen(true);
  };

  const handleOpenEditLoan = (loan: BookLoan) => {
    setEditingLoan(loan);
    setLoanForm({
      bookId: loan.bookId,
      bookTitle: loan.bookTitle,
      studentId: loan.studentId,
      studentName: loan.studentName,
      studentClass: loan.studentClass || '',
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      status: loan.status,
      notes: loan.notes || ''
    });
    setIsLoanModalOpen(true);
  };

  const handleLoanStudentChange = (newStudentId: string) => {
    const std = students.find(s => s.id === newStudentId);
    if (!std) return;
    const stdClass = classes.find(c => c.id === std.classId);
    setLoanForm(prev => ({
      ...prev,
      studentId: std.id,
      studentName: `${std.firstName} ${std.lastName}`,
      studentClass: stdClass ? stdClass.name : prev.studentClass
    }));
  };

  const handleLoanBookChange = (newBookId: string) => {
    const bk = books.find(b => b.id === newBookId);
    if (!bk) return;
    setLoanForm(prev => ({
      ...prev,
      bookId: bk.id,
      bookTitle: bk.title
    }));
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.bookTitle || !loanForm.studentName) return;

    if (editingLoan) {
      updateBookLoan(editingLoan.id, {
        bookId: loanForm.bookId,
        bookTitle: loanForm.bookTitle,
        studentId: loanForm.studentId,
        studentName: loanForm.studentName,
        studentClass: loanForm.studentClass,
        loanDate: loanForm.loanDate,
        dueDate: loanForm.dueDate,
        status: loanForm.status,
        notes: loanForm.notes
      });
    } else {
      addBookLoan({
        bookId: loanForm.bookId,
        bookTitle: loanForm.bookTitle,
        studentId: loanForm.studentId,
        studentName: loanForm.studentName,
        studentClass: loanForm.studentClass,
        loanDate: loanForm.loanDate,
        dueDate: loanForm.dueDate,
        status: loanForm.status,
        notes: loanForm.notes
      });
    }

    setIsLoanModalOpen(false);
    setEditingLoan(null);
  };

  // Filtered Books
  const filteredBooks = books.filter(b => {
    const matchesCat = selectedCategoryFilter === 'ALL' || b.category === selectedCategoryFilter;
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered Loans
  const filteredLoans = bookLoans.filter(l => {
    return (
      l.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.studentClass && l.studentClass.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const categories = [
    'Littérature Africaine',
    'Manuels Scolaires',
    'Théâtre Classique',
    'Sciences & Maths',
    'Histoire & Géo',
    'Romans & Contes'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookMarked className="h-6 w-6 text-emerald-600" />
            <span>Bibliothèque Scolaire & Prêts de Livres</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestion du fonds documentaire, catalogage des manuels, prêts et retours des élèves.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'BOOKS' ? (
            <button
              onClick={handleOpenCreateBook}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un Ouvrage</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenCreateLoan()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Prêt Élève</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => {
            setActiveTab('BOOKS');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'BOOKS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Catalogue des Livres ({books.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('LOANS');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'LOANS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Prêts & Emprunts Actifs ({bookLoans.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'BOOKS' ? "Rechercher titre, auteur, ISBN..." : "Rechercher élève, livre prêté..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          />
        </div>

        {activeTab === 'BOOKS' && (
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm"
          >
            <option value="ALL">Toutes les Catégories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* TAB 1: BOOKS GRID */}
      {activeTab === 'BOOKS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map(b => (
            <div
              key={b.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative group hover:border-emerald-500 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    {b.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {b.shelfLocation || 'Rayon Général'}
                  </span>
                </div>

                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-start space-x-2 pt-1">
                  <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{b.title}</span>
                </h4>

                <p className="text-xs text-slate-500 font-medium">
                  Auteur : <span className="font-bold text-slate-800 dark:text-slate-200">{b.author}</span>
                </p>

                {b.isbn && (
                  <p className="text-[11px] text-slate-400 font-mono">ISBN: {b.isbn}</p>
                )}

                <div className="pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Total : {b.totalCopies}</span>
                  <span className={b.availableCopies > 0 ? "text-emerald-600 font-extrabold" : "text-rose-600 font-extrabold"}>
                    Disponibles : {b.availableCopies}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit, Loan, Delete */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenCreateLoan(b)}
                  disabled={b.availableCopies <= 0}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 disabled:opacity-40 hover:bg-blue-100 text-xs font-bold flex items-center space-x-1"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span>Prêter</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditBook(b)}
                    className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Modifier l'ouvrage"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setBookToDelete(b)}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Supprimer l'ouvrage"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredBooks.length === 0 && (
            <div className="col-span-full text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <BookMarked className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Aucun ouvrage trouvé dans le catalogue.
              </p>
              <button
                onClick={handleOpenCreateBook}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow inline-flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un Livre</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOANS LIST */}
      {activeTab === 'LOANS' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Suivi des Prêts et Emprunts ({filteredLoans.length})
              </h3>
              <p className="text-xs text-slate-500">
                Gérez les emprunts d'ouvrages par les élèves, dates limites et retours de livres.
              </p>
            </div>

            <button
              onClick={() => handleOpenCreateLoan()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Prêt</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Livre Emprunté</th>
                  <th className="px-4 py-3">Élève & Classe</th>
                  <th className="px-4 py-3">Date Prêt</th>
                  <th className="px-4 py-3">Date Limite Retour</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-900 dark:text-white">{loan.bookTitle}</p>
                      <p className="text-[11px] text-slate-500">{loan.notes || 'Prêt standard'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{loan.studentName}</p>
                      <p className="text-[11px] text-slate-500">Classe : {loan.studentClass || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                      {loan.loanDate}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                      {loan.dueDate}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        loan.status === 'RETOURNE'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-300'
                          : loan.status === 'EN_RETARD'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 border-rose-300'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-300'
                      }`}>
                        {loan.status === 'RETOURNE' ? 'Retourné' : loan.status === 'EN_RETARD' ? 'En Retard' : 'En Cours'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {loan.status !== 'RETOURNE' && (
                          <button
                            onClick={() => returnBookLoan(loan.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center space-x-1"
                            title="Marquer comme retourné"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Retourner</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditLoan(loan)}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="Modifier le prêt"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setLoanToDelete(loan)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Supprimer l'emprunt"
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

      {/* BOOK MODAL: CREATE & EDIT */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <BookMarked className="h-5 w-5" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {editingBook ? 'Modifier le Livre' : 'Nouveau Livre au Catalogue'}
                </h3>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titre de l'Ouvrage</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Sous l'orage"
                  value={bookForm.title}
                  onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Auteur</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Seydou Badian"
                  value={bookForm.author}
                  onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                  <select
                    value={bookForm.category}
                    onChange={e => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rayon / Emplacement</label>
                  <input
                    type="text"
                    placeholder="Rayon B-3"
                    value={bookForm.shelfLocation}
                    onChange={e => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Exemplaires Totaux</label>
                  <input
                    type="number"
                    min={1}
                    value={bookForm.totalCopies}
                    onChange={e => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Exemplaires Disponibles</label>
                  <input
                    type="number"
                    min={0}
                    value={bookForm.availableCopies}
                    onChange={e => setBookForm({ ...bookForm, availableCopies: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code ISBN</label>
                <input
                  type="text"
                  value={bookForm.isbn}
                  onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingBook ? 'Mettre à Jour le Livre' : 'Enregistrer le Livre'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOAN MODAL: CREATE & EDIT */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {editingLoan ? 'Modifier le Prêt' : 'Enregistrer un Emprunt'}
                </h3>
              </div>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ouvrage à Emprunter</label>
                <select
                  value={loanForm.bookId}
                  onChange={e => handleLoanBookChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="">-- Choisir un livre disponible --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author}) - {b.availableCopies} dispo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Élève Emprunteur</label>
                <select
                  value={loanForm.studentId}
                  onChange={e => handleLoanStudentChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="">-- Choisir un élève --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'Emprunt</label>
                  <input
                    type="date"
                    value={loanForm.loanDate}
                    onChange={e => setLoanForm({ ...loanForm, loanDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date Limite Retour</label>
                  <input
                    type="date"
                    value={loanForm.dueDate}
                    onChange={e => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Statut du Prêt</label>
                <select
                  value={loanForm.status}
                  onChange={e => setLoanForm({ ...loanForm, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="EN_COURS">En Cours</option>
                  <option value="RETOURNE">Retourné</option>
                  <option value="EN_RETARD">En Retard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / État du Livre</label>
                <input
                  type="text"
                  placeholder="ex: Livre en très bon état"
                  value={loanForm.notes}
                  onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-extrabold text-white shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingLoan ? 'Mettre à Jour Prêt' : 'Enregistrer le Prêt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BOOK MODAL */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Confirmer la suppression</h4>
              <p className="text-xs text-slate-500 mt-1">
                Êtes-vous sûr de vouloir supprimer l'ouvrage <strong>{bookToDelete.title}</strong> de {bookToDelete.author} ?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteBook(bookToDelete.id);
                  setBookToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-xs text-white shadow"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE LOAN MODAL */}
      {loanToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Confirmer la suppression</h4>
              <p className="text-xs text-slate-500 mt-1">
                Supprimer l'emprunt de <strong>{loanToDelete.bookTitle}</strong> par l'élève <strong>{loanToDelete.studentName}</strong> ?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setLoanToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteBookLoan(loanToDelete.id);
                  setLoanToDelete(null);
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
