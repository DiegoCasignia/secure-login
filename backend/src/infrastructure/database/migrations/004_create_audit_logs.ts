import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action').notNullable();
    table.text('details');
    table.string('ip_address');
    table.string('user_agent');
    table.enum('status', ['success', 'failed']).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['action']);
    table.index(['status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('audit_logs');
}