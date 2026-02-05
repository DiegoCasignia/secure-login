import { db } from '../../config/database';
import { ISession } from '../../core/interfaces/IAuth';

export class SessionRepository {
  private table = 'sessions';

  async create(data: Omit<ISession, 'id' | 'createdAt'>): Promise<ISession> {
    const [session] = await db(this.table)
      .insert({
        user_id: data.userId,
        refresh_token: data.refreshToken,
        user_agent: data.userAgent,
        ip_address: data.ipAddress,
        expires_at: data.expiresAt,
      })
      .returning('*');
    
    return this.mapToSession(session);
  }

  async findByRefreshToken(refreshToken: string): Promise<ISession | null> {
    const session = await db(this.table)
      .where('refresh_token', refreshToken)
      .first();
    
    return session ? this.mapToSession(session) : null;
  }

  async findByUserId(userId: string): Promise<ISession[]> {
    const sessions = await db(this.table)
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    
    return sessions.map(this.mapToSession);
  }

  async delete(refreshToken: string): Promise<boolean> {
    const deleted = await db(this.table)
      .where('refresh_token', refreshToken)
      .delete();
    
    return deleted > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db(this.table)
      .where('user_id', userId)
      .delete();
  }

  async deleteExpired(): Promise<void> {
    await db(this.table)
      .where('expires_at', '<', new Date())
      .delete();
  }

  async isValid(refreshToken: string): Promise<boolean> {
    const session = await this.findByRefreshToken(refreshToken);
    
    if (!session) return false;
    
    if (session.expiresAt < new Date()) {
      await this.delete(refreshToken);
      return false;
    }
    
    return true;
  }

  private mapToSession(row: any): ISession {
    return {
      id: row.id,
      userId: row.user_id,
      refreshToken: row.refresh_token,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }
}

export const sessionRepository = new SessionRepository();