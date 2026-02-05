import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('refresh_token').notNullable();
    table.string('user_agent');
    table.string('ip_address');
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['refresh_token']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sessions');
}