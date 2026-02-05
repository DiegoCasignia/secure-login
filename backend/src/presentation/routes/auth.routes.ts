import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate, refreshToken } from '../middlewares/auth';
import { authRateLimiter, faceVerificationRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email is too long'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),
});

const faceVerificationSchema = z.object({
  faceDescriptor: z.array(z.number())
    .length(128, 'Face descriptor must have exactly 128 dimensions')
    .refine(
      (arr) => arr.every(val => typeof val === 'number' && !isNaN(val)),
      'Face descriptor must contain only numbers'
    ),
});

const completeRegistrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),
  phone: z.string()
    .max(20, 'Phone number is too long')
    .optional()
    .transform(val => val?.trim() || undefined),
  faceDescriptor: z.array(z.number())
    .length(128, 'Face descriptor must have exactly 128 dimensions')
    .refine(
      (arr) => arr.every(val => typeof val === 'number' && !isNaN(val)),
      'Face descriptor must contain only numbers'
    ),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

// Public routes
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/verify-face',
  faceVerificationRateLimiter,
  authenticate,
  validate(faceVerificationSchema),
  authController.verifyFace
);

router.post(
  '/complete-registration',
  authenticate,
  validate(completeRegistrationSchema),
  authController.completeRegistration
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  refreshToken
);

router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  authController.logout
);

// Protected routes
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export default router;