import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.enum('role', ['admin', 'client']).notNullable().defaultTo('client');
    table.enum('status', ['active', 'inactive', 'pending', 'blocked']).notNullable().defaultTo('pending');
    table.boolean('profile_completed').notNullable().defaultTo(false);
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.timestamp('last_login_at');
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.timestamp('lock_until');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
  await knex.schema.dropTable('users');
}