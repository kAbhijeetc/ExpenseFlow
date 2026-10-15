import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export const BudgetsPage = () => {
  const { user } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [budgetData, setBudgetData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formThreshold, setFormThreshold] = useState('80');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch expense categories for budget assignment
  useEffect(() => {
    const fetchExpenseCategories = async () => {
      try {
        const res = await api.get('/categories?type=expense');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchExpenseCategories();
  }, []);

  // Fetch budgets for selected month and year
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/budgets?month=${selectedMonth}&year=${selectedYear}`
      );
      setBudgetData(res.data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setFormCategoryId(categories[0]?._id || '');
    setFormAmount('');
    setFormThreshold('80');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setFormCategoryId(budget.categoryId?._id || budget.categoryId);
    setFormAmount(budget.amount.toString());
    setFormThreshold(budget.alertThreshold?.toString() || '80');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Budget limit must be greater than zero');
      return;
    }

    const parsedThreshold = parseInt(formThreshold, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 1 || parsedThreshold > 100) {
      setFormError('Alert threshold must be between 1% and 100%');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBudget) {
        await api.patch(`/budgets/${editingBudget._id}`, {
          amount: parsedAmount,
          alertThreshold: parsedThreshold,
        });
      } else {
        await api.post('/budgets', {
          categoryId: formCategoryId,
          amount: parsedAmount,
          month: selectedMonth,
          year: selectedYear,
          alertThreshold: parsedThreshold,
        });
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      setFormError(err.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/budgets/${deleteConfirm._id}`);
      setDeleteConfirm(null);
      fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    } finally {
      setDeleting(false);
    }
  };

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Monthly Category Budgets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set target limits per expense category and monitor real-time utilization
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {months.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Button icon={Plus} size="sm" onClick={handleOpenCreateModal}>
            Set Budget
          </Button>
        </div>
      </div>

      {/* Monthly Budget Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Budgeted
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(budgetData?.summary?.totalBudget || 0, user?.currency)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Target cap across all categories</p>
        </Card>

        <Card>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Actual Spent
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(budgetData?.summary?.totalSpent || 0, user?.currency)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Calculated from actual transactions</p>
        </Card>

        <Card>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Remaining Room
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              (budgetData?.summary?.remaining || 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(budgetData?.summary?.remaining || 0, user?.currency)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Unspent allocation buffer</p>
        </Card>

        <Card>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Overall Utilization
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatPercentage(budgetData?.summary?.overallPercentage || 0)}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (budgetData?.summary?.overallPercentage || 0) > 100
                  ? 'bg-rose-500'
                  : (budgetData?.summary?.overallPercentage || 0) > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(budgetData?.summary?.overallPercentage || 0, 100)}%`,
              }}
            />
          </div>
        </Card>
      </div>

      {/* Grid of Budget Cards */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : budgetData?.budgets?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgetData.budgets.map((b) => {
            const isOver = b.isExceeded;
            const isNear = b.isNearThreshold;
            const pct = Math.min(b.percentageUsed, 100);

            return (
              <Card
                key={b._id}
                className={`transition-all hover:shadow-md ${
                  isOver
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : isNear
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : ''
                }`}
              >
                {/* Header with Category Icon and Status Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: b.categoryId?.color || '#3b82f6' }}
                    >
                      <CategoryIcon
                        iconName={b.categoryId?.icon}
                        className="w-5 h-5 text-white"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {b.categoryId?.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Alert at {b.alertThreshold}%
                      </span>
                    </div>
                  </div>

                  <div>
                    {isOver ? (
                      <Badge variant="danger">Exceeded</Badge>
                    ) : isNear ? (
                      <Badge variant="warning">Near Limit</Badge>
                    ) : (
                      <Badge variant="success">On Track</Badge>
                    )}
                  </div>
                </div>

                {/* Numbers */}
                <div className="py-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Spent:</span>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.actualSpent, user?.currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Budget Limit:</span>
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {formatCurrency(b.amount, user?.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-500 dark:text-slate-400">
                        {b.percentageUsed}% used
                      </span>
                      <span
                        className={
                          b.remaining >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400 font-semibold'
                        }
                      >
                        {b.remaining >= 0
                          ? `${formatCurrency(b.remaining, user?.currency)} left`
                          : `${formatCurrency(Math.abs(b.remaining), user?.currency)} over`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
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
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(b)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit budget"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(b)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title={`No budgets set for ${months.find((m) => m.num === selectedMonth)?.name} ${selectedYear}`}
          description="Create category budgets to gain spending visibility and receive threshold alerts."
          actionText="Create Category Budget"
          onAction={handleOpenCreateModal}
        />
      )}

      {/* Create / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'Configure Monthly Budget'}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              disabled={!!editingBudget}
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm disabled:opacity-60"
            >
              <option value="" disabled>
                Select expense category...
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Budget Amount ({user?.currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alert Warning Threshold (%) *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={formThreshold}
              onChange={(e) => setFormThreshold(e.target.value)}
              placeholder="80"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Flag warning badge once spending reaches this percent of the budget.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingBudget ? 'Update Budget' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Monthly Budget"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to remove the budget for category{' '}
            <strong className="text-slate-900 dark:text-white">
              "{deleteConfirm?.categoryId?.name}"
            </strong>
            ? This will not delete any associated transactions.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteBudget}
              loading={deleting}
            >
              Delete Budget
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
