// routes/auth.js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, try again later' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, me);

export default router;