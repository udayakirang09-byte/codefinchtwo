import { Client } from 'pg';

async function debugAzureDatabase() {
  console.log('🔍 Deep debugging Azure database...');
  
  const connectionString = "postgresql://pgadmin:Nipr049048-22@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require";
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Azure database');
    
    // 1. Check ALL tables (like user's CLI query)
    console.log('\n📊 ALL TABLES (same query as your CLI):');
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      ORDER BY table_name
    `);
    
    console.log(`Total tables found: ${allTables.rows.length}`);
    allTables.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // 2. Specifically look for teacher tables
    console.log('\n🎯 TEACHER TABLES specifically:');
    const teacherTables = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_name LIKE '%teacher%' 
      OR table_name IN ('teacher_qualifications', 'teacher_subjects')
      ORDER BY table_name
    `);
    
    console.log(`Teacher tables found: ${teacherTables.rows.length}`);
    teacherTables.rows.forEach(row => {
      console.log(`- ${row.table_name} (schema: ${row.table_schema})`);
    });
    
    // 3. Check if tables have data
    if (teacherTables.rows.some(r => r.table_name === 'teacher_qualifications')) {
      const qualCount = await client.query('SELECT COUNT(*) as count FROM teacher_qualifications');
      console.log(`teacher_qualifications has ${qualCount.rows[0].count} records`);
    }
    
    if (teacherTables.rows.some(r => r.table_name === 'teacher_subjects')) {
      const subjCount = await client.query('SELECT COUNT(*) as count FROM teacher_subjects');
      console.log(`teacher_subjects has ${subjCount.rows[0].count} records`);
    }
    
    // 4. Check schema difference
    console.log('\n🔍 Schema check:');
    const schemaCheck = await client.query(`
      SELECT table_schema, COUNT(*) as table_count
      FROM information_schema.tables 
      GROUP BY table_schema
      ORDER BY table_schema
    `);
    
    schemaCheck.rows.forEach(row => {
      console.log(`Schema '${row.table_schema}': ${row.table_count} tables`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await client.end();
  }
}

debugAzureDatabase();