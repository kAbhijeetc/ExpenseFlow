import express from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCsv,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { transactionSchema, updateTransactionSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/export/csv', exportTransactionsCsv);
router.get('/', getTransactions);
router.post('/', validate(transactionSchema), createTransaction);
router.get('/:id', getTransactionById);
router.patch('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
