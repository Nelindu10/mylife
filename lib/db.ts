import mongoose from 'mongoose';
import { Category, ICategory } from '../models/Category.ts';
import { Lesson, ILesson } from '../models/Lesson.ts';

// Cache connection in serverless or development environments
let isConnected = false;
let dbMode: 'mongodb' | 'memory' = 'memory';
let connectionError: string | null = null;

// Initial seed data for out-of-the-box experience
const defaultCategories = [
  {
    _id: '660000000000000000000001',
    name: 'Life Lessons',
    description: 'Hard-won personal principles, mental models, and reflections.',
    icon: '💡',
    color: 'amber' as const,
    createdAt: new Date('2026-03-01T08:00:00.000Z'),
    updatedAt: new Date('2026-03-01T08:00:00.000Z'),
  },
  {
    _id: '660000000000000000000002',
    name: 'Software Tools',
    description: 'Developer utilities, CLI commands, libraries, and best-in-class workflows.',
    icon: '🛠️',
    color: 'indigo' as const,
    createdAt: new Date('2026-03-02T09:30:00.000Z'),
    updatedAt: new Date('2026-03-02T09:30:00.000Z'),
  },
  {
    _id: '660000000000000000000003',
    name: 'Architecture & Design',
    description: 'Database patterns, UI ergonomics, system scalability insights.',
    icon: '⚡',
    color: 'emerald' as const,
    createdAt: new Date('2026-03-03T11:15:00.000Z'),
    updatedAt: new Date('2026-03-03T11:15:00.000Z'),
  },
];

const defaultLessons = [
  {
    _id: '660000000000000000000101',
    categoryId: '660000000000000000000001',
    title: 'Focus on High-Leverage Tasks First',
    description:
      'The easiest tasks often create the illusion of productivity while delaying critical milestones. Dedicate the first 90 minutes of the morning solely to deep, uninterrupted craft.',
    tags: ['mindset', 'habits', 'productivity'],
    createdAt: new Date('2026-03-04T07:45:00.000Z'),
    updatedAt: new Date('2026-03-04T07:45:00.000Z'),
  },
  {
    _id: '660000000000000000000102',
    categoryId: '660000000000000000000001',
    title: 'Compound Consistency over Heroic Sprints',
    description:
      'Doing 30 minutes every day beats doing 8 hours once a week. Momentum creates intrinsic motivation and preserves mental bandwidth.',
    tags: ['consistency', 'learning'],
    createdAt: new Date('2026-03-05T09:00:00.000Z'),
    updatedAt: new Date('2026-03-05T09:00:00.000Z'),
  },
  {
    _id: '660000000000000000000103',
    categoryId: '660000000000000000000002',
    title: 'Vercel Serverless Function Caching',
    description:
      'Always cache Mongoose connections globally in serverless lambdas (`global.mongooseConnection`) to prevent connection pool exhaustion during concurrent request spikes.',
    tags: ['node', 'vercel', 'mongodb'],
    createdAt: new Date('2026-03-06T14:20:00.000Z'),
    updatedAt: new Date('2026-03-06T14:20:00.000Z'),
  },
  {
    _id: '660000000000000000000104',
    categoryId: '660000000000000000000002',
    title: 'Tailwind Arbitrary Value Syntax',
    description:
      'Use square brackets for one-off pixel values like w-[320px] and grid-cols-[1fr_2fr] when tokens are not sufficient, maintaining rapid prototyping velocity.',
    tags: ['frontend', 'css', 'tailwind'],
    createdAt: new Date('2026-03-07T16:10:00.000Z'),
    updatedAt: new Date('2026-03-07T16:10:00.000Z'),
  },
];

// In-memory backing arrays
let memoryCategories = [...defaultCategories];
let memoryLessons = [...defaultLessons];

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    dbMode = 'memory';
    isConnected = false;
    console.log('ℹ️ MONGODB_URI not provided. Running in memory storage mode.');
    return;
  }

  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    dbMode = 'mongodb';
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    dbMode = 'mongodb';
    connectionError = null;
    console.log('✅ Connected to MongoDB successfully via Mongoose.');

    // Seed default categories if database is empty
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      console.log('🌱 Seeding initial knowledge categories into MongoDB...');
      for (const cat of defaultCategories) {
        await Category.create(cat);
      }
      for (const lesson of defaultLessons) {
        await Lesson.create(lesson);
      }
      console.log('✅ Seeding complete.');
    }
  } catch (err: any) {
    connectionError = err.message || 'Failed to connect to MongoDB';
    isConnected = false;
    dbMode = 'memory';
    console.warn(`⚠️ MongoDB connection warning: ${connectionError}. Falling back to memory storage mode.`);
  }
}

export function getDBStatus() {
  return {
    mode: dbMode,
    isConnected: mongoose.connection.readyState === 1,
    connectionState: ['disconnected', 'connected', 'connecting', 'disconnecting'][
      mongoose.connection.readyState
    ] || 'unknown',
    hasMongoURI: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0),
    error: connectionError,
  };
}

// Unified Category Data Access Layer
export const CategoryDAO = {
  async list() {
    if (mongoose.connection.readyState === 1) {
      const cats = await Category.find().sort({ createdAt: -1 }).lean();
      // Aggregate counts
      const counts = await Lesson.aggregate([
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]));

      return cats.map((cat: any) => ({
        ...cat,
        _id: cat._id.toString(),
        entryCount: countMap.get(cat._id.toString()) || 0,
      }));
    }

    return memoryCategories.map((cat) => ({
      ...cat,
      entryCount: memoryLessons.filter((l) => l.categoryId === cat._id).length,
    }));
  },

  async create(data: { name: string; description?: string; icon?: string; color?: string }) {
    if (mongoose.connection.readyState === 1) {
      const newCat = await Category.create(data);
      return {
        ...newCat.toObject(),
        _id: newCat._id.toString(),
        entryCount: 0,
      };
    }

    // Check duplicate
    const exists = memoryCategories.some(
      (c) => c.name.toLowerCase() === data.name.trim().toLowerCase()
    );
    if (exists) {
      throw new Error(`Category "${data.name}" already exists`);
    }

    const newCat = {
      _id: 'cat_' + Date.now(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      icon: data.icon || '💡',
      color: (data.color as any) || 'indigo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryCategories.unshift(newCat);
    return { ...newCat, entryCount: 0 };
  },

  async delete(id: string) {
    if (mongoose.connection.readyState === 1) {
      const cat = await Category.findByIdAndDelete(id);
      if (cat) {
        // Cascade delete lessons under this category
        await Lesson.deleteMany({ categoryId: id });
      }
      return cat;
    }

    const index = memoryCategories.findIndex((c) => c._id === id);
    if (index === -1) return null;
    const removed = memoryCategories.splice(index, 1)[0];
    // Cascade delete lessons
    memoryLessons = memoryLessons.filter((l) => l.categoryId !== id);
    return removed;
  },

  async getById(id: string) {
    if (mongoose.connection.readyState === 1) {
      return await Category.findById(id).lean();
    }
    return memoryCategories.find((c) => c._id === id) || null;
  },
};

// Unified Lesson Data Access Layer
export const LessonDAO = {
  async list(filters?: { categoryId?: string; search?: string }) {
    if (mongoose.connection.readyState === 1) {
      const query: any = {};
      if (filters?.categoryId) {
        query.categoryId = filters.categoryId;
      }
      if (filters?.search) {
        const regex = new RegExp(filters.search, 'i');
        query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
      }

      const lessons = await Lesson.find(query).sort({ createdAt: -1 }).lean();
      return lessons.map((l: any) => ({
        ...l,
        _id: l._id.toString(),
        categoryId: l.categoryId?.toString(),
      }));
    }

    const search = filters?.search?.toLowerCase();
    return memoryLessons.filter((l) => {
      const matchCat = filters?.categoryId ? l.categoryId === filters.categoryId : true;
      const matchSearch = search
        ? l.title.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search) ||
          l.tags.some((t) => t.toLowerCase().includes(search))
        : true;
      return matchCat && matchSearch;
    });
  },

  async create(data: { categoryId: string; title: string; description: string; tags?: string[] }) {
    if (mongoose.connection.readyState === 1) {
      const newLesson = await Lesson.create(data);
      return {
        ...newLesson.toObject(),
        _id: newLesson._id.toString(),
        categoryId: newLesson.categoryId.toString(),
      };
    }

    const newLesson = {
      _id: 'lesson_' + Date.now(),
      categoryId: data.categoryId,
      title: data.title.trim(),
      description: data.description.trim(),
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryLessons.unshift(newLesson);
    return newLesson;
  },

  async delete(id: string) {
    if (mongoose.connection.readyState === 1) {
      return await Lesson.findByIdAndDelete(id);
    }
    const index = memoryLessons.findIndex((l) => l._id === id);
    if (index === -1) return null;
    return memoryLessons.splice(index, 1)[0];
  },
};
