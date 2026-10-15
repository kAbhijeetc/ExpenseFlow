import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  PieChart as PieIcon,
  CreditCard,
  TrendingUp,
  BarChart3,
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
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TableSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const CHART_COLORS = [
  '#0284c7',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#64748b',
];

export const ReportsPage = () => {
  const { user } = useAuth();

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    .toISOString()
    .split('T')[0];
  const defaultEnd = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(true);

  // Aggregated reports state
  const [summary, setSummary] = useState(null);
  const [categoryReport, setCategoryReport] = useState([]);
  const [paymentReport, setPaymentReport] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, payRes, trendRes] = await Promise.all([
        api.get(`/analytics/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get(
          `/analytics/category-breakdown?startDate=${startDate}&endDate=${endDate}&type=expense`
        ),
        api.get(
          `/analytics/payment-methods?startDate=${startDate}&endDate=${endDate}`
        ),
        api.get('/analytics/monthly-trends?months=6'),
      ]);

      setSummary(sumRes.data.data);
      setCategoryReport(catRes.data.data?.breakdown || []);
      setPaymentReport(payRes.data.data || []);
      setMonthlyTrends(trendRes.data.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCsv = () => {
    window.open(
      `/api/transactions/export/csv?startDate=${startDate}&endDate=${endDate}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deep analytical aggregation reports across categories, payment channels, and time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <Button icon={Download} size="sm" onClick={handleExportCsv}>
            Export Filtered CSV
          </Button>
        </div>
      </div>

      {/* Period High-Level Summary Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Selected Period Income
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrency(summary?.totalIncome || 0, user?.currency)}
            </div>
            <span className="text-xs text-slate-500">
              {summary?.incomeCount || 0} credited events
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Selected Period Expense
            </span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrency(summary?.totalExpense || 0, user?.currency)}
            </div>
            <span className="text-xs text-slate-500">
              {summary?.expenseCount || 0} spending transactions
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Net Period Savings
            </span>
            <div
              className={`text-2xl font-bold mt-1 ${
                (summary?.netBalance || 0) >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary?.netBalance || 0, user?.currency)}
            </div>
            <span className="text-xs text-slate-500">Cash surplus/deficit</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Savings Efficiency
            </span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatPercentage(summary?.savingsRate || 0)}
            </div>
            <span className="text-xs text-slate-500">Share of income saved</span>
          </div>
        </div>
      </Card>

      {/* Category Expense Distribution Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Category-wise Expense Breakdown"
          subtitle="Detailed expenditure grouped by category with pipeline aggregation"
        >
          {loading ? (
            <TableSkeleton rows={5} />
          ) : categoryReport.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3 pl-1">Category</th>
                    <th className="pb-3 text-right">Count</th>
                    <th className="pb-3 text-right">Total Spent</th>
                    <th className="pb-3 text-right pr-1">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {categoryReport.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pl-1">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon
                            iconName={cat.icon}
                            color={cat.color}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {cat.categoryName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-xs text-slate-500">
                        {cat.transactionCount}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(cat.totalAmount, user?.currency)}
                      </td>
                      <td className="py-2.5 text-right pr-1">
                        <Badge variant="primary">{cat.percentage}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title="No category data"
              description="No expense transactions found within the chosen timeframe."
            />
          )}
        </Card>

        {/* Payment Channels Report */}
        <Card
          title="Payment Method Distribution"
          subtitle="Expenditure analyzed across payment channels"
        >
          {loading ? (
            <ChartSkeleton />
          ) : paymentReport.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentReport}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="method" fontSize={11} tickLine={false} />
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
                    <Bar dataKey="totalSpent" name="Total Spent" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paymentReport.map((pm, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {pm.method}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-500">{pm.transactionCount} txs</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(pm.totalSpent, user?.currency)}
                      </span>
                      <Badge variant="neutral">{pm.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No payment method data"
              description="Add expenses with payment methods to generate payment channel analytics."
            />
          )}
        </Card>
      </div>

      {/* Multi-month comparative ledger breakdown */}
      <Card
        title="6-Month Cash Flow Comparative Table"
        subtitle="Chronological summary of income, expenses, and net surplus"
      >
        {monthlyTrends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="pb-3 pl-1">Month / Year</th>
                  <th className="pb-3 text-right">Transactions</th>
                  <th className="pb-3 text-right">Gross Income</th>
                  <th className="pb-3 text-right">Total Expenses</th>
                  <th className="pb-3 text-right pr-1">Net Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {monthlyTrends.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-1 font-semibold text-slate-900 dark:text-white">
                      {row.label}
                    </td>
                    <td className="py-3 text-right text-xs text-slate-500">
                      {row.count}
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(row.income, user?.currency)}
                    </td>
                    <td className="py-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrency(row.expense, user?.currency)}
                    </td>
                    <td
                      className={`py-3 text-right pr-1 font-bold ${
                        row.netBalance >= 0
                          ? 'text-slate-900 dark:text-white'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(row.netBalance, user?.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No monthly data"
            description="Multi-month ledger rows will compile here automatically."
          />
        )}
      </Card>
    </div>
  );
};
