import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(5000),
  API_VERSION: z.string().default('v1'),
  FRONTEND_URL: z.string(),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default(5432),
  DB_NAME: z.string().default('db-secure-login'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z.string().transform(val => val === 'true').default(false),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().transform(Number).default(150000),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // Face Recognition
  FACE_RECOGNITION_THRESHOLD: z.string().transform(Number).default(0.45),
  FACE_DESCRIPTOR_DIMENSIONS: z.string().transform(Number).default(128),
  
  // Security
  RATE_LIMIT_WINDOW: z.string().transform(Number).default(15),
  RATE_LIMIT_MAX: z.string().transform(Number).default(100),
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  
  // Admin
  ADMIN_INITIAL_EMAIL: z.string().email().optional(),
  ADMIN_INITIAL_PASSWORD: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  frontendUrl: env.FRONTEND_URL,
  
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
  
  face: {
    threshold: env.FACE_RECOGNITION_THRESHOLD,
    dimensions: env.FACE_DESCRIPTOR_DIMENSIONS,
  },
  
  security: {
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000,
      max: env.RATE_LIMIT_MAX,
    },
    bcryptRounds: env.BCRYPT_ROUNDS,
  },
  
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  
  admin: {
    email: env.ADMIN_INITIAL_EMAIL,
    password: env.ADMIN_INITIAL_PASSWORD,
  },
} as const;