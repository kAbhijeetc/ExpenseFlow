import React, { useState, useEffect, useCallback } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  BookOpen,
  HeartPulse,
  Film,
  Briefcase,
  Laptop,
  TrendingUp,
  Tag,
  Coffee,
  Home,
  Gift,
  Dumbbell,
  Plane,
} from 'lucide-react';
import api from '../api/client';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CategoryIcon } from '../components/CategoryIcon';
import { TableSkeleton } from '../components/LoadingSkeleton';

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

const AVAILABLE_ICONS = [
  'tag',
  'utensils',
  'car',
  'shopping-bag',
  'zap',
  'book-open',
  'heart-pulse',
  'film',
  'coffee',
  'home',
  'briefcase',
  'laptop',
  'trending-up',
  'gift',
  'dumbbell',
  'plane',
];

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('tag');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setIcon('tag');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || '#3b82f6');
    setIcon(cat.icon || 'tag');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a category name');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory._id}`, {
          name: name.trim(),
          type,
          color,
          icon,
        });
      } else {
        await api.post('/categories', {
          name: name.trim(),
          type,
          color,
          icon,
        });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/categories/${deleteConfirm._id}`);
      setDeleteConfirm(null);
      fetchCategories();
    } catch (err) {
      setDeleteError(err.message || 'Cannot delete category');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Category Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize personal finance streams with custom colors, icons, and types
          </p>
        </div>

        <Button icon={Plus} size="sm" onClick={handleOpenCreate}>
          Add Category
        </Button>
      </div>

      {/* Tabs Switcher: Expense vs Income */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'expense'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Expense Categories ({categories.filter((c) => c.type === 'expense').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'income'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Income Categories ({categories.filter((c) => c.type === 'income').length})
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <Card
              key={cat._id}
              className="hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  >
                    <CategoryIcon
                      iconName={cat.icon}
                      className="w-5 h-5 text-white"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {cat.type} {cat.isDefault && '• System Default'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setDeleteConfirm(cat);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            No {activeTab} categories found.
          </p>
          <Button size="sm" onClick={handleOpenCreate}>
            Add Custom Category
          </Button>
        </Card>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Custom Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Subscriptions, Gaming, Dividend..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Classification *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Expense Category
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  type === 'income'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Income Category
              </button>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-sky-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CategoryIcon iconName={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
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
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Category"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg">
              {deleteError}
            </div>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete category{' '}
            <strong className="text-slate-900 dark:text-white">
              "{deleteConfirm?.name}"
            </strong>
            ?
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Note: MongoDB referential integrity rules prevent removing any category
            that is currently attached to existing transactions or active budgets.
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
              onClick={handleDeleteCategory}
              loading={deleting}
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
