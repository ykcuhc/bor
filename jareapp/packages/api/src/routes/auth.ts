import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { otpLimiter } from '../middleware/rateLimiter';
import {
  sendOtp,
  verifyOtp,
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from '../controllers/auth.controller';

const router = Router();

router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
