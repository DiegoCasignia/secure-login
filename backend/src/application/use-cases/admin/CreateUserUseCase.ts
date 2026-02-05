import bcrypt from 'bcryptjs';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { emailService } from '../../../infrastructure/services/email/EmailService';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { ICreateUser } from '../../../core/interfaces/IUser';
import { AppError } from '../../../utils/errors/AppError';
import { UserRole } from '../../../core/interfaces/IUser';
import { config } from '../../../config/env';

export class CreateUserUseCase {
  async execute(
    data: ICreateUser,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ id: string; email: string; temporaryPassword: string }> {
    try {
      const { email, role, firstName, lastName, phone } = data;

      // Validate email
      const existingUser = await userRepository.findByEmail(email.toLowerCase());
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, config.security.bcryptRounds);

      // Create user
      const user = await userRepository.create({
        email: email.toLowerCase(),
        password: passwordHash,
        role,
        firstName,
        lastName,
        phone,
      });

      // Send email with temporary password
      try {
        await emailService.sendTemporaryPassword(email, temporaryPassword);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the operation if email fails
      }

      // Log the event
      await auditLogRepository.logSecurityEvent({
        userId: adminUserId,
        action: 'user_created',
        details: {
          createdUserId: user.id,
          email: user.email,
          role: user.role,
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      return {
        id: user.id,
        email: user.email,
        temporaryPassword,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create user', 500);
    }
  }

  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}