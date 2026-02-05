const bcrypt = require('bcryptjs');
const knex = require('knex');
const config = require('../knexfile').development;

const db = knex(config);

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123.';

    const existingAdmin = await db('users')
      .where('email', adminEmail)
      .first();

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      await db('users').insert({
        email: adminEmail,
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        profile_completed: true,
        email_verified: true,
      });

      console.log('Admin user created:');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();