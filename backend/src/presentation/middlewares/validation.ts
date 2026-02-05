import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ParamsDictionary } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {        
        return res.status(400).json({
          success: false,
          message: 'Validation failed'
        });
      }
      
      req.body = result.data;
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {       
        return res.status(400).json({
          success: false,
          message: 'Invalid URL parameters'
        });
      }

      req.params = result.data as ParamsDictionary;
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters'
        });
      }

      req.validatedQuery = result.data;
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
};

// Special validator for face descriptors
export const validateFaceDescriptor = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { faceDescriptor } = req.body;
      
      if (!faceDescriptor) {
        return res.status(400).json({
          success: false,
          message: 'Face descriptor is required',
          errors: [{ field: 'faceDescriptor', message: 'Face descriptor is required' }],
        });
      }

      if (!Array.isArray(faceDescriptor)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid face descriptor format',
          errors: [{ field: 'faceDescriptor', message: 'Face descriptor must be an array' }],
        });
      }

      if (faceDescriptor.length !== 128) {
        return res.status(400).json({
          success: false,
          message: 'Invalid face descriptor dimensions',
          errors: [{
            field: 'faceDescriptor',
            message: `Face descriptor must have exactly 128 dimensions, got ${faceDescriptor.length}`,
          }],
        });
      }

      // Check if all values are numbers
      for (let i = 0; i < faceDescriptor.length; i++) {
        if (typeof faceDescriptor[i] !== 'number' || isNaN(faceDescriptor[i])) {
          return res.status(400).json({
            success: false,
            message: 'Invalid face descriptor values',
            errors: [{
              field: `faceDescriptor[${i}]`,
              message: 'Must be a valid number',
            }],
          });
        }
      }

      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
};