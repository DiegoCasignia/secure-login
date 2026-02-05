import rateLimit from 'express-rate-limit';

// Rate limiting sin Redis (usando memoria local)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: 'RateLimitExceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos de login por IP
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    error: 'AuthRateLimitExceeded',
  },
  skipSuccessfulRequests: true,
});

export const faceVerificationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // 5 intentos de verificación facial por IP
  message: {
    success: false,
    message: 'Too many face verification attempts, please try again later.',
    error: 'FaceVerificationRateLimitExceeded',
  },
});