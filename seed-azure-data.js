#!/usr/bin/env node
/**
 * Seed Azure PostgreSQL with initial data
 */

const { Client } = require('pg');

async function seedData() {
  const connectionString = `postgresql://pgadmin:${process.env.AZURE_POSTGRES_PASSWORD}@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require`;
  
  const client = new Client({
    connectionString
  });

  try {
    console.log('🔌 Connecting to Azure PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('🌱 Creating initial users...');
    
    // Insert users (using INSERT ... ON CONFLICT DO NOTHING to avoid duplicates)
    await client.query(`
      INSERT INTO users (email, password, first_name, last_name, role) VALUES 
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15)
      ON CONFLICT (email) DO NOTHING
    `, [
      'udayakirang99@gmail.com', 'Hello111', 'Student', 'User', 'student',
      'teacher@codeconnect.com', 'Hello111', 'Teacher', 'User', 'mentor', 
      'admin@codeconnect.com', 'Hello111', 'Admin', 'User', 'admin'
    ]);

    console.log('✅ Users created');

    // Get user IDs
    const studentResult = await client.query(`SELECT id FROM users WHERE email = 'udayakirang99@gmail.com'`);
    const mentorResult = await client.query(`SELECT id FROM users WHERE email = 'teacher@codeconnect.com'`);

    if (studentResult.rows.length > 0 && mentorResult.rows.length > 0) {
      const studentUserId = studentResult.rows[0].id;
      const mentorUserId = mentorResult.rows[0].id;

      console.log('🎓 Creating student record...');
      await client.query(`
        INSERT INTO students (user_id, age, interests) 
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO NOTHING
      `, [studentUserId, 16, JSON.stringify(['JavaScript', 'Python'])]);

      console.log('👨‍🏫 Creating mentor record...');
      await client.query(`
        INSERT INTO mentors (user_id, title, description, specialties, experience, hourly_rate) 
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO NOTHING
      `, [
        mentorUserId, 
        'Senior JavaScript Developer', 
        'Experienced developer with 8+ years in web development',
        JSON.stringify(['JavaScript', 'React', 'Node.js']),
        8,
        '75.00'
      ]);

      console.log('✅ Student and mentor records created');
    }

    // Verify data
    console.log('🔍 Verifying data...');
    const counts = await client.query(`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'students' as table_name, COUNT(*) as count FROM students  
      UNION ALL
      SELECT 'mentors' as table_name, COUNT(*) as count FROM mentors
    `);

    console.log('📊 Data counts:');
    counts.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.count}`);
    });

    console.log('🎉 Azure database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedData();