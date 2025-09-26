import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Client } from 'pg';
import { teacherQualifications, teacherSubjects } from '../shared/schema';

// Replit database connection
const replitSql = neon(process.env.DATABASE_URL!);
const replitDb = drizzle(replitSql);

// Azure database connection
const azureConnectionString = "postgresql://pgadmin:Nipr049048-22@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require";

async function syncDataToAzure() {
  const azureClient = new Client({ connectionString: azureConnectionString });
  
  try {
    console.log('🚀 Starting data sync from Replit to Azure...');
    
    // Connect to Azure
    await azureClient.connect();
    console.log('✅ Connected to Azure database');
    
    // 1. Get all data from Replit
    console.log('\n📥 Fetching data from Replit database...');
    const replitQualifications = await replitDb.select().from(teacherQualifications);
    const replitSubjects = await replitDb.select().from(teacherSubjects);
    
    console.log(`📊 Found in Replit: ${replitQualifications.length} qualifications, ${replitSubjects.length} subjects`);
    
    // 2. Clear existing data in Azure
    console.log('\n🧹 Clearing existing data in Azure...');
    await azureClient.query('DELETE FROM teacher_qualifications');
    await azureClient.query('DELETE FROM teacher_subjects');
    console.log('✅ Cleared existing Azure data');
    
    // 3. Sync qualifications to Azure
    console.log('\n🎓 Syncing qualifications to Azure...');
    if (replitQualifications.length > 0) {
      const qualValues = replitQualifications.map(q => 
        `('${q.id}', '${q.mentorId}', '${q.qualification.replace(/'/g, "''")}', '${q.specialization.replace(/'/g, "''")}', '${q.score}', ${q.priority})`
      ).join(', ');
      
      await azureClient.query(`
        INSERT INTO teacher_qualifications (id, mentor_id, qualification, specialization, score, priority)
        VALUES ${qualValues}
      `);
      console.log(`✅ Synced ${replitQualifications.length} qualifications to Azure`);
    }
    
    // 4. Sync subjects to Azure
    console.log('\n📚 Syncing subjects to Azure...');
    if (replitSubjects.length > 0) {
      const subjectValues = replitSubjects.map(s => 
        `('${s.id}', '${s.mentorId}', '${s.subject.replace(/'/g, "''")}', '${s.experience.replace(/'/g, "''")}', ${s.priority})`
      ).join(', ');
      
      await azureClient.query(`
        INSERT INTO teacher_subjects (id, mentor_id, subject, experience, priority)
        VALUES ${subjectValues}
      `);
      console.log(`✅ Synced ${replitSubjects.length} subjects to Azure`);
    }
    
    // 5. Verify the sync
    console.log('\n🔍 Verifying Azure data sync...');
    const azureQualCount = await azureClient.query('SELECT COUNT(*) as count FROM teacher_qualifications');
    const azureSubjCount = await azureClient.query('SELECT COUNT(*) as count FROM teacher_subjects');
    
    console.log(`📊 Azure verification:`);
    console.log(`  - teacher_qualifications: ${azureQualCount.rows[0].count} records`);
    console.log(`  - teacher_subjects: ${azureSubjCount.rows[0].count} records`);
    
    // 6. Sample data verification
    const sampleQuals = await azureClient.query('SELECT qualification, specialization FROM teacher_qualifications LIMIT 3');
    const sampleSubjs = await azureClient.query('SELECT subject, experience FROM teacher_subjects LIMIT 3');
    
    console.log('\n📋 Sample Azure data:');
    console.log('  Qualifications:');
    sampleQuals.rows.forEach(q => console.log(`    - ${q.qualification} → ${q.specialization}`));
    console.log('  Subjects:');
    sampleSubjs.rows.forEach(s => console.log(`    - ${s.subject} (${s.experience})`));
    
    await azureClient.end();
    console.log('\n🎉 Data sync to Azure completed successfully!');
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    await azureClient.end().catch(() => {});
    throw error;
  }
}

syncDataToAzure();