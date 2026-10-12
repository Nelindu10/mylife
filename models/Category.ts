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
      maxlength: [280, 'Description cannot exceed 280 characters'],
    },
    icon: {
      type: String,
      default: '💡',
      trim: true,
    },
    color: {
      type: String,
      enum: ['indigo', 'emerald', 'amber', 'rose', 'sky', 'purple'],
      default: 'indigo',
    },
  },
  {
    timestamps: true,
  }
);

export const Category =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
