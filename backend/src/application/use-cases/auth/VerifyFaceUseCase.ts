import { FaceRecognitionService } from '../../../infrastructure/services/face/FaceRecognitionService';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { sessionRepository } from '../../../infrastructure/repositories/SessionRepository';
import { IFaceVerificationResponse } from '../../../core/interfaces/IAuth';
import { AppError } from '../../../utils/errors/AppError';
import { jwtService } from '../../../utils/security/jwt';
import { UserStatus } from '../../../core/interfaces/IUser';

export class VerifyFaceUseCase {
  private faceRecognitionService: FaceRecognitionService;

  constructor() {
    this.faceRecognitionService = new FaceRecognitionService();
  }

  async execute(
    userId: string,
    faceDescriptor: number[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<IFaceVerificationResponse> {
    try {
      // Get user
      const user = await userRepository.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('Account is not active', 403);
      }

      if (!user.profileCompleted) {
        throw new AppError('Profile not completed', 400);
      }

      // Verify face
      const verificationResult = await this.faceRecognitionService.verifyFace(
        userId,
        faceDescriptor
      );

      if (!verificationResult.match) {
        await auditLogRepository.logSecurityEvent({
          userId,
          action: 'face_verification_failed',
          details: {
            distance: verificationResult.distance,
            threshold: verificationResult.threshold,
          },
          ipAddress,
          userAgent,
          status: 'failed',
        });

        throw new AppError('Face verification failed', 401, {
          distance: verificationResult.distance,
          threshold: verificationResult.threshold,
        });
      }

      // Face verification successful
      await auditLogRepository.logSecurityEvent({
        userId,
        action: 'face_verification_success',
        details: {
          distance: verificationResult.distance,
          threshold: verificationResult.threshold,
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      // Generate tokens
      const accessToken = jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      });

      const refreshToken = jwtService.generateRefreshToken();

      // Store refresh token
      await sessionRepository.create({
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: jwtService.getRefreshTokenExpiry(),
      });

      // Update last login
      await userRepository.updateLoginStats(user.id, true);

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Face verification failed', 500);
    }
  }
}