import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';

/**
 * Normalizes start and end dates to UTC boundaries
 */
const getDateRange = (startDateStr, endDateStr) => {
  const now = new Date();
  const start = startDateStr
    ? new Date(startDateStr)
    : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Default: Start of current month
  const end = endDateStr
    ? new Date(endDateStr)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Default: End of current month

  // Set boundary times if provided as pure YYYY-MM-DD
  if (startDateStr && !startDateStr.includes('T')) {
    start.setHours(0, 0, 0, 0);
  }
  if (endDateStr && !endDateStr.includes('T')) {
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

export const analyticsService = {
  /**
   * AGGREGATION 1: Total income, expenses, net balance, and savings rate
   * Uses $match, $group with conditional sums, and $project
   */
  async getSummary(userId, startDateStr, endDateStr) {
    const { start, end } = getDateRange(startDateStr, endDateStr);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          incomeCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, 1, 0],
            },
          },
          expenseCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, 1, 0],
            },
          },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalIncome: { $round: ['$totalIncome', 2] },
          totalExpense: { $round: ['$totalExpense', 2] },
          netBalance: { $round: [{ $subtract: ['$totalIncome', '$totalExpense'] }, 2] },
          transactionCount: 1,
          incomeCount: 1,
          expenseCount: 1,
          savingsRate: {
            $cond: [
              { $gt: ['$totalIncome', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ['$totalIncome', '$totalExpense'] },
                          '$totalIncome',
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    const results = await Transaction.aggregate(pipeline);

    if (results.length === 0) {
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        savingsRate: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
      };
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      ...results[0],
    };
  },

  /**
   * AGGREGATION 2: Category-wise expense breakdown with totals and percentages
   * Uses $match, $group, $lookup, $sort, and $project
   */
  async getCategoryBreakdown(userId, startDateStr, endDateStr, type = 'expense') {
    const { start, end } = getDateRange(startDateStr, endDateStr);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          type: type,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
          color: { $ifNull: ['$category.color', '#94a3b8'] },
          icon: { $ifNull: ['$category.icon', 'tag'] },
          totalAmount: { $round: ['$totalAmount', 2] },
          transactionCount: 1,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ];

    const breakdown = await Transaction.aggregate(pipeline);
    const totalPeriodAmount = breakdown.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const withPercentages = breakdown.map((item) => ({
      ...item,
      percentage: totalPeriodAmount > 0
        ? Math.round((item.totalAmount / totalPeriodAmount) * 10000) / 100
        : 0,
    }));

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      type,
      totalAmount: Math.round(totalPeriodAmount * 100) / 100,
      breakdown: withPercentages,
    };
  },

  /**
   * AGGREGATION 3: Monthly financial trends (Income vs Expenses over past N months)
   * Uses $match, $group by year/month, $sort
   */
  async getMonthlyTrends(userId, monthsBack = 6) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1, 0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          income: { $round: ['$income', 2] },
          expense: { $round: ['$expense', 2] },
          netBalance: { $round: [{ $subtract: ['$income', '$expense'] }, 2] },
          count: 1,
        },
      },
    ];

    const results = await Transaction.aggregate(pipeline);

    // Map month numbers to readable labels e.g. "Jan 2026"
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = results.map((r) => ({
      ...r,
      label: `${monthNames[r.month - 1]} ${r.year}`,
    }));

    return formatted;
  },

  /**
   * AGGREGATION 4: Daily spending trends for a selected date range
   * Uses $match, $group by year/month/day, $sort, and $project
   */
  async getDailyTrends(userId, startDateStr, endDateStr) {
    const { start, end } = getDateRange(startDateStr, endDateStr);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
          },
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          day: '$_id.day',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
            },
          },
          totalSpent: { $round: ['$totalSpent', 2] },
          count: 1,
        },
      },
    ];

    return Transaction.aggregate(pipeline);
  },

  /**
   * AGGREGATION 5: Budget utilization comparison for a specific month and year
   * Compares category budgets against aggregated actual spending in that month
   */
  async getBudgetUtilization(userId, month, year) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          month: targetMonth,
          year: targetYear,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $lookup: {
          from: 'transactions',
          let: { catId: '$categoryId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', userObjectId] },
                    { $eq: ['$categoryId', '$$catId'] },
                    { $eq: ['$type', 'expense'] },
                    { $gte: ['$date', monthStart] },
                    { $lte: ['$date', monthEnd] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: '$amount' },
              },
            },
          ],
          as: 'spendingData',
        },
      },
      {
        $addFields: {
          actualSpent: {
            $ifNull: [{ $arrayElemAt: ['$spendingData.totalSpent', 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          budgetId: '$_id',
          categoryId: '$categoryId',
          categoryName: '$category.name',
          categoryColor: '$category.color',
          categoryIcon: '$category.icon',
          month: '$month',
          year: '$year',
          budgetAmount: { $round: ['$amount', 2] },
          actualSpent: { $round: ['$actualSpent', 2] },
          remaining: {
            $round: [{ $subtract: ['$amount', '$actualSpent'] }, 2],
          },
          alertThreshold: '$alertThreshold',
          percentageUsed: {
            $cond: [
              { $gt: ['$amount', 0] },
              {
                $round: [
                  {
                    $multiply: [{ $divide: ['$actualSpent', '$amount'] }, 100],
                  },
                  2,
                ],
              },
              0,
            ],
          },
          isExceeded: { $gt: ['$actualSpent', '$amount'] },
          isNearThreshold: {
            $gte: [
              {
                $cond: [
                  { $gt: ['$amount', 0] },
                  { $multiply: [{ $divide: ['$actualSpent', '$amount'] }, 100] },
                  0,
                ],
              },
              '$alertThreshold',
            ],
          },
        },
      },
      {
        $sort: { percentageUsed: -1 },
      },
    ];

    const results = await Budget.aggregate(pipeline);

    const totalBudgeted = results.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalSpentInBudgets = results.reduce((sum, item) => sum + item.actualSpent, 0);

    return {
      month: targetMonth,
      year: targetYear,
      totalBudgeted: Math.round(totalBudgeted * 100) / 100,
      totalSpent: Math.round(totalSpentInBudgets * 100) / 100,
      overallPercentage: totalBudgeted > 0 ? Math.round((totalSpentInBudgets / totalBudgeted) * 10000) / 100 : 0,
      budgets: results,
    };
  },

  /**
   * AGGREGATION 6: Top N highest spending categories in a period
   * Uses $match, $group, $lookup, $sort, and $limit
   */
  async getTopCategories(userId, startDateStr, endDateStr, limit = 5) {
    const { start, end } = getDateRange(startDateStr, endDateStr);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
          totalSpent: { $round: ['$totalSpent', 2] },
          transactionCount: 1,
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
      {
        $limit: Number(limit) || 5,
      },
    ];

    return Transaction.aggregate(pipeline);
  },

  /**
   * AGGREGATION 7: Payment-method distribution analysis
   * Calculates spending totals and percentages by payment method
   */
  async getPaymentMethodAnalysis(userId, startDateStr, endDateStr) {
    const { start, end } = getDateRange(startDateStr, endDateStr);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          totalSpent: { $round: ['$totalSpent', 2] },
          transactionCount: 1,
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
    ];

    const results = await Transaction.aggregate(pipeline);
    const overallSpent = results.reduce((acc, curr) => acc + curr.totalSpent, 0);

    return results.map((item) => ({
      ...item,
      percentage: overallSpent > 0 ? Math.round((item.totalSpent / overallSpent) * 10000) / 100 : 0,
    }));
  },

  /**
   * AGGREGATION 8: Month-over-month financial comparison
   * Compares the specified month with the previous calendar month
   * Avoids division by zero when previous month's spending is 0
   */
  async getMonthOverMonthComparison(userId, targetMonth, targetYear) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const curMonth = Number(targetMonth) || new Date().getMonth() + 1;
    const curYear = Number(targetYear) || new Date().getFullYear();

    // Determine preceding month and year
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
    const prevYear = curMonth === 1 ? curYear - 1 : curYear;

    const curStart = new Date(curYear, curMonth - 1, 1, 0, 0, 0, 0);
    const curEnd = new Date(curYear, curMonth, 0, 23, 59, 59, 999);

    const prevStart = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0, 0);
    const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    const [currentStats, previousStats] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            date: { $gte: curStart, $lte: curEnd },
          },
        },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            date: { $gte: prevStart, $lte: prevEnd },
          },
        },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          },
        },
      ]),
    ]);

    const curExpense = currentStats[0]?.expense || 0;
    const prevExpense = previousStats[0]?.expense || 0;
    const curIncome = currentStats[0]?.income || 0;
    const prevIncome = previousStats[0]?.income || 0;

    // Calculate percentage change with zero division protection
    const calculatePctChange = (current, previous) => {
      if (previous === 0) {
        if (current === 0) return 0;
        return 100; // 100% increase from zero
      }
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    const expenseChangePct = calculatePctChange(curExpense, prevExpense);
    const incomeChangePct = calculatePctChange(curIncome, prevIncome);

    return {
      current: {
        month: curMonth,
        year: curYear,
        income: Math.round(curIncome * 100) / 100,
        expense: Math.round(curExpense * 100) / 100,
        netBalance: Math.round((curIncome - curExpense) * 100) / 100,
      },
      previous: {
        month: prevMonth,
        year: prevYear,
        income: Math.round(prevIncome * 100) / 100,
        expense: Math.round(prevExpense * 100) / 100,
        netBalance: Math.round((prevIncome - prevExpense) * 100) / 100,
      },
      changes: {
        expenseDiff: Math.round((curExpense - prevExpense) * 100) / 100,
        expenseChangePct,
        incomeDiff: Math.round((curIncome - prevIncome) * 100) / 100,
        incomeChangePct,
      },
    };
  },
};
