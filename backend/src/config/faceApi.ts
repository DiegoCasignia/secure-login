import { config } from './env';

export class FaceComparator {
  static validateDescriptor(descriptor: number[]): void {
    if (!Array.isArray(descriptor)) {
      throw new Error('Descriptor must be an array');
    }
    
    if (descriptor.length !== config.face.dimensions) {
      throw new Error(`Descriptor must have ${config.face.dimensions} dimensions, got ${descriptor.length}`);
    }
    
    for (let i = 0; i < descriptor.length; i++) {
      if (typeof descriptor[i] !== 'number' || isNaN(descriptor[i])) {
        throw new Error(`Descriptor[${i}] must be a valid number, got ${descriptor[i]}`);
      }
    }
  }
}