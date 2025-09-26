import { Client } from 'pg';

async function fixAzureDatabase() {
  console.log('🔧 Starting Azure database fix...');
  
  // Use the exact connection string from your Azure command
  const connectionString = "postgresql://pgadmin:Nipr049048-22@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require";
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000
  });
  
  try {
    console.log('🔗 Attempting connection to Azure...');
    await client.connect();
    console.log('✅ Successfully connected to Azure PostgreSQL');
    
    // 1. Check current tables
    console.log('\n📊 Checking current tables...');
    const currentTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teacher_qualifications', 'teacher_subjects')
      ORDER BY table_name
    `);
    
    console.log(`Found teacher tables: ${currentTables.rows.map(r => r.table_name).join(', ') || 'NONE'}`);
    
    // 2. Check if mentors table exists (required for foreign key)
    const mentorsCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'mentors'
    `);
    
    if (mentorsCheck.rows.length === 0) {
      throw new Error('❌ mentors table does not exist in Azure - cannot create teacher tables without it');
    }
    console.log('✅ mentors table exists in Azure');
    
    // 3. Create teacher_qualifications table
    if (!currentTables.rows.find(r => r.table_name === 'teacher_qualifications')) {
      console.log('\n🏗️ Creating teacher_qualifications table...');
      await client.query(`
        CREATE TABLE teacher_qualifications (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          mentor_id varchar NOT NULL,
          qualification varchar NOT NULL,
          specialization varchar NOT NULL,
          score varchar NOT NULL,
          priority integer NOT NULL DEFAULT 1,
          created_at timestamp DEFAULT now(),
          FOREIGN KEY (mentor_id) REFERENCES mentors(id)
        )
      `);
      console.log('✅ Created teacher_qualifications table');
    } else {
      console.log('✅ teacher_qualifications table already exists');
    }
    
    // 4. Create teacher_subjects table
    if (!currentTables.rows.find(r => r.table_name === 'teacher_subjects')) {
      console.log('\n🏗️ Creating teacher_subjects table...');
      await client.query(`
        CREATE TABLE teacher_subjects (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          mentor_id varchar NOT NULL,
          subject varchar NOT NULL,
          experience varchar NOT NULL,
          priority integer NOT NULL DEFAULT 1,
          created_at timestamp DEFAULT now(),
          FOREIGN KEY (mentor_id) REFERENCES mentors(id)
        )
      `);
      console.log('✅ Created teacher_subjects table');
    } else {
      console.log('✅ teacher_subjects table already exists');
    }
    
    // 5. Final verification
    console.log('\n🔍 Final verification...');
    const finalCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teacher_qualifications', 'teacher_subjects')
      ORDER BY table_name
    `);
    
    console.log(`✅ Tables now in Azure: ${finalCheck.rows.map(r => r.table_name).join(', ')}`);
    
    if (finalCheck.rows.length === 2) {
      console.log('🎉 Azure database fix completed successfully!');
    } else {
      throw new Error('❌ Tables still missing after creation attempt');
    }
    
  } catch (error) {
    console.error('❌ Azure fix failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixAzureDatabase();