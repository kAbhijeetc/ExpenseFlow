import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Tag,
  FileText,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { TransactionModal } from '../components/TransactionModal';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, formatDate } from '../utils/formatters';

export const TransactionsPage = () => {
  const { user } = useAuth();
  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  // Filter States
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Data & State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null); // null = add, object = edit
  const [deleteConfirmTx, setDeleteConfirmTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Category choices for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Transactions from API
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      if (search.trim()) params.append('search', search.trim());
      if (type) params.append('type', type);
      if (categoryId) params.append('categoryId', categoryId);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, totalRecords: 0 });
      setSummary(res.data.summary || { totalIncome: 0, totalExpense: 0, netBalance: 0 });
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, type, categoryId, paymentMethod, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  // Handle Export to CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (type) params.append('type', type);
    if (categoryId) params.append('categoryId', categoryId);
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    window.open(`/api/transactions/export/csv?${params.toString()}`, '_blank');
  };

  // Delete transaction handler
  const handleDeleteTransaction = async () => {
    if (!deleteConfirmTx) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${deleteConfirmTx._id}`);
      setDeleteConfirmTx(null);
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setType('');
    setCategoryId('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Record, audit, filter, and export all personal finance transactions
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCsv}
            size="sm"
          >
            Export CSV
          </Button>
          <Button
            icon={Plus}
            onClick={() => {
              setSelectedTx(null);
              setIsAddEditOpen(true);
            }}
            size="sm"
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-4" bodyClassName="p-0">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, notes, or tags..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">All Types (Income & Expense)</option>
                <option value="expense">Expense Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {/* Payment Method */}
            <div>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">All Payment Methods</option>
                <option value="UPI">UPI</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="bank transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                title="Start Date"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                title="End Date"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Reset Filters button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={resetFilters}
                size="sm"
                className="w-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Filtered Dataset Totals Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-500 dark:text-slate-400">
              Filtered Records: <strong className="text-slate-900 dark:text-white">{pagination.totalRecords}</strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Income: <strong className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(summary.totalIncome, user?.currency)}</strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Expenses: <strong className="text-rose-600 dark:text-rose-400">-{formatCurrency(summary.totalExpense, user?.currency)}</strong>
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Net Balance:{' '}
              <strong className={summary.netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}>
                {formatCurrency(summary.netBalance, user?.currency)}
              </strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Transactions Data Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th
                    className="py-3.5 pl-5 pr-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Method</th>
                  <th
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-3.5 pl-5 pr-3 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Description and notes/tags */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {tx.description}
                      </div>
                      {tx.notes && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                      {Array.isArray(tx.tags) && tx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tx.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon
                          iconName={tx.categoryId?.icon}
                          color={tx.categoryId?.color}
                          className="w-4 h-4"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {tx.categoryId?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <Badge variant="neutral">{tx.paymentMethod}</Badge>
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3.5 px-3 text-right font-semibold whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, user?.currency)}
                    </td>

                    {/* Action buttons (Edit & Delete) */}
                    <td className="py-3.5 pr-5 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTx(tx);
                            setIsAddEditOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTx(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions match your criteria"
            description="Try modifying search queries or clearing active filters to reveal transactions."
            actionText="Clear Filters"
            onAction={resetFilters}
          />
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} total records)
            </span>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setSelectedTx(null);
        }}
        transaction={selectedTx}
        onSuccess={() => fetchTransactions()}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmTx}
        onClose={() => setDeleteConfirmTx(null)}
        title="Confirm Transaction Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete the transaction{' '}
            <strong className="text-slate-900 dark:text-white">
              "{deleteConfirmTx?.description}"
            </strong>{' '}
            amounting to{' '}
            <strong className="text-slate-900 dark:text-white">
              {formatCurrency(deleteConfirmTx?.amount, user?.currency)}
            </strong>? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmTx(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteTransaction}
              loading={deleting}
            >
              Delete Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
