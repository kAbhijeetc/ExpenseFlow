import { analyticsService } from '../services/analyticsService.js';

export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getSummary(req.user._id, startDate, endDate);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    const data = await analyticsService.getCategoryBreakdown(req.user._id, startDate, endDate, type);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;
    const data = await analyticsService.getMonthlyTrends(req.user._id, months);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getDailyTrends = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getDailyTrends(req.user._id, startDate, endDate);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getBudgetUtilization = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await analyticsService.getBudgetUtilization(req.user._id, month, year);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTopCategories = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const data = await analyticsService.getTopCategories(req.user._id, startDate, endDate, limit);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getPaymentMethodAnalysis(req.user._id, startDate, endDate);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMonthComparison = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await analyticsService.getMonthOverMonthComparison(req.user._id, month, year);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
