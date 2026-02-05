import { FaceRecognitionService } from '../../../infrastructure/services/face/FaceRecognitionService';
import { userRepository } from '../../../infrastructure/repositories/UserRepository';
import { auditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { sessionRepository } from '../../../infrastructure/repositories/SessionRepository';
import { ICompleteRegistrationRequest, ILoginResponse } from '../../../core/interfaces/IAuth';
import { AppError } from '../../../utils/errors/AppError';
import { jwtService } from '../../../utils/security/jwt';
import { UserStatus } from '../../../core/interfaces/IUser';

export class CompleteRegistrationUseCase {
  private faceRecognitionService: FaceRecognitionService;

  constructor() {
    this.faceRecognitionService = new FaceRecognitionService();
  }

  async execute(
    request: ICompleteRegistrationRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ILoginResponse> {
    try {
      const { userId, firstName, lastName, phone, faceDescriptor } = request;

      const user = await userRepository.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.profileCompleted) {
        throw new AppError('Profile already completed', 400);
      }

      if (user.status !== UserStatus.PENDING) {
        throw new AppError('User status invalid for registration', 400);
      }

      if (!firstName || !lastName) {
        throw new AppError('First name and last name are required', 400);
      }

      // Check if face already exists in the system
      const faceCheck = await this.faceRecognitionService.checkIfFaceExists(faceDescriptor);
      if (faceCheck.exists) {
        throw new AppError('This facial identity is already registered. Please use a different face or contact support.', 409);
      }

      await this.faceRecognitionService.registerFace(userId, faceDescriptor);

      const updatedUser = await userRepository.update(userId, {
        firstName,
        lastName,
        phone,
        profileCompleted: true,
        status: UserStatus.ACTIVE,
      });

      if (!updatedUser) {
        throw new AppError('Failed to update user profile', 500);
      }

      await auditLogRepository.logSecurityEvent({
        userId,
        action: 'registration_completed',
        details: { firstName, lastName, phone },
        ipAddress,
        userAgent,
        status: 'success',
      });

      const accessToken = jwtService.generateAccessToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
      });

      const refreshToken = jwtService.generateRefreshToken();

      await sessionRepository.create({
        userId: updatedUser.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: jwtService.getRefreshTokenExpiry(),
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          profileCompleted: updatedUser.profileCompleted,
        },
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Registration completion failed', 500);
    }
  }
}