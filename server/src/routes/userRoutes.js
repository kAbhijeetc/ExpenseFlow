import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', validate(updateProfileSchema), updateProfile);
router.patch('/me/password', validate(changePasswordSchema), changePassword);

export default router;
