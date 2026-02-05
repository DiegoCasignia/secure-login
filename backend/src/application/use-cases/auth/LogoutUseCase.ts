import { sessionRepository } from '../../../infrastructure/repositories/SessionRepository';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { ILogoutRequest } from '../../../core/interfaces/IAuth';
import { AppError } from '../../../utils/errors/AppError';

export class LogoutUseCase {
  async execute(
    request: ILogoutRequest,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const { refreshToken } = request;

      // Verify refresh token exists and is valid
      const session = await sessionRepository.findByRefreshToken(refreshToken);
      
      if (!session) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Verify ownership if userId is provided
      if (userId && session.userId !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      // Delete the session
      await sessionRepository.delete(refreshToken);

      // Log the event
      await auditLogRepository.logSecurityEvent({
        userId: session.userId,
        action: 'logout',
        details: { method: 'refresh_token' },
        ipAddress,
        userAgent,
        status: 'success',
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Logout failed', 500);
    }
  }
}