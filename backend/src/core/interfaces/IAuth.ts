export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    profileCompleted: boolean;
  };
  faceVerificationToken?: string;
}

export interface IFaceVerificationResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  message?: string;
}

export interface ICompleteRegistrationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  faceDescriptor: number[];
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface ILogoutRequest {
  refreshToken: string;
}

export interface ISession {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}