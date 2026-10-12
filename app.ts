import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { connectDB, getDBStatus, CategoryDAO, LessonDAO } from './lib/db.ts';

dotenv.config();

export const app = express();

// Global Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serverless DB readiness check: ensure Mongoose is connected for incoming API requests
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('DB connection attempt during request:', err);
  }
  next();
});

// --- REST API ROUTER ---
const apiRouter = Router();

// Health & Database Diagnostics
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbStatus = getDBStatus();
    const categories = await CategoryDAO.list();
    const lessons = await LessonDAO.list();
    res.json({
      status: 'ok',
      database: dbStatus,
      stats: {
        categoriesCount: categories.length,
        lessonsCount: lessons.length,
      },
      uptime: process.uptime(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Category CRUD
apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await CategoryDAO.list();
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

apiRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await CategoryDAO.create({
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon || '💡',
      color: color || 'indigo',
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    const isDuplicate = error.code === 11000 || error.message?.includes('already exists');
    res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? `Category "${req.body.name}" already exists` : error.message,
    });
  }
});

apiRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CategoryDAO.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category and all associated lessons deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lesson / Entry CRUD
const handleListLessons = async (req: Request, res: Response) => {
  try {
    const { categoryId, search } = req.query;
    const lessons = await LessonDAO.list({
      categoryId: categoryId as string | undefined,
      search: search as string | undefined,
    });
    res.json(lessons);
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: error.message });
  }
};

const handleCreateLesson = async (req: Request, res: Response) => {
  try {
    const { categoryId, title, description, tags } = req.body;
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId is required' });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Lesson title is required' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Lesson description is required' });
    }

    let parsedTags: string[] = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const lesson = await LessonDAO.create({
      categoryId,
      title: title.trim(),
      description: description.trim(),
      tags: parsedTags,
    });

    res.status(201).json(lesson);
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: error.message });
  }
};

const handleDeleteLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await LessonDAO.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ message: 'Lesson deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: error.message });
  }
};

apiRouter.get('/lessons', handleListLessons);
apiRouter.post('/lessons', handleCreateLesson);
apiRouter.delete('/lessons/:id', handleDeleteLesson);

apiRouter.get('/entries', handleListLessons);
apiRouter.post('/entries', handleCreateLesson);
apiRouter.delete('/entries/:id', handleDeleteLesson);

// Mount API router strictly on /api
app.use('/api', apiRouter);

// Return JSON error for unmatched /api routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    path: req.path,
  });
});

export default app;
