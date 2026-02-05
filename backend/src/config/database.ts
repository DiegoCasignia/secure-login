import knex from 'knex';
import knexConfig from '../knexfile';
import { config } from './env';

const environment = config.env === 'production' ? 'production' : 'development';

export const db = knex(knexConfig[environment]);

export const testConnection = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const closeConnection = async (): Promise<void> => {
  await db.destroy();
  console.log('Database connection closed');
};