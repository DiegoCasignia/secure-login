import { db } from '../../config/database';
import { IFaceDescriptor, ICreateFaceDescriptor } from '../../core/interfaces/IFace';
import { config } from '../../config/env';

export class FaceDescriptorRepository {
  private table = 'face_descriptors';

  async create(data: ICreateFaceDescriptor): Promise<IFaceDescriptor> {
    // Validate descriptor dimensions
    if (data.descriptor.length !== config.face.dimensions) {
      throw new Error(`Descriptor must have exactly ${config.face.dimensions} dimensions`);
    }

    // If this is primary, unset any existing primary descriptor
    if (data.isPrimary) {
      await db(this.table)
        .where('user_id', data.userId)
        .where('is_primary', true)
        .update({ is_primary: false });
    }

    const [descriptor] = await db(this.table)
      .insert({
        user_id: data.userId,
        descriptor: data.descriptor,
        is_primary: data.isPrimary ?? true,
      })
      .returning('*');
    
    return this.mapToFaceDescriptor(descriptor);
  }

  async findByUserId(userId: string): Promise<IFaceDescriptor[]> {
    const descriptors = await db(this.table)
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    
    return descriptors.map(this.mapToFaceDescriptor);
  }

  async findPrimaryByUserId(userId: string): Promise<IFaceDescriptor | null> {
    const descriptor = await db(this.table)
      .where('user_id', userId)
      .where('is_primary', true)
      .first();
    
    return descriptor ? this.mapToFaceDescriptor(descriptor) : null;
  }

  async findById(id: string): Promise<IFaceDescriptor | null> {
    const descriptor = await db(this.table)
      .where('id', id)
      .first();
    
    return descriptor ? this.mapToFaceDescriptor(descriptor) : null;
  }

  async setPrimary(id: string, userId: string): Promise<IFaceDescriptor | null> {
    // Start transaction
    await db.transaction(async (trx) => {
      // Unset existing primary
      await trx(this.table)
        .where('user_id', userId)
        .where('is_primary', true)
        .update({ is_primary: false });

      // Set new primary
      await trx(this.table)
        .where('id', id)
        .where('user_id', userId)
        .update({ is_primary: true });
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db(this.table)
      .where('id', id)
      .delete();
    
    return deleted > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db(this.table)
      .where('user_id', userId)
      .delete();
  }

  async countByUserId(userId: string): Promise<number> {
    const [result] = await db(this.table)
      .where('user_id', userId)
      .count('id as total');
    
    return parseInt(result.total as string, 10);
  }

  private mapToFaceDescriptor(row: any): IFaceDescriptor {
    return {
      id: row.id,
      userId: row.user_id,
      descriptor: row.descriptor,
      isPrimary: row.is_primary,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const faceDescriptorRepository = new FaceDescriptorRepository();