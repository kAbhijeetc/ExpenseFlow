import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget amount must be greater than zero'],
      set: (val) => Math.round(Number(val) * 100) / 100,
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year cannot exceed 2100'],
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: [1, 'Alert threshold must be at least 1%'],
      max: [100, 'Alert threshold cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique budget per user, category, month, and year
budgetSchema.index(
  { userId: 1, categoryId: 1, month: 1, year: 1 },
  { unique: true }
);

export const Budget = mongoose.model('Budget', budgetSchema);
