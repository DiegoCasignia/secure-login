import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { VerifyFaceUseCase } from '../../application/use-cases/auth/VerifyFaceUseCase';
import { CompleteRegistrationUseCase } from '../../application/use-cases/user/CompleteRegistrationUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/user/ChangePasswordUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/auth/ForgotPasswordUseCase';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase';
import { AppError } from '../../utils/errors/AppError';
import { ApiResponse } from '../../core/types';

export class AuthController {
  private loginUseCase: LoginUseCase;
  private verifyFaceUseCase: VerifyFaceUseCase;
  private completeRegistrationUseCase: CompleteRegistrationUseCase;
  private changePasswordUseCase: ChangePasswordUseCase;
  private forgotPasswordUseCase: ForgotPasswordUseCase;
  private logoutUseCase: LogoutUseCase;

  constructor() {
    this.loginUseCase = new LoginUseCase();
    this.verifyFaceUseCase = new VerifyFaceUseCase();
    this.completeRegistrationUseCase = new CompleteRegistrationUseCase();
    this.changePasswordUseCase = new ChangePasswordUseCase();
    this.forgotPasswordUseCase = new ForgotPasswordUseCase();
    this.logoutUseCase = new LogoutUseCase();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await this.loginUseCase.execute(
        { email, password },
        ipAddress,
        userAgent
      );

      console.log(result)

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error instanceof AppError && error.statusCode === 403 && error.data?.requiresFaceVerification) {
        // Special case for face verification required
        const response: ApiResponse = {
          success: false,
          data: error.data,
          message: error.message,
        };
        res.status(403).json(response);
      } else {
        this.handleError(res, error);
      }
    }
  };

  verifyFace = async (req: Request, res: Response): Promise<void> => {
    try {
      const { faceDescriptor } = req.body;
      const userId = req.user?.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!userId) {
        throw new AppError('User ID not found in token', 401);
      }

      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        throw new AppError('Face descriptor is required', 400);
      }

      const result = await this.verifyFaceUseCase.execute(
        userId,
        faceDescriptor,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  completeRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, phone, faceDescriptor } = req.body;
      const userId = req.user?.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!userId) {
        throw new AppError('User ID not found in token', 401);
      }

      if (!firstName || !lastName) {
        throw new AppError('First name and last name are required', 400);
      }

      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        throw new AppError('Face descriptor is required', 400);
      }

      const result = await this.completeRegistrationUseCase.execute(
        {
          userId,
          firstName,
          lastName,
          phone,
          faceDescriptor,
        },
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      await this.logoutUseCase.execute(
        { refreshToken },
        userId,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      // Note: Token refresh logic is handled in middleware
      // This endpoint is just for the client to request new tokens
      const response: ApiResponse = {
        success: true,
        message: 'Use the middleware endpoint for token refresh',
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Note: User fetching logic would be in a separate use case
      // For now, just return basic info from token
      const response: ApiResponse = {
        success: true,
        data: {
          userId: req.user?.userId,
          email: req.user?.email,
          role: req.user?.role,
          profileCompleted: req.user?.profileCompleted,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user?.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError('Current password, new password, and confirmation are required', 400);
      }

      const result = await this.changePasswordUseCase.execute(
        {
          userId,
          currentPassword,
          newPassword,
          confirmPassword,
        },
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const result = await this.forgotPasswordUseCase.execute(
        email,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: any): void {
    console.error('AuthController error:', error);

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

export const authController = new AuthController();