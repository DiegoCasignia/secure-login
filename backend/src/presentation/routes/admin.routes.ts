import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate, validateParams, validateQuery } from '../middlewares/validation';
import { z } from 'zod';
import { UserRole } from '../../core/interfaces/IUser';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email is too long'),
  role: z.enum(['admin', 'client']),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters')
    .optional(),
  phone: z.string()
    .max(20, 'Phone number is too long')
    .optional()
    .transform(val => val?.trim() || undefined),
});

const updateUserSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters')
    .optional(),
  phone: z.string()
    .max(20, 'Phone number is too long')
    .optional()
    .transform(val => val?.trim() || undefined),
  status: z.enum(['active', 'inactive', 'pending', 'blocked'])
    .optional(),
  profileCompleted: z.boolean()
    .optional(),
});

const userIdSchema = z.object({
  id: z.string()
    .uuid('Invalid user ID format'),
});

const usersQuerySchema = z.object({
  email: z.string()
    .optional()
    .transform(val => val?.trim()),
  role: z.enum(['admin', 'client'])
    .optional(),
  status: z.enum(['active', 'inactive', 'pending', 'blocked'])
    .optional(),
  profileCompleted: z.string()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
    .optional(),
  search: z.string()
    .optional()
    .transform(val => val?.trim()),
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be positive')
    .optional()
    .default(1),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default(20),
});

const auditLogsQuerySchema = z.object({
  userId: z.string()
    .uuid('Invalid user ID format')
    .optional(),
  action: z.string()
    .optional()
    .transform(val => val?.trim()),
  status: z.enum(['success', 'failed'])
    .optional(),
  startDate: z.string()
    .datetime('Invalid start date format')
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be positive')
    .optional()
    .default(1),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default(50),
});

router.post(
  '/users',
  validate(createUserSchema),
  adminController.createUser
);

router.get(
  '/users',
  validateQuery(usersQuerySchema),
  adminController.getUsers
);

router.get(
  '/users/:id',
  validateParams(userIdSchema),
  adminController.getUserById
);

router.put(
  '/users/:id',
  validateParams(userIdSchema),
  validate(updateUserSchema),
  adminController.updateUser
);

// Audit logs
router.get(
  '/audit-logs',
  validateQuery(auditLogsQuerySchema),
  adminController.getAuditLogs
);

// Dashboard
router.get(
  '/dashboard/stats',
  adminController.getDashboardStats
);

export default router;