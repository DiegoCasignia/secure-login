import bcrypt from 'bcryptjs';
import { config } from '../../config/env';
import * as crypto from 'node:crypto';

export class PasswordService {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, config.security.bcryptRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateTemporaryPassword(length = 12): string {
    const charsets = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*'
    };

    const allChars = Object.values(charsets).join('');
    const randomBytes = crypto.randomBytes(length * 4); // Extra bytes

    let byteIndex = 0;
    let password = '';

    // Asegurar al menos uno de cada tipo
    password += charsets.uppercase[randomBytes[byteIndex++] % charsets.uppercase.length];
    password += charsets.lowercase[randomBytes[byteIndex++] % charsets.lowercase.length];
    password += charsets.numbers[randomBytes[byteIndex++] % charsets.numbers.length];
    password += charsets.symbols[randomBytes[byteIndex++] % charsets.symbols.length];

    // Llenar el resto
    for (let i = 4; i < length; i++) {
      password += allChars[randomBytes[byteIndex++] % allChars.length];
    }

    // Fisher-Yates shuffle
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = randomBytes[byteIndex++] % (i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join('');
  }

  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const passwordService = new PasswordService();