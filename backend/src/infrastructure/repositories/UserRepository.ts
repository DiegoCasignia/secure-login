import { db } from '../../config/database';
import { IUser, ICreateUser, IUpdateUser, IUserFilters, UserRole, UserStatus } from '../../core/interfaces/IUser';
import { PaginatedResponse } from '../../core/types';

export class UserRepository {
  private table = 'users';

  async create(data: ICreateUser): Promise<IUser> {
    const [user] = await db(this.table)
      .insert({
        email: data.email,
        password_hash: data.password,
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        status: UserStatus.PENDING,
        profile_completed: false,
      })
      .returning('*');
    
    return this.mapToUser(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await db(this.table)
      .where('email', email.toLowerCase())
      .first();
    
    return user ? this.mapToUser(user) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await db(this.table)
      .where('id', id)
      .first();
    
    return user ? this.mapToUser(user) : null;
  }

  async update(id: string, data: IUpdateUser): Promise<IUser | null> {
    const [user] = await db(this.table)
      .where('id', id)
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        status: data.status,
        profile_completed: data.profileCompleted,
        updated_at: new Date(),
      })
      .returning('*');
    
    return user ? this.mapToUser(user) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await db(this.table)
      .where('id', id)
      .update({
        password_hash: passwordHash,
        updated_at: new Date(),
      });
  }

  async updateLoginStats(id: string, success: boolean): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;

    if (success) {
      await db(this.table)
        .where('id', id)
        .update({
          last_login_at: new Date(),
          failed_login_attempts: 0,
          lock_until: null,
          updated_at: new Date(),
        });
    } else {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockUntil = null;
      
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      
      await db(this.table)
        .where('id', id)
        .update({
          failed_login_attempts: failedAttempts,
          lock_until: lockUntil,
          updated_at: new Date(),
        });
    }
  }

  async findAll(filters: IUserFilters): Promise<PaginatedResponse<IUser>> {
    const {
      email,
      role,
      status,
      profileCompleted,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const offset = (page - 1) * limit;
    
    let query = db(this.table).select('*');
    
    if (email) {
      query = query.where('email', 'ilike', `%${email}%`);
    }
    
    if (role) {
      query = query.where('role', role);
    }
    
    if (status) {
      query = query.where('status', status);
    }
    
    if (profileCompleted !== undefined) {
      query = query.where('profile_completed', profileCompleted);
    }
    
    if (search) {
      query = query.where((builder) => {
        builder
          .where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
      });
    }

    const [countResult] = await query.clone().clearSelect().count('id as total');
    const total = parseInt(countResult.total as string, 10);
    const totalPages = Math.ceil(total / limit);

    const users = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: users.map(this.mapToUser),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async count(): Promise<number> {
    const [result] = await db(this.table).count('id as total');
    return parseInt(result.total as string, 10);
  }

  private mapToUser(row: any): IUser {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      profileCompleted: row.profile_completed,
      emailVerified: row.email_verified,
      lastLoginAt: row.last_login_at,
      failedLoginAttempts: row.failed_login_attempts,
      lockUntil: row.lock_until,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const userRepository = new UserRepository();