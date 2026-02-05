import bcrypt from 'bcryptjs';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { ILoginRequest, ILoginResponse } from '../../../core/interfaces/IAuth';
import { AppError } from '../../../utils/errors/AppError';
import { jwtService } from '../../../utils/security/jwt';
import { sessionRepository } from '../../../infrastructure/repositories/SessionRepository';
import { UserStatus } from '../../../core/interfaces/IUser';

export class LoginUseCase {
  async execute(
    request: ILoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ILoginResponse> {
    try {
      const { email, password } = request;
      
      const user = await userRepository.findByEmail(email.toLowerCase());
      console.log(user)
      
      if (!user) {
        await this.logFailedAttempt(null, email, ipAddress, userAgent, 'User not found');
        throw new AppError('Invalid credentials', 401);
      }
      
      if (user.lockUntil && user.lockUntil > new Date()) {
        await this.logFailedAttempt(user.id, email, ipAddress, userAgent, 'Account locked');
        throw new AppError('Account is temporarily locked. Try again later.', 423);
      }
      
      if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING) {
        await this.logFailedAttempt(user.id, email, ipAddress, userAgent, `Account status: ${user.status}`);
        throw new AppError('Account is not active', 403);
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        await userRepository.updateLoginStats(user.id, false);
        await this.logFailedAttempt(user.id, email, ipAddress, userAgent, 'Invalid password');
        throw new AppError('Invalid credentials', 401);
      }
      
      if (!user.profileCompleted) {
        
        await userRepository.updateLoginStats(user.id, true);
        
        await auditLogRepository.logSecurityEvent({
          userId: user.id,
          action: 'login_password_success',
          details: { profileCompleted: false },
          ipAddress,
          userAgent,
          status: 'success',
        });
        
        const accessToken = jwtService.generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          profileCompleted: user.profileCompleted,
        }, 900);
        
        const refreshToken = jwtService.generateRefreshToken();
        
        await sessionRepository.create({
          userId: user.id,
          refreshToken,
          userAgent,
          ipAddress,
          expiresAt: jwtService.getRefreshTokenExpiry(),
        });
        
        return {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profileCompleted: user.profileCompleted,
          },
        };
      }
      
      await userRepository.updateLoginStats(user.id, true);
      
      await auditLogRepository.logSecurityEvent({
        userId: user.id,
        action: 'login_password_success',
        details: { profileCompleted: true, requiresFaceVerification: true },
        ipAddress,
        userAgent,
        status: 'success',
      });

      const faceVerificationToken = jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: true,
        requiresFaceVerification: true,
      }, 900);
      
      return {
        accessToken: faceVerificationToken,
        refreshToken: '', // No refresh token yet, waiting for face verification
        faceVerificationToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileCompleted: user.profileCompleted,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500);
    }
  }

  private async logFailedAttempt(
    userId: string | null,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await auditLogRepository.logSecurityEvent({
      userId: userId || undefined,
      action: 'login_failed',
      details: { email, reason },
      ipAddress,
      userAgent,
      status: 'failed',
    });
  }
}