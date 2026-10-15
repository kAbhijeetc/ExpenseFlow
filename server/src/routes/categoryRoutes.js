import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, updateCategorySchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCategories);
router.post('/', validate(categorySchema), createCategory);
router.patch('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
