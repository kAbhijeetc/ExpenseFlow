import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid category type',
      },
    },
    color: {
      type: String,
      default: '#3b82f6',
      trim: true,
    },
    icon: {
      type: String,
      default: 'tag',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate category names of the same type for a single user
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

// Initial default categories template
export const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'utensils', isDefault: true },
  { name: 'Transport', type: 'expense', color: '#f97316', icon: 'car', isDefault: true },
  { name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'shopping-bag', isDefault: true },
  { name: 'Bills & Utilities', type: 'expense', color: '#eab308', icon: 'zap', isDefault: true },
  { name: 'Education', type: 'expense', color: '#3b82f6', icon: 'book-open', isDefault: true },
  { name: 'Healthcare', type: 'expense', color: '#10b981', icon: 'heart-pulse', isDefault: true },
  { name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'film', isDefault: true },
  { name: 'Other Expense', type: 'expense', color: '#64748b', icon: 'more-horizontal', isDefault: true },

  // Income categories
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase', isDefault: true },
  { name: 'Freelance & Projects', type: 'income', color: '#06b6d4', icon: 'laptop', isDefault: true },
  { name: 'Investments', type: 'income', color: '#8b5cf6', icon: 'trending-up', isDefault: true },
  { name: 'Other Income', type: 'income', color: '#64748b', icon: 'arrow-down-left', isDefault: true },
];

export const Category = mongoose.model('Category', categorySchema);
