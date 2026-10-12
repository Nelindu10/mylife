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
      minlength: [2, 'Lesson title must be at least 2 characters'],
      maxlength: [140, 'Lesson title cannot exceed 140 characters'],
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
  {
    timestamps: true,
  }
);

LessonSchema.index({ categoryId: 1, createdAt: -1 });

export const Lesson =
  mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
