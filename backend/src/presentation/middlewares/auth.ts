import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { AppError } from '../../utils/errors/AppError';
import { sessionRepository } from '../../infrastructure/repositories/SessionRepository';
import { UserRole } from '../../core/interfaces/IUser';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        profileCompleted: boolean;
        requiresFaceVerification?: boolean;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log(res.req.rawHeaders)
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        profileCompleted: decoded.profileCompleted,
        requiresFaceVerification: decoded.requiresFaceVerification,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(res.req.rawHeaders)
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!requiredRoles.includes(req.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireProfileCompleted = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(res.req.rawHeaders)
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.profileCompleted) {
      throw new AppError('Profile not completed', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token exists and is valid
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    
    if (!session) {
      console.log('refreshToken', refreshToken)
      throw new AppError('Invalid refresh token', 401);
    }

    if (session.expiresAt < new Date()) {
      await sessionRepository.delete(refreshToken);
      throw new AppError('Refresh token expired', 401);
    }

    // Get user
    const { userRepository } = require('../../infrastructure/repositories/UserRepository');
    const user = await userRepository.findById(session.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new access token
    const jwt = require('jsonwebtoken');
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );

    // Return new tokens
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: refreshToken, // Same refresh token, rotated in production
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profileCompleted: user.profileCompleted,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};