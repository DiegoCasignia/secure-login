import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('face_descriptors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('descriptor', 'real[]').notNullable(); // Array of 128 floats
    table.boolean('is_primary').notNullable().defaultTo(true);
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['user_id']);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX unique_primary_descriptor_per_user 
    ON face_descriptors (user_id) 
    WHERE is_primary = true;
  `);

  await knex.raw(`
    CREATE TRIGGER update_face_descriptors_updated_at
    BEFORE UPDATE ON face_descriptors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    ALTER TABLE face_descriptors
    ADD CONSTRAINT descriptor_length_check 
    CHECK (array_length(descriptor, 1) = 128);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_face_descriptors_updated_at ON face_descriptors');
  await knex.raw('DROP INDEX IF EXISTS unique_primary_descriptor_per_user');
  await knex.schema.dropTable('face_descriptors');
}