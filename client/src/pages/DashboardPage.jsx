import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PlusCircle,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';

const CHART_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  // Period filter: 'current-month', 'last-month', 'last-90-days'
  const [period, setPeriod] = useState('current-month');
  const [loading, setLoading] = useState(true);

  // Analytics data state
  const [summary, setSummary] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [monthComparison, setMonthComparison] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Compute start/end date based on selected period
  const calculateDateRange = useCallback(() => {
    const now = new Date();
    let start, end;

    if (period === 'current-month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'last-month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === 'last-90-days') {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      end = now;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [period]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = calculateDateRange();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [
        summaryRes,
        trendsRes,
        breakdownRes,
        dailyRes,
        budgetRes,
        compRes,
        recentTxRes,
      ] = await Promise.all([
        api.get(`/analytics/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get('/analytics/monthly-trends?months=6'),
        api.get(`/analytics/category-breakdown?startDate=${startDate}&endDate=${endDate}&type=expense`),
        api.get(`/analytics/daily-trends?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/analytics/budget-utilization?month=${currentMonth}&year=${currentYear}`),
        api.get(`/analytics/month-comparison?month=${currentMonth}&year=${currentYear}`),
        api.get('/transactions?limit=5&sortBy=date&sortOrder=desc'),
      ]);

      setSummary(summaryRes.data.data);
      setMonthlyTrends(trendsRes.data.data || []);
      setCategoryBreakdown(breakdownRes.data.data?.breakdown || []);
      setDailyTrends(dailyRes.data.data || []);
      setBudgetStatus(budgetRes.data.data);
      setMonthComparison(compRes.data.data);
      setRecentTransactions(recentTxRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [calculateDateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const isBrandNewUser =
    summary?.transactionCount === 0 && recentTransactions.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of cash flow, categories, and monthly budget utilization
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod('current-month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              period === 'current-month'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setPeriod('last-month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              period === 'last-month'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => setPeriod('last-90-days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              period === 'last-90-days'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Onboarding State for empty dataset */}
      {isBrandNewUser && (
        <Card className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border-sky-200 dark:border-sky-900">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Welcome to ExpenseFlow! Let's get started.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                You haven't recorded any income or expenses for this period yet.
                Add your first transaction or load realistic demo data using the seed script.
              </p>
            </div>
            <Link to="/transactions">
              <Button icon={PlusCircle}>Go to Transactions</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4 Financial Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary?.totalIncome || 0, user?.currency)}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span>{summary?.incomeCount || 0} deposits</span>
            </div>
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary?.totalExpense || 0, user?.currency)}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
              {monthComparison && (
                <span
                  className={`inline-flex items-center font-medium ${
                    monthComparison.changes.expenseChangePct > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {monthComparison.changes.expenseChangePct > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {Math.abs(monthComparison.changes.expenseChangePct)}% vs last month
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Net Cash Flow Balance */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Cash Flow
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-bold ${
                (summary?.netBalance || 0) >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary?.netBalance || 0, user?.currency)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Income minus expenses in period
            </div>
          </div>
        </Card>

        {/* Savings Rate */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatPercentage(summary?.savingsRate || 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {summary?.savingsRate > 20 ? 'Solid savings discipline' : 'Track closely'}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart (Span 2) */}
        <Card
          title="Income vs Expenses (Monthly Trends)"
          subtitle="Aggregated multi-month cash flow comparison"
          className="lg:col-span-2"
        >
          {monthlyTrends.length > 0 ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val, user?.currency)}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No trend data"
              description="Add transactions across months to generate multi-month trends."
            />
          )}
        </Card>

        {/* Expense Category Breakdown Donut Chart (Span 1) */}
        <Card
          title="Expense Breakdown"
          subtitle="Category distribution in selected period"
        >
          {categoryBreakdown.length > 0 ? (
            <div className="h-72 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(val, user?.currency)}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="w-full mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {categoryBreakdown.slice(0, 4).map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color || CHART_COLORS[idx] }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {cat.categoryName}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title="No expenses"
              description="No expense transactions found in this period."
            />
          )}
        </Card>
      </div>

      {/* Secondary Row: Daily Trends & Budget Status & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Trend (Span 2) */}
        <Card
          title="Daily Spending Curve"
          subtitle="Expense progression day by day"
          className="lg:col-span-2"
        >
          {dailyTrends.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val, user?.currency)}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalSpent"
                    name="Daily Spend"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No daily spending"
              description="Spending will show on this curve as expenses are entered."
            />
          )}
        </Card>

        {/* Current Month Budget Status Card */}
        <Card
          title="Active Budgets"
          subtitle={`Current Month (${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })})`}
          action={
            <Link
              to="/budgets"
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              View All
            </Link>
          }
        >
          {budgetStatus?.budgets?.length > 0 ? (
            <div className="space-y-4">
              {budgetStatus.budgets.slice(0, 4).map((b) => {
                const isOver = b.isExceeded;
                const isNear = b.isNearThreshold;
                const pct = Math.min(b.percentageUsed, 100);

                return (
                  <div key={b.budgetId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon
                          iconName={b.categoryIcon}
                          color={b.categoryColor}
                          className="w-3.5 h-3.5"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {b.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(b.actualSpent, user?.currency)} /{' '}
                          {formatCurrency(b.budgetAmount, user?.currency)}
                        </span>
                        {isOver ? (
                          <Badge variant="danger">Over</Badge>
                        ) : isNear ? (
                          <Badge variant="warning">Alert</Badge>
                        ) : null}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver
                            ? 'bg-rose-500'
                            : isNear
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                No budgets set for this month yet.
              </p>
              <Link to="/budgets">
                <Button size="sm" variant="outline">
                  Configure Budgets
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card
        title="Recent Transactions"
        subtitle="Latest ledger activities"
        action={
          <Link
            to="/transactions"
            className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
          >
            See All Transactions
          </Link>
        }
      >
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-1">Date</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right pr-1">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pl-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                      {tx.description}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1.5">
                        <CategoryIcon
                          iconName={tx.categoryId?.icon}
                          color={tx.categoryId?.color}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {tx.categoryId?.name || 'General'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="neutral">{tx.paymentMethod}</Badge>
                    </td>
                    <td
                      className={`py-3 text-right pr-1 font-semibold ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, user?.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Your recent transaction activity will show up here."
          />
        )}
      </Card>
    </div>
  );
};
