import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors/AppError';
import { ApiResponse } from '../../core/types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(next)
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: error.message,
      error: error.name,
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid token',
      error: 'InvalidToken',
    };
    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      message: 'Token expired',
      error: 'TokenExpired',
    };
    res.status(401).json(response);
    return;
  }

  // Default error
  const response: ApiResponse = {
    success: false,
    message: 'Internal server error',
    error: 'InternalError',
  };
  res.status(500).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(next)
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'NotFound',
  };
  res.status(404).json(response);
};