import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const isObjectId = (val) => objectIdRegex.test(val);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']).optional().default('INR'),
  monthlyIncomeTarget: z.number().min(0).optional().default(0),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']).optional(),
  monthlyIncomeTarget: z.number().min(0).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Category type must be income or expense' }),
  }),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex code').optional().default('#3b82f6'),
  icon: z.string().trim().optional().default('tag'),
});

export const updateCategorySchema = categorySchema.partial();

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be income or expense' }),
  }),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  categoryId: z.string().refine(isObjectId, 'Invalid category ID'),
  description: z.string().trim().min(1, 'Description is required').max(200),
  date: z.coerce.date().refine((d) => !isNaN(d.getTime()), 'Invalid date format'),
  paymentMethod: z.enum(['cash', 'UPI', 'card', 'bank transfer', 'other']).optional().default('UPI'),
  notes: z.string().trim().max(500).optional().default(''),
  tags: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }),
});

export const updateTransactionSchema = transactionSchema.partial();

export const budgetSchema = z.object({
  categoryId: z.string().refine(isObjectId, 'Invalid category ID'),
  amount: z.coerce.number().positive('Budget amount must be greater than zero'),
  month: z.coerce.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.coerce.number().int().min(2000, 'Year must be 2000 or later').max(2100),
  alertThreshold: z.coerce.number().min(1).max(100).optional().default(80),
});

export const updateBudgetSchema = z.object({
  amount: z.coerce.number().positive('Budget amount must be greater than zero').optional(),
  alertThreshold: z.coerce.number().min(1).max(100).optional(),
});
