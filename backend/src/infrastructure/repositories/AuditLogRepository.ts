import { db } from '../../config/database';
import { PaginatedResponse } from '../../core/types';

interface IAuditLog {
  id: string;
  userId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  createdAt: Date;
}

export class AuditLogRepository {
  private table = 'audit_logs';

  async create(data: Omit<IAuditLog, 'id' | 'createdAt'>): Promise<IAuditLog> {
    const [log] = await db(this.table)
      .insert({
        user_id: data.userId,
        action: data.action,
        details: JSON.stringify(data.details),
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        status: data.status,
      })
      .returning('*');
    
    return this.mapToAuditLog(log);
  }

  async findByUserId(
    userId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<IAuditLog>> {
    const offset = (page - 1) * limit;
    
    const query = db(this.table)
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    const [countResult] = await query.clone().clearSelect().count('id as total');
    const total = parseInt(countResult.total as string, 10);
    const totalPages = Math.ceil(total / limit);

    const logs = await query
      .limit(limit)
      .offset(offset);

    return {
      data: logs.map(this.mapToAuditLog),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findAll(
    filters: {
      userId?: string;
      action?: string;
      status?: 'success' | 'failed';
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<IAuditLog>> {
    const {
      userId,
      action,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const offset = (page - 1) * limit;
    
    let query = db(this.table).select('*');
    
    if (userId) {
      query = query.where('user_id', userId);
    }
    
    if (action) {
      query = query.where('action', action);
    }
    
    if (status) {
      query = query.where('status', status);
    }
    
    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const [countResult] = await query.clone().clearSelect().count('id as total');
    const total = parseInt(countResult.total as string, 10);
    const totalPages = Math.ceil(total / limit);

    const logs = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: logs.map(this.mapToAuditLog),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async logSecurityEvent(
    data: Omit<IAuditLog, 'id' | 'createdAt'>
  ): Promise<void> {
    await this.create(data);
  }

  private mapToAuditLog(row: any): IAuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      details: row.details ? JSON.parse(row.details) : undefined,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}

export const auditLogRepository = new AuditLogRepository();