import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { EmailService } from '../../../infrastructure/services/email/EmailService';
import { AppError } from '../../../utils/errors/AppError';
import { passwordService } from '../../../utils/security/password';

export class ForgotPasswordUseCase {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async execute(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new AppError('Valid email address is required', 400);
      }

      // Find user by email
      const user = await userRepository.findByEmail(email.toLowerCase());
      
      if (!user) {
        // Don't reveal if email exists (security best practice)
        // But still log the attempt
        await auditLogRepository.logSecurityEvent({
          userId: undefined,
          action: 'forgot_password_invalid_email',
          details: { email },
          ipAddress,
          userAgent,
          status: 'failed',
        });

        // Return generic message to prevent email enumeration
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Generate temporary password
      const temporaryPassword = passwordService.generateTemporaryPassword();

      // Hash the temporary password
      const hashedPassword = await passwordService.hash(temporaryPassword);

      // Update user password
      await userRepository.updatePassword(user.id, hashedPassword);

      // Send email with temporary password
      await this.emailService.sendTemporaryPassword(email, temporaryPassword);

      // Log successful password reset request
      await auditLogRepository.logSecurityEvent({
        userId: user.id,
        action: 'password_reset_requested',
        details: { email: user.email },
        ipAddress,
        userAgent,
        status: 'success',
      });

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process password reset request', 500);
    }
  }
}
