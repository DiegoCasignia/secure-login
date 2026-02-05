import apiClient from './apiClient';
import type { ApiResponse, AuthResponse, RegisterData, User } from '../types';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  }

  async verifyFace(faceDescriptor: number[], token?: string): Promise<AuthResponse> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/verify-face',
      { faceDescriptor },
      { headers }
    );
    return response.data.data;
  }

  async completeRegistration(data: RegisterData, faceDescriptor: number[]): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/complete-registration', {
      ...data,
      faceDescriptor,
    });
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  }
}

export const authService = new AuthService();