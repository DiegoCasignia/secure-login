export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profileCompleted: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface IUpdateUser {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: UserStatus;
  profileCompleted?: boolean;
}

export interface IUserFilters {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  profileCompleted?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}