import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';

export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ type: 1, name: 1 });
    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;

    const existing = await Category.findOne({
      userId: req.user._id,
      name: new RegExp(`^${name.trim()}$`, 'i'),
      type,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A ${type} category named "${name}" already exists for your account`,
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: name.trim(),
      type,
      color: color || '#3b82f6',
      icon: icon || 'tag',
      isDefault: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, color, icon } = req.body;

    const category = await Category.findOne({ _id: id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to you',
      });
    }

    if (name) category.name = name.trim();
    if (type) category.type = type;
    if (color) category.color = color;
    if (icon) category.icon = icon;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to you',
      });
    }

    // Referential integrity check: Check if any transactions reference this category
    const transactionCount = await Transaction.countDocuments({
      userId: req.user._id,
      categoryId: id,
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because it is currently linked to ${transactionCount} transaction(s). Please reassign or delete these transactions first.`,
      });
    }

    // Check if any budgets reference this category
    const budgetCount = await Budget.countDocuments({
      userId: req.user._id,
      categoryId: id,
    });

    if (budgetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because it is assigned to ${budgetCount} active budget(s). Please remove those budgets first.`,
      });
    }

    await Category.deleteOne({ _id: id, userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
