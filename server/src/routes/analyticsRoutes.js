import express from 'express';
import {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getDailyTrends,
  getBudgetUtilization,
  getTopCategories,
  getPaymentMethods,
  getMonthComparison,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trends', getMonthlyTrends);
router.get('/daily-trends', getDailyTrends);
router.get('/budget-utilization', getBudgetUtilization);
router.get('/top-categories', getTopCategories);
router.get('/payment-methods', getPaymentMethods);
router.get('/month-comparison', getMonthComparison);

export default router;
