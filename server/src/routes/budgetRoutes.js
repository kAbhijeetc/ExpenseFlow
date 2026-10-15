import express from 'express';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { budgetSchema, updateBudgetSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBudgets);
router.post('/', validate(budgetSchema), createBudget);
router.patch('/:id', validate(updateBudgetSchema), updateBudget);
router.delete('/:id', deleteBudget);

export default router;
