import { neon } from '@neondatabase/serverless';
import pg from 'pg';

const { Pool } = pg;

const AZURE_DB_URL = process.env.DATABASE_URL_AZURE;
const REPLIT_DB_URL = process.env.DATABASE_URL;

if (!AZURE_DB_URL || !REPLIT_DB_URL) {
  console.error('❌ Missing DATABASE_URL or DATABASE_URL_AZURE');
  process.exit(1);
}

async function syncSubjects() {
  const replitDb = neon(REPLIT_DB_URL);
  
  const azurePool = new Pool({
    connectionString: AZURE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 Fetching subjects from Replit...');
    const subjects = await replitDb`SELECT * FROM subjects ORDER BY display_order`;
    console.log(`✅ Found ${subjects.length} subjects in Replit`);

    console.log('🗑️  Clearing Azure subjects table...');
    await azurePool.query('DELETE FROM subjects');
    
    console.log('📦 Inserting subjects into Azure...');
    let inserted = 0;
    
    for (const subject of subjects) {
      await azurePool.query(
        `INSERT INTO subjects (id, name, description, board, grade, category, display_order, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          subject.id,
          subject.name,
          subject.description,
          subject.board,
          subject.grade,
          subject.category,
          subject.display_order,
          subject.is_active,
          subject.created_at
        ]
      );
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`   Inserted ${inserted}/${subjects.length}...`);
      }
    }

    console.log(`✅ Successfully synced ${inserted} subjects to Azure`);
    
    const azureCount = await azurePool.query('SELECT COUNT(*) as count FROM subjects');
    console.log(`🔍 Verification: Azure now has ${azureCount.rows[0].count} subjects`);
    
  } finally {
    await azurePool.end();
  }
}

syncSubjects().catch(console.error);
