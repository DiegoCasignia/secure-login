export interface IFaceDescriptor {
  id: string;
  userId: string;
  descriptor: number[];
  isPrimary: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateFaceDescriptor {
  userId: string;
  descriptor: number[];
  isPrimary?: boolean;
}

export interface IFaceComparisonResult {
  match: boolean;
  distance: number;
  threshold: number;
  isPrimary: boolean;
}

export interface IFaceVerificationRequest {
  userId: string;
  descriptor: number[];
}