import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { AppError } from '../../../utils/errors/AppError';
import { passwordService } from '../../../utils/security/password';

export interface IChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class ChangePasswordUseCase {
  async execute(
    request: IChangePasswordRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, currentPassword, newPassword, confirmPassword } = request;

      // Validate user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate new password matches confirmation
      if (newPassword !== confirmPassword) {
        throw new AppError('New passwords do not match', 400);
      }

      // Validate new password format
      const passwordValidation = passwordService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Invalid password: ${passwordValidation.errors.join(', ')}`,
          400
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await passwordService.compare(
        currentPassword,
        user.passwordHash
      );
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Prevent reusing the same password
      if (currentPassword === newPassword) {
        throw new AppError('New password cannot be the same as current password', 400);
      }

      // Hash new password
      const hashedPassword = await passwordService.hash(newPassword);

      // Update password
      await userRepository.updatePassword(userId, hashedPassword);

      // Log security event
      await auditLogRepository.logSecurityEvent({
        userId,
        action: 'password_changed',
        details: { email: user.email },
        ipAddress,
        userAgent,
        status: 'success',
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to change password', 500);
    }
  }
}
