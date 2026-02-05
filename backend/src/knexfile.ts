import type { Knex } from 'knex';
import { config } from './config/env';

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/infrastructure/database/migrations',
    },
    seeds: {
      directory: './src/infrastructure/database/seeds',
    },
  },
  production: {
    client: 'postgresql',
    connection: {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/infrastructure/database/migrations',
    },
    seeds: {
      directory: './src/infrastructure/database/seeds',
    },
  },
};

export default knexConfig;