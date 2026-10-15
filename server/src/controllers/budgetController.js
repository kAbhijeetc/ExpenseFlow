import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';

export const getBudgets = async (req, res, next) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    }).populate('categoryId', 'name type color icon');

    // Dynamically calculate actual spent from transactions for this specific month/year
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const enrichedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const spendingAggregate = await Transaction.aggregate([
          {
            $match: {
              userId: req.user._id,
              categoryId: b.categoryId?._id,
              type: 'expense',
              date: { $gte: monthStart, $lte: monthEnd },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
            },
          },
        ]);

        const actualSpent = spendingAggregate[0]?.totalSpent
          ? Math.round(spendingAggregate[0].totalSpent * 100) / 100
          : 0;
        const remaining = Math.round((b.amount - actualSpent) * 100) / 100;
        const percentageUsed = b.amount > 0
          ? Math.round((actualSpent / b.amount) * 10000) / 100
          : 0;

        return {
          _id: b._id,
          categoryId: b.categoryId,
          amount: b.amount,
          month: b.month,
          year: b.year,
          alertThreshold: b.alertThreshold,
          actualSpent,
          remaining,
          percentageUsed,
          isExceeded: actualSpent > b.amount,
          isNearThreshold: percentageUsed >= b.alertThreshold,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      })
    );

    const totalBudget = enrichedBudgets.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = enrichedBudgets.reduce((acc, b) => acc + b.actualSpent, 0);

    return res.status(200).json({
      success: true,
      month,
      year,
      summary: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remaining: Math.round((totalBudget - totalSpent) * 100) / 100,
        overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 10000) / 100 : 0,
      },
      budgets: enrichedBudgets,
    });
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { categoryId, amount, month, year, alertThreshold } = req.body;

    // Validate category exists, belongs to user, and is type 'expense'
    const category = await Category.findOne({ _id: categoryId, userId: req.user._id });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. The category does not belong to your account.',
      });
    }

    if (category.type !== 'expense') {
      return res.status(400).json({
        success: false,
        message: `Budgets can only be created for expense categories. Category "${category.name}" is an income category.`,
      });
    }

    // Check uniqueness
    const existing = await Budget.findOne({
      userId: req.user._id,
      categoryId,
      month,
      year,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A budget already exists for category "${category.name}" for ${month}/${year}. Please update the existing budget instead.`,
      });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      categoryId,
      amount,
      month,
      year,
      alertThreshold: alertThreshold || 80,
    });

    const populated = await Budget.findById(budget._id).populate('categoryId', 'name type color icon');

    return res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, alertThreshold } = req.body;

    const budget = await Budget.findOne({ _id: id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or unauthorized',
      });
    }

    if (amount !== undefined) budget.amount = amount;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;

    await budget.save();

    const populated = await Budget.findById(budget._id).populate('categoryId', 'name type color icon');

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      budget: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Budget.deleteOne({ _id: id, userId: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
