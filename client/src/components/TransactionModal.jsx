import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import api from '../api/client';
import { formatDateForInput } from '../utils/formatters';

export const TransactionModal = ({
  isOpen,
  onClose,
  transaction = null, // If provided, edit mode; else create mode
  onSuccess,
}) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDateForInput());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available categories whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      fetchCategories();
      if (transaction) {
        setType(transaction.type || 'expense');
        setAmount(transaction.amount?.toString() || '');
        setCategoryId(transaction.categoryId?._id || transaction.categoryId || '');
        setDescription(transaction.description || '');
        setDate(
          transaction.date
            ? formatDateForInput(new Date(transaction.date))
            : formatDateForInput()
        );
        setPaymentMethod(transaction.paymentMethod || 'UPI');
        setNotes(transaction.notes || '');
        setTags(
          Array.isArray(transaction.tags)
            ? transaction.tags.join(', ')
            : transaction.tags || ''
        );
      } else {
        // Reset defaults
        setType('expense');
        setAmount('');
        setCategoryId('');
        setDescription('');
        setDate(formatDateForInput());
        setPaymentMethod('UPI');
        setNotes('');
        setTags('');
      }
    }
  }, [isOpen, transaction]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Filter categories matching current active type (expense or income)
  const filteredCategories = categories.filter((c) => c.type === type);

  // Auto-select first category if current categoryId does not match current type
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const exists = filteredCategories.some((c) => c._id === categoryId);
      if (!exists && !transaction) {
        setCategoryId(filteredCategories[0]._id);
      }
    }
  }, [type, filteredCategories, categoryId, transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide an amount greater than zero');
      return;
    }

    if (!categoryId) {
      setError('Please select a valid category');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for this transaction');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        categoryId,
        description: description.trim(),
        date: new Date(date).toISOString(),
        paymentMethod,
        notes: notes.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      let result;
      if (transaction?._id) {
        result = await api.patch(`/transactions/${transaction._id}`, payload);
      } else {
        result = await api.post('/transactions', payload);
      }

      if (onSuccess) {
        onSuccess(result.data.transaction);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Record New Transaction'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg">
            {error}
          </div>
        )}

        {/* Transaction Type Segmented Switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount & Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
        </div>

        {/* Category & Payment Method row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            >
              <option value="" disabled>
                Select category...
              </option>
              {filteredCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            >
              <option value="UPI">UPI</option>
              <option value="card">Card (Debit/Credit)</option>
              <option value="cash">Cash</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description *
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Grocery shopping, Monthly salary..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          />
        </div>

        {/* Notes & Tags row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. dining, campus, personal"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {transaction ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
