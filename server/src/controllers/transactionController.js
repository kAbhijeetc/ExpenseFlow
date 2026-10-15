import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { generateCsv } from '../utils/csv.js';

/**
 * Builds standard filter query object for transactions
 */
const buildTransactionFilter = (userId, query) => {
  const filter = { userId };

  if (query.type && ['income', 'expense'].includes(query.type)) {
    filter.type = query.type;
  }

  if (query.categoryId && mongoose.Types.ObjectId.isValid(query.categoryId)) {
    filter.categoryId = query.categoryId;
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod;
  }

  // Date range filtering
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (!query.startDate.includes('T')) start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (!query.endDate.includes('T')) end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Text search on description and notes
  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { description: searchRegex },
      { notes: searchRegex },
      { tags: searchRegex },
    ];
  }

  return filter;
};

export const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const filter = buildTransactionFilter(req.user._id, req.query);

    const [transactions, totalCount, totals] = await Promise.all([
      Transaction.find(filter)
        .populate('categoryId', 'name type color icon')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
      // Aggregate summary for filtered dataset
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            totalExpense: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
          },
        },
      ]),
    ]);

    const filteredTotalIncome = totals[0]?.totalIncome ? Math.round(totals[0].totalIncome * 100) / 100 : 0;
    const filteredTotalExpense = totals[0]?.totalExpense ? Math.round(totals[0].totalExpense * 100) / 100 : 0;

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      summary: {
        totalIncome: filteredTotalIncome,
        totalExpense: filteredTotalExpense,
        netBalance: Math.round((filteredTotalIncome - filteredTotalExpense) * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id })
      .populate('categoryId', 'name type color icon');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, categoryId, description, date, paymentMethod, notes, tags } = req.body;

    // Referential and ownership validation: Category must belong to the user
    const category = await Category.findOne({ _id: categoryId, userId: req.user._id });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. The selected category does not exist in your account.',
      });
    }

    // Type compatibility check: Income transaction cannot use expense category and vice versa
    if (category.type !== type) {
      return res.status(400).json({
        success: false,
        message: `Category "${category.name}" is designated for ${category.type}s, but transaction type is ${type}.`,
      });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount,
      categoryId,
      description,
      date: date || new Date(),
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
      tags: tags || [],
    });

    const populated = await Transaction.findById(transaction._id).populate('categoryId', 'name type color icon');

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Transaction.findOne({ _id: id, userId: req.user._id });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    const newType = req.body.type || existing.type;
    const newCatId = req.body.categoryId || existing.categoryId;

    // If category or type changed, re-validate category ownership and type match
    if (req.body.categoryId || req.body.type) {
      const category = await Category.findOne({ _id: newCatId, userId: req.user._id });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Category does not exist in your account.',
        });
      }
      if (category.type !== newType) {
        return res.status(400).json({
          success: false,
          message: `Category "${category.name}" is a ${category.type} category, incompatible with transaction type "${newType}".`,
        });
      }
    }

    Object.assign(existing, req.body);
    await existing.save();

    const populated = await Transaction.findById(existing._id).populate('categoryId', 'name type color icon');

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Transaction.deleteOne({ _id: id, userId: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const exportTransactionsCsv = async (req, res, next) => {
  try {
    const filter = buildTransactionFilter(req.user._id, req.query);

    const transactions = await Transaction.find(filter)
      .populate('categoryId', 'name type')
      .sort({ date: -1 });

    const headers = [
      'Transaction ID',
      'Date',
      'Type',
      'Category',
      'Description',
      'Amount',
      'Currency',
      'Payment Method',
      'Notes',
      'Tags',
    ];

    const rows = transactions.map((t) => [
      t._id.toString(),
      new Date(t.date).toISOString().split('T')[0],
      t.type.toUpperCase(),
      t.categoryId?.name || 'Uncategorized',
      t.description,
      t.amount.toFixed(2),
      req.user.currency || 'INR',
      t.paymentMethod,
      t.notes || '',
      Array.isArray(t.tags) ? t.tags.join('; ') : '',
    ]);

    const csvContent = generateCsv(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ExpenseFlow_Transactions_${new Date().toISOString().slice(0, 10)}.csv"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
