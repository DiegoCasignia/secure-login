import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  profileCompleted: boolean;
  requiresFaceVerification?: boolean;
}

class JwtService {
  generateAccessToken(
    payload: Omit<JwtPayload, 'requiresFaceVerification'> & { requiresFaceVerification?: boolean },
    expiresIn = config.jwt.accessExpiry
  ): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn });
  }

  generateRefreshToken(): string {
    return uuidv4();
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  getRefreshTokenExpiry(): Date {
    const expiry = config.jwt.refreshExpiry;
    const now = new Date();

    if (expiry.endsWith('d')) {
      const days = parseInt(expiry.slice(0, -1));
      now.setDate(now.getDate() + days);
    } else if (expiry.endsWith('h')) {
      const hours = parseInt(expiry.slice(0, -1));
      now.setHours(now.getHours() + hours);
    } else if (expiry.endsWith('m')) {
      const minutes = parseInt(expiry.slice(0, -1));
      now.setMinutes(now.getMinutes() + minutes);
    } else {
      now.setDate(now.getDate() + 7);
    }

    return now;
  }
}

export const jwtService = new JwtService();