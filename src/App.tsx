import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Terminal,
  Database,
  Server,
  FolderTree,
  AlertCircle,
  X,
  Tag,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';
  entryCount?: number;
  createdAt: string;
}

interface LessonItem {
  _id: string;
  categoryId: string;
  title: string;
  description: string;
  tags?: string[];
  createdAt: string;
}

interface DBStatus {
  mode: 'mongodb' | 'memory';
  isConnected: boolean;
  connectionState: string;
  hasMongoURI: boolean;
  error?: string | null;
}

const COLOR_CONFIGS: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
    gradient: string;
    ring: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    gradient: 'from-indigo-600 to-indigo-800',
    ring: 'ring-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    gradient: 'from-emerald-600 to-teal-800',
    ring: 'ring-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    gradient: 'from-amber-500 to-orange-700',
    ring: 'ring-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    gradient: 'from-rose-600 to-pink-800',
    ring: 'ring-rose-600',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    gradient: 'from-sky-500 to-blue-700',
    ring: 'ring-sky-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-600 to-indigo-800',
    ring: 'ring-purple-600',
  },
};

const AVAILABLE_ICONS = ['💡', '🛠️', '⚡', '📖', '🎯', '🧠', '🚀', '💎', '🔑', '🛡️', '⚙️', '🌟'];

export default function App() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'category' | 'lesson';
    id: string;
    title: string;
  } | null>(null);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple'>('indigo');
  const [newCatIcon, setNewCatIcon] = useState('💡');

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonTags, setNewLessonTags] = useState('');

  // Spec Drawer
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState<'schemas' | 'routes' | 'structure' | 'setup' | 'vercel'>('schemas');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Initial Fetch with safe JSON parsing (prevents syntax error if serverless route returns 404 HTML)
  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, lessonsRes, healthRes] = await Promise.all([
        fetch('/api/categories').catch(() => null),
        fetch('/api/lessons').catch(() => null),
        fetch('/api/health').catch(() => null),
      ]);

      const parseJsonSafe = async (res: Response | null) => {
        if (!res || !res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          if (text.trim().startsWith('<')) {
            console.warn(
              'API returned HTML instead of JSON. Ensure vercel.json is present in the repository root to route /api/* requests to server.ts.'
            );
          }
          return null;
        }
        return await res.json();
      };

      const catData = await parseJsonSafe(catsRes);
      if (catData) setCategories(catData);

      const lessonData = await parseJsonSafe(lessonsRes);
      if (lessonData) setLessons(lessonData);

      const healthData = await parseJsonSafe(healthRes);
      if (healthData) setDbStatus(healthData.database);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Active Category Object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c._id === activeCategoryId) || null;
  }, [categories, activeCategoryId]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Filtered lessons for active category (or search)
  const currentLessons = useMemo(() => {
    if (!activeCategoryId) return [];
    return lessons.filter((l) => {
      const matchesCat = l.categoryId === activeCategoryId;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchDesc = l.description.toLowerCase().includes(q);
      const matchTags = l.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchTags;
    });
  }, [lessons, activeCategoryId, searchQuery]);

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          icon: newCatIcon,
          color: newCatColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create category');
      }

      const created = await res.json();
      setCategories((prev) => [created, ...prev]);
      setIsCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      showToast(`Category "${created.name}" created!`);
    } catch (error: any) {
      showToast(error.message || 'Error creating category', true);
    }
  };

  // Create Lesson Handler
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId || !newLessonTitle.trim() || !newLessonDesc.trim()) return;

    try {
      const tagsArray = newLessonTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: activeCategoryId,
          title: newLessonTitle.trim(),
          description: newLessonDesc.trim(),
          tags: tagsArray,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to log lesson');
      }

      const created = await res.json();
      setLessons((prev) => [created, ...prev]);
      // Update entryCount in categories
      setCategories((prev) =>
        prev.map((c) =>
          c._id === activeCategoryId
            ? { ...c, entryCount: (c.entryCount || 0) + 1 }
            : c
        )
      );

      setIsLessonModalOpen(false);
      setNewLessonTitle('');
      setNewLessonDesc('');
      setNewLessonTags('');
      showToast('Knowledge entry successfully logged!');
    } catch (error: any) {
      showToast(error.message || 'Error saving entry', true);
    }
  };

  // Delete Handlers
  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      if (deleteConfirmation.type === 'category') {
        const res = await fetch(`/api/categories/${deleteConfirmation.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete category');

        setCategories((prev) => prev.filter((c) => c._id !== deleteConfirmation.id));
        setLessons((prev) => prev.filter((l) => l.categoryId !== deleteConfirmation.id));
        if (activeCategoryId === deleteConfirmation.id) {
          setActiveCategoryId(null);
        }
        showToast(`Category "${deleteConfirmation.title}" deleted.`);
      } else {
        const res = await fetch(`/api/lessons/${deleteConfirmation.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete entry');

        setLessons((prev) => prev.filter((l) => l._id !== deleteConfirmation.id));
        setCategories((prev) =>
          prev.map((c) =>
            c._id === activeCategoryId
              ? { ...c, entryCount: Math.max(0, (c.entryCount || 1) - 1) }
              : c
          )
        );
        showToast('Knowledge entry deleted.');
      }
    } catch (error: any) {
      showToast(error.message || 'Delete operation failed', true);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const schemaCategoryCode = `// models/Category.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  icon: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: '💡',
    },
    color: {
      type: String,
      enum: ['indigo', 'emerald', 'amber', 'rose', 'sky', 'purple'],
      default: 'indigo',
    },
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);`;

  const schemaLessonCode = `// models/Lesson.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILesson extends Document {
  categoryId: Types.ObjectId | string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const LessonSchema = new Schema<ILesson>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Lesson description is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index for fast queries by category sorted by newest
LessonSchema.index({ categoryId: 1, createdAt: -1 });

export const Lesson = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);`;

  const directoryStructureCode = `nelli-life/
├── api/
│   ├── index.ts            # Serverless function entrypoint for Vercel (pure Express)
│   └── [...path].ts        # Catch-all API router for Vercel Serverless
├── app.ts                  # Pure Express backend API (ZERO Vite/Rolldown dependencies)
├── models/
│   ├── Category.ts         # Mongoose schema for categories (with icon & accent color)
│   └── Lesson.ts           # Mongoose schema for lessons (referenced to Category with tags)
├── lib/
│   └── db.ts               # Resilient connection manager & hybrid DAO (Atlas + fallback)
├── src/
│   ├── App.tsx             # Interactive Nelli-Life Frontend with full CRUD & search
│   ├── main.tsx            # React entrypoint
│   └── index.css           # Tailwind CSS configuration with Plus Jakarta Sans
├── server.ts               # Local dev server runner (dynamic Vite middlewares)
├── vercel.json             # Vercel deployment routing (routes /api/* to serverless)
├── .env.example            # Environment variables template (MONGODB_URI, PORT)
├── package.json            # Node.js dependencies (express, mongoose, bcryptjs, react)
├── tsconfig.json           # TypeScript configuration
└── index.html              # HTML shell with Google fonts and meta tags`;

  const vercelJsonCode = `{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ]
}`;

  const runLocallyGuide = `# 1. Clone repository & install dependencies
git clone <your-repo-url> nelli-life
cd nelli-life
npm install

# 2. Configure MongoDB connection in .env
cp .env.example .env

# Edit .env and paste your MongoDB Atlas connection string:
# MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/nellilife?retryWrites=true&w=majority"
# (Or local MongoDB: MONGODB_URI="mongodb://127.0.0.1:27017/nellilife")
# Note: If MONGODB_URI is left blank, Nelli-Life runs in local memory mode automatically!

# 3. Start development server
npm run dev

# 4. Open in browser:
# http://localhost:3000`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Title */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveCategoryId(null)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                    Nelli-Life
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {dbStatus?.mode === 'mongodb' && dbStatus?.isConnected
                      ? 'MongoDB Atlas Connected'
                      : 'Full Stack & Mongoose Ready'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Personal Knowledge Tracker • MongoDB + Express + Tailwind
                </p>
              </div>
            </div>

            {/* Quick Stats & Primary Action */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500 border-r border-slate-200 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="font-bold text-slate-700">{categories.length}</span> Categories
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-slate-700">{lessons.length}</span> Notes Logged
                </div>
              </div>

              <button
                onClick={() => setIsCatModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Category</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Header with Breadcrumbs & Search */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center text-xs font-semibold text-slate-500 mb-2 gap-1.5">
              <button
                onClick={() => setActiveCategoryId(null)}
                className="text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Categories
              </button>
              {activeCategory && (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-800 font-bold">{activeCategory.name}</span>
                </>
              )}
            </nav>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeCategory ? activeCategory.name : 'Knowledge Domains'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeCategory
                ? activeCategory.description || 'Logged insights, utilities, and daily wisdom.'
                : 'Select or create categories to capture daily life lessons, software engineering tools, and personal wisdom.'}
            </p>
          </div>

          {/* Search & Detail View Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeCategory
                    ? 'Search notes, tags...'
                    : 'Search lessons, tools, notes...'
                }
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-sm placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeCategory && (
              <>
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">All Categories</span>
                </button>

                <button
                  onClick={() => setIsLessonModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Entry</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* VIEW 1: Categories Card-Based Grid */}
        {!activeCategory && (
          <section className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {searchQuery ? 'No matching categories' : 'No categories found'}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
                  {searchQuery
                    ? `Try a different query or reset your search.`
                    : "Start by creating your first category like 'Life Lessons' or 'Software Tools' to organize your insights."}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCatModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
                  >
                    Create First Category
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCategories.map((cat) => {
                  const theme = COLOR_CONFIGS[cat.color] || COLOR_CONFIGS.indigo;
                  const count =
                    cat.entryCount !== undefined
                      ? cat.entryCount
                      : lessons.filter((l) => l.categoryId === cat._id).length;

                  return (
                    <div
                      key={cat._id}
                      onClick={() => setActiveCategoryId(cat._id)}
                      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* Top Card Bar: Icon, Count Badge, Trash */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center text-2xl border ${theme.border} group-hover:scale-105 transition-transform shadow-xs`}
                          >
                            {cat.icon || '📌'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${theme.badge}`}
                            >
                              {count} {count === 1 ? 'entry' : 'entries'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmation({
                                  type: 'category',
                                  id: cat._id,
                                  title: cat.name,
                                });
                              }}
                              title="Delete Category"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                          {cat.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Active Domain
                        </span>
                        <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Explore Notes <ArrowRight className="w-3.5 h-3.5 inline" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: Category Detail & Entries List */}
        {activeCategory && (
          <section className="space-y-6">
            {/* Active Category Header Banner */}
            {(() => {
              const theme = COLOR_CONFIGS[activeCategory.color] || COLOR_CONFIGS.indigo;
              const currentCount = currentLessons.length;

              return (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-md font-bold bg-gradient-to-br ${theme.gradient}`}
                    >
                      {activeCategory.icon || '📌'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                          {activeCategory.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10">
                          {currentCount} {currentCount === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mt-0.5 max-w-xl">
                        {activeCategory.description || 'Log insights and tools within this space.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => setIsLessonModalOpen(true)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Log New Entry</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Entries Grid */}
            {currentLessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-14 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {searchQuery ? 'No matching notes found' : 'No entries logged yet'}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
                  {searchQuery
                    ? `No entries matched "${searchQuery}". Try a different keyword.`
                    : 'Capture your key takeaway, code snippet, or tool review inside this category.'}
                </p>
                <button
                  onClick={() => {
                    if (searchQuery) setSearchQuery('');
                    else setIsLessonModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                >
                  {searchQuery ? 'Clear Search' : 'Add First Entry'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentLessons.map((item) => {
                  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Entry Header: Date & Delete */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-[11px] font-medium text-slate-400 font-mono">
                            {formattedDate}
                          </span>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'lesson',
                                id: item._id,
                                title: item.title,
                              })
                            }
                            title="Delete Note"
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-bold text-slate-900 tracking-tight leading-snug mb-2">
                          {item.title}
                        </h4>

                        {/* Note Description */}
                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 mb-3">
                          {item.description}
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {item.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-medium flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Technical Architecture & Full Stack Specification Drawer */}
        <section className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-mono font-bold">
                API
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Full Stack & Deployment Architecture
                </h3>
                <p className="text-xs text-slate-500">
                  Mongoose Schemas, REST endpoints, and vercel.json serverless wiring
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSpecsOpen(!isSpecsOpen)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{isSpecsOpen ? 'Hide Architecture Specs' : 'View Schema & Route Specs'}</span>
              {isSpecsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {isSpecsOpen && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              {/* Tab Selector */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setActiveSpecTab('schemas')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeSpecTab === 'schemas'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Mongoose Schemas
                </button>
                <button
                  onClick={() => setActiveSpecTab('routes')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeSpecTab === 'routes'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  Express REST Routes
                </button>
                <button
                  onClick={() => setActiveSpecTab('structure')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeSpecTab === 'structure'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  Directory Structure
                </button>
                <button
                  onClick={() => setActiveSpecTab('setup')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeSpecTab === 'setup'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  MongoDB Connection & Local Run
                </button>
                <button
                  onClick={() => setActiveSpecTab('vercel')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    activeSpecTab === 'vercel'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Vercel Setup (vercel.json)
                </button>
              </div>

              {/* TAB 1: Mongoose Schemas */}
              {activeSpecTab === 'schemas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Category Schema */}
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">Category Model</span>
                        <span className="text-[10px] text-slate-400">models/Category.ts</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(schemaCategoryCode, 'cat_schema')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                      >
                        {copiedKey === 'cat_schema' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                      {schemaCategoryCode}
                    </pre>
                  </div>

                  {/* Lesson Schema */}
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400 font-bold">Lesson Model</span>
                        <span className="text-[10px] text-slate-400">models/Lesson.ts</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(schemaLessonCode, 'lesson_schema')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                      >
                        {copiedKey === 'lesson_schema' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                      {schemaLessonCode}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: Express Routes */}
              {activeSpecTab === 'routes' && (
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300">
                      REST Endpoints Implemented in server.ts
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                      Live & Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          GET
                        </span>
                        <span className="text-slate-100 font-bold">/api/categories</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Retrieves all categories along with calculated entry/lesson counts.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                          POST
                        </span>
                        <span className="text-slate-100 font-bold">/api/categories</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Body: &#123; name, description, icon, color &#125;
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          DELETE
                        </span>
                        <span className="text-slate-100 font-bold">/api/categories/:id</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Deletes category and triggers cascade delete on all associated lessons.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          GET
                        </span>
                        <span className="text-slate-100 font-bold">/api/lessons</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Query params: ?categoryId=:id&search=:query
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                          POST
                        </span>
                        <span className="text-slate-100 font-bold">/api/lessons</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Body: &#123; categoryId, title, description, tags &#125;
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          DELETE
                        </span>
                        <span className="text-slate-100 font-bold">/api/lessons/:id</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Deletes single lesson by its identifier.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Directory Structure */}
              {activeSpecTab === 'structure' && (
                <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300">Full Project File Tree</span>
                    <button
                      onClick={() => copyToClipboard(directoryStructureCode, 'dir_struct')}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                    >
                      {copiedKey === 'dir_struct' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                    {directoryStructureCode}
                  </pre>
                </div>
              )}

              {/* TAB 4: Setup & MongoDB Connection */}
              {activeSpecTab === 'setup' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          dbStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      ></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <span>
                            Current Mode:{' '}
                            {dbStatus?.isConnected
                              ? 'MongoDB Connected'
                              : 'Resilient In-Memory Fallback'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {dbStatus?.hasMongoURI
                            ? 'Using MONGODB_URI defined in environment variables.'
                            : 'Set MONGODB_URI in your .env file to connect directly to MongoDB Atlas or local daemon.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-emerald-400">
                        How to Connect MongoDB & Run Locally
                      </span>
                      <button
                        onClick={() => copyToClipboard(runLocallyGuide, 'run_guide')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                      >
                        {copiedKey === 'run_guide' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                      {runLocallyGuide}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: Vercel Configuration & 404 Prevention */}
              {activeSpecTab === 'vercel' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold mb-1">
                        Why does Vercel return a 404 HTML page and JSON parsing error?
                      </p>
                      <p className="text-amber-800">
                        Without a <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">vercel.json</code> file,
                        Vercel assumes all requests belong to the static Vite frontend. When client code fetches{' '}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">/api/categories</code>, Vercel falls back to serving{' '}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">index.html</code>. Parsing that HTML with{' '}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">res.json()</code> causes the dreaded syntax error.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">vercel.json</span>
                        <span className="text-[10px] text-slate-400">(Root directory)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(vercelJsonCode, 'vercel_json')}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                      >
                        {copiedKey === 'vercel_json' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                      {vercelJsonCode}
                    </pre>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Vercel Environment Variables Checklist:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                      <li>
                        Set <span className="font-mono font-bold text-slate-900">MONGODB_URI</span> in your Vercel Project Settings → Environment Variables.
                      </li>
                      <li>
                        Set MongoDB Network Access to allow <span className="font-mono text-slate-900">0.0.0.0/0</span> (Anywhere) so Vercel Serverless IPs can query the database.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: Create Category */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">New Category</h3>
              </div>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Life Lessons, Software Tools, Health"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Daily principles, tech stack evaluations..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Accent Color Theme
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {(['indigo', 'emerald', 'amber', 'rose', 'sky', 'purple'] as const).map(
                    (colorKey) => {
                      const isSelected = newCatColor === colorKey;
                      const bgClasses: Record<string, string> = {
                        indigo: 'bg-indigo-600',
                        emerald: 'bg-emerald-600',
                        amber: 'bg-amber-500',
                        rose: 'bg-rose-600',
                        sky: 'bg-sky-500',
                        purple: 'bg-purple-600',
                      };

                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNewCatColor(colorKey)}
                          className={`h-9 rounded-lg ${bgClasses[colorKey]} flex items-center justify-center text-white text-xs cursor-pointer transition ${
                            isSelected ? 'ring-2 ring-offset-2 ring-indigo-600 scale-105' : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category Icon
                </label>
                <div className="grid grid-cols-6 gap-2 text-xl">
                  {AVAILABLE_ICONS.map((emoji) => {
                    const isSelected = newCatIcon === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatIcon(emoji)}
                        className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 scale-105'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Lesson / Knowledge Entry */}
      {isLessonModalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Log New Knowledge Entry</h3>
                  <p className="text-xs text-slate-500">
                    Domain: <span className="font-semibold text-indigo-600">{activeCategory.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entry Title *
                </label>
                <input
                  type="text"
                  required
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="e.g. Always decouple state from rendering, Tailwind JIT trick"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newLessonTags}
                  onChange={(e) => setNewLessonTags(e.target.value)}
                  placeholder="e.g. productivity, mindset, architecture"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Knowledge Notes *
                </label>
                <textarea
                  rows={5}
                  required
                  value={newLessonDesc}
                  onChange={(e) => setNewLessonDesc(e.target.value)}
                  placeholder="Write down the core lesson, key command, why it matters, or context for future you..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed font-sans"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: In-App Safe Deletion Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Delete {deleteConfirmation.type === 'category' ? 'Category' : 'Note'}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {deleteConfirmation.type === 'category' ? (
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-700">
                    "{deleteConfirmation.title}"
                  </span>
                  ? This will permanently cascade-delete all notes inside it.
                </>
              ) : (
                <>
                  Are you sure you want to delete the entry{' '}
                  <span className="font-semibold text-slate-700">
                    "{deleteConfirmation.title}"
                  </span>
                  ?
                </>
              )}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.isError ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
