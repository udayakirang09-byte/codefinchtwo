import { Client } from 'pg';

const azureConnectionString = "postgresql://pgadmin:Nipr049048-22@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require";

async function syncToAzure() {
  const client = new Client({ connectionString: azureConnectionString });
  
  try {
    console.log('🔗 Connecting to Azure database...');
    await client.connect();
    console.log('✅ Connected to Azure database');

    // Check current tables
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Found ${existingTables.rows.length} existing tables in Azure`);
    
    const tableNames = existingTables.rows.map(r => r.table_name);
    const missingTables = [];
    
    if (!tableNames.includes('teacher_qualifications')) {
      missingTables.push('teacher_qualifications');
    }
    
    if (!tableNames.includes('teacher_subjects')) {
      missingTables.push('teacher_subjects');
    }
    
    console.log('❌ Missing tables:', missingTables);
    
    // Create teacher_qualifications table if missing
    if (missingTables.includes('teacher_qualifications')) {
      console.log('🏗️ Creating teacher_qualifications table...');
      await client.query(`
        CREATE TABLE teacher_qualifications (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          mentor_id varchar NOT NULL REFERENCES mentors(id),
          qualification varchar NOT NULL,
          specialization varchar NOT NULL,
          score varchar NOT NULL,
          priority integer NOT NULL DEFAULT 1,
          created_at timestamp DEFAULT now()
        )
      `);
      console.log('✅ Created teacher_qualifications table');
    }
    
    // Create teacher_subjects table if missing
    if (missingTables.includes('teacher_subjects')) {
      console.log('🏗️ Creating teacher_subjects table...');
      await client.query(`
        CREATE TABLE teacher_subjects (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          mentor_id varchar NOT NULL REFERENCES mentors(id),
          subject varchar NOT NULL,
          experience varchar NOT NULL,
          priority integer NOT NULL DEFAULT 1,
          created_at timestamp DEFAULT now()
        )
      `);
      console.log('✅ Created teacher_subjects table');
    }
    
    // Verify tables are created
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teacher_qualifications', 'teacher_subjects')
      ORDER BY table_name
    `);
    
    console.log('🎉 Teacher tables in Azure:', finalTables.rows.map(r => r.table_name));
    
    await client.end();
    console.log('✅ Azure sync completed successfully');
    
  } catch (error) {
    console.error('❌ Azure sync failed:', error);
    await client.end().catch(() => {});
    throw error;
  }
}

syncToAzure();