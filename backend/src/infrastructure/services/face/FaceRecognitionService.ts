import { faceDescriptorRepository } from '../../repositories/FaceDescriptorRepository';
import { IFaceComparisonResult } from '../../../core/interfaces/IFace';
import { config } from '../../../config/env';

export class FaceRecognitionService {
  // Método estático para comparar descriptores
  static compareDescriptors(
    storedDescriptor: number[],
    incomingDescriptor: number[],
    threshold = config.face.threshold
  ): { match: boolean; distance: number; threshold: number } {
    // Validación básica
    if (!Array.isArray(storedDescriptor) || !Array.isArray(incomingDescriptor)) {
      throw new Error('Descriptors must be arrays');
    }
    
    if (storedDescriptor.length !== incomingDescriptor.length) {
      throw new Error(`Descriptor length mismatch: ${storedDescriptor.length} vs ${incomingDescriptor.length}`);
    }
    
    if (storedDescriptor.length !== 128) {
      throw new Error(`Descriptors must have 128 dimensions, got ${storedDescriptor.length}`);
    }

    // Calcular distancia euclidiana
    let sum = 0;
    for (let i = 0; i < storedDescriptor.length; i++) {
      const diff = storedDescriptor[i] - incomingDescriptor[i];
      sum += diff * diff;
    }
    
    const distance = Math.sqrt(sum);
    
    return {
      match: distance <= threshold,
      distance: Number(distance.toFixed(4)),
      threshold,
    };
  }

  static validateDescriptor(descriptor: number[]): void {
    if (!Array.isArray(descriptor)) {
      throw new Error('Descriptor must be an array');
    }
    
    if (descriptor.length !== 128) {
      throw new Error(`Descriptor must have 128 dimensions, got ${descriptor.length}`);
    }
    
    for (let i = 0; i < descriptor.length; i++) {
      if (typeof descriptor[i] !== 'number' || isNaN(descriptor[i])) {
        throw new Error(`Descriptor[${i}] must be a valid number, got ${descriptor[i]}`);
      }
    }
  }

  async verifyFace(
    userId: string,
    incomingDescriptor: number[]
  ): Promise<IFaceComparisonResult> {
    // Validar descriptor entrante
    FaceRecognitionService.validateDescriptor(incomingDescriptor);

    // Obtener descriptor almacenado
    const storedDescriptor = await faceDescriptorRepository.findPrimaryByUserId(userId);
    
    if (!storedDescriptor) {
      throw new Error('No face descriptor found for user');
    }

    // Comparar descriptores
    const result = FaceRecognitionService.compareDescriptors(
      storedDescriptor.descriptor,
      incomingDescriptor,
      config.face.threshold
    );

    return {
      match: result.match,
      distance: result.distance,
      threshold: result.threshold,
      isPrimary: storedDescriptor.isPrimary,
    };
  }

  async registerFace(
    userId: string,
    descriptor: number[]
  ): Promise<void> {
    FaceRecognitionService.validateDescriptor(descriptor);

    await faceDescriptorRepository.create({
      userId,
      descriptor,
      isPrimary: true,
    });
  }

  async checkIfFaceExists(
    incomingDescriptor: number[],
    threshold = config.face.threshold
  ): Promise<{ exists: boolean; matchedUserId?: string; distance?: number }> {
    FaceRecognitionService.validateDescriptor(incomingDescriptor);

    const allDescriptors = await faceDescriptorRepository.findAllDescriptors();

    for (const descriptor of allDescriptors) {
      const result = FaceRecognitionService.compareDescriptors(
        descriptor.descriptor,
        incomingDescriptor,
        threshold
      );

      if (result.match) {
        return {
          exists: true,
          matchedUserId: descriptor.userId,
          distance: result.distance,
        };
      }
    }

    return { exists: false };
  }
}