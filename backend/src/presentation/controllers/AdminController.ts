import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/admin/CreateUserUseCase';
import { userRepository } from '../../infrastructure/repositories/UserRepository';
import { auditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { AppError } from '../../utils/errors/AppError';
import { ApiResponse, PaginatedResponse } from '../../core/types';
import { UserRole, UserStatus, IUserFilters, ICreateUser } from '../../core/interfaces/IUser';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}

export class AdminController {
  private createUserUseCase: CreateUserUseCase;

  constructor() {
    this.createUserUseCase = new CreateUserUseCase();
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role, firstName, lastName, phone } = req.body;
      const adminUserId = req.user?.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!adminUserId) {
        throw new AppError('Unauthorized', 401);
      }

      if (!email || !role) {
        throw new AppError('Email and role are required', 400);
      }

      if (!Object.values(UserRole).includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      const result = await this.createUserUseCase.execute(
        { email, role, firstName, lastName, phone } as ICreateUser,
        adminUserId,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'User created successfully. Temporary password sent via email.',
      };

      res.status(201).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        role,
        status,
        profileCompleted,
        search,
        page = 1,
        limit = 20,
      } = req.validatedQuery || {};

      const filters: IUserFilters = {
        email: email as string,
        role: role as UserRole,
        status: status as UserStatus,
        profileCompleted: profileCompleted === 'true' ? true : profileCompleted === 'false' ? false : undefined,
        search: search as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      };

      const result = await userRepository.findAll(filters);

      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
          data: result.data.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            profileCompleted: user.profileCompleted,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
          meta: result.meta,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.userId;

      if (!adminUserId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await userRepository.findById(id as string);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          profileCompleted: user.profileCompleted,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          failedLoginAttempts: user.failedLoginAttempts,
          lockUntil: user.lockUntil,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, status, profileCompleted } = req.body;
      const adminUserId = req.user?.userId;

      if (!adminUserId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await userRepository.update(id as string, {
        firstName,
        lastName,
        phone,
        status: status as UserStatus,
        profileCompleted,
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Log the event
      await auditLogRepository.logSecurityEvent({
        userId: adminUserId,
        action: 'user_updated',
        details: {
          updatedUserId: id,
          fields: { firstName, lastName, phone, status, profileCompleted },
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'success',
      });

      const response: ApiResponse = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          profileCompleted: user.profileCompleted,
        },
        message: 'User updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        userId,
        action,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.validatedQuery || {};

      const filters = {
        userId: userId as string,
        action: action as string,
        status: status as 'success' | 'failed',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 50,
      };

      const result = await auditLogRepository.findAll(filters);

      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUserId = req.user?.userId;

      if (!adminUserId) {
        throw new AppError('Unauthorized', 401);
      }

      // Get user counts
      const totalUsers = await userRepository.count();
      
      // Get today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's audit logs for login stats
      const todayLogs = await auditLogRepository.findAll({
        action: 'login_password_success',
        startDate: today,
        endDate: tomorrow,
        limit: 1000, // Get all today's logs
      });

      const todayLoginCount = todayLogs.data.length;

      // Get pending registrations
      const pendingUsers = await userRepository.findAll({
        status: UserStatus.PENDING,
        limit: 1000,
      });

      // Get face verification success rate (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const faceLogs = await auditLogRepository.findAll({
        action: 'face_verification_%',
        startDate: weekAgo,
        limit: 1000,
      });

      const successfulFaceVerifications = faceLogs.data.filter(
        log => log.action === 'face_verification_success'
      ).length;
      
      const totalFaceVerifications = faceLogs.data.length;
      const faceVerificationSuccessRate = totalFaceVerifications > 0
        ? (successfulFaceVerifications / totalFaceVerifications) * 100
        : 0;

      const response: ApiResponse = {
        success: true,
        data: {
          totalUsers,
          activeUsers: totalUsers, // Simplified - would need actual active user logic
          pendingRegistrations: pendingUsers.meta.total,
          todayLogins: todayLoginCount,
          facialAuthSuccessRate: parseFloat(faceVerificationSuccessRate.toFixed(2)),
          failedAttempts: 0, // Would need to calculate from failed login attempts
        },
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: any): void {
    console.error('AdminController error:', error);

    if (error instanceof AppError) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.name,
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        error: 'InternalError',
      };
      res.status(500).json(response);
    }
  }
}

export const adminController = new AdminController();