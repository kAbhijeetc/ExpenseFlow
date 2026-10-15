import mongoose from 'mongoose';

/**
 * Currency Precision Strategy:
 * Monetary amounts are represented as IEEE 754 floating point numbers in MongoDB
 * and rounded strictly to 2 decimal places using application-level setters/pre-save
 * hooks (Math.round(val * 100) / 100). This avoids fractional cent drifts while maintaining
 * standard JSON numeric interoperability for charts and aggregation totals.
 */
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} must be either income or expense',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      set: (val) => Math.round(Number(val) * 100) / 100,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash', 'UPI', 'card', 'bank transfer', 'other'],
        message: '{VALUE} is not a supported payment method',
      },
      default: 'UPI',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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

// Indexes for query performance and aggregation efficiency
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, paymentMethod: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
