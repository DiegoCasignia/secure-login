export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'client';
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface FaceDescriptor {
  descriptor: number[];
  detection: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks: number[][];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  faceVerificationToken?: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface FaceDetectionResult {
  success: boolean;
  descriptor?: number[];
  error?: string;
  imageData?: string;
  detection?: any;
}