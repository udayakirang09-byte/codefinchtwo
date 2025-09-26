import ExcelJS from 'exceljs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { teacherQualifications, teacherSubjects, mentors } from '../shared/schema.js';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function readExcelFiles() {
  try {
    console.log('📚 Reading Excel files...');
    
    // Read subjects file
    const subjectsWorkbook = new ExcelJS.Workbook();
    await subjectsWorkbook.xlsx.readFile('../attached_assets/Good-Board_Category_Grade_Subject_List_Updated_1758815692812.xlsx');
    const subjectsWs = subjectsWorkbook.worksheets[0];
    
    // Read qualifications file
    const qualificationsWorkbook = new ExcelJS.Workbook();
    await qualificationsWorkbook.xlsx.readFile('../attached_assets/Good-Qualification_Specialization_Mapping_1758815683748.xlsx');
    const qualificationsWs = qualificationsWorkbook.worksheets[0];
    
    console.log(`📊 Subjects file: ${subjectsWs.rowCount} rows`);
    console.log(`📊 Qualifications file: ${qualificationsWs.rowCount} rows`);
    
    // Extract subjects data (data is in column 1, starting from row 2)
    const subjects: string[] = [];
    console.log('\n📖 Extracting subjects...');
    for (let i = 2; i <= subjectsWs.rowCount; i++) {
      const row = subjectsWs.getRow(i);
      const subjectValue = row.getCell(1).value;
      if (subjectValue && typeof subjectValue === 'string') {
        subjects.push(subjectValue.trim());
      }
    }
    
    console.log(`✅ Found ${subjects.length} subjects`);
    console.log('Sample subjects:', subjects.slice(0, 5));
    
    // Extract qualifications data (qualification in column 1, specialization in column 2)
    const qualificationMappings: { qualification: string; specialization: string }[] = [];
    console.log('\n🎓 Extracting qualifications...');
    for (let i = 2; i <= qualificationsWs.rowCount; i++) {
      const row = qualificationsWs.getRow(i);
      const qualValue = row.getCell(1).value;
      const specValue = row.getCell(2).value;
      
      if (qualValue && specValue && typeof qualValue === 'string' && typeof specValue === 'string') {
        qualificationMappings.push({
          qualification: qualValue.trim(),
          specialization: specValue.trim()
        });
      }
    }
    
    console.log(`✅ Found ${qualificationMappings.length} qualification mappings`);
    console.log('Sample mappings:', qualificationMappings.slice(0, 5));
    
    return { subjects, qualificationMappings };
    
  } catch (error) {
    console.error('❌ Error reading Excel files:', error);
    throw error;
  }
}

async function importTeacherData() {
  try {
    console.log('🚀 Starting teacher data import...');
    
    const { subjects, qualificationMappings } = await readExcelFiles();
    
    // Get existing mentors (we'll create sample teacher data for them)
    const existingMentors = await db.select().from(mentors);
    console.log(`👨‍🏫 Found ${existingMentors.length} existing mentors`);
    
    if (existingMentors.length === 0) {
      console.log('⚠️ No mentors found. Need to create mentors first before adding teacher data.');
      return;
    }
    
    // Clear existing teacher data
    console.log('🧹 Clearing existing teacher qualification data...');
    await db.delete(teacherQualifications);
    
    console.log('🧹 Clearing existing teacher subjects data...');
    await db.delete(teacherSubjects);
    
    // Import teacher qualifications
    console.log('📝 Importing teacher qualifications...');
    const uniqueQualifications = Array.from(new Set(qualificationMappings.map(q => q.qualification)));
    const uniqueSpecializations = Array.from(new Set(qualificationMappings.map(q => q.specialization)));
    
    console.log(`Found ${uniqueQualifications.length} unique qualifications`);
    console.log(`Found ${uniqueSpecializations.length} unique specializations`);
    
    let qualificationInserts = 0;
    for (const mentor of existingMentors) {
      // Add 2-3 random qualifications per mentor
      const numQualifications = Math.floor(Math.random() * 2) + 2; // 2-3 qualifications
      
      for (let i = 0; i < numQualifications; i++) {
        const randomMapping = qualificationMappings[Math.floor(Math.random() * qualificationMappings.length)];
        
        await db.insert(teacherQualifications).values({
          id: randomUUID(),
          mentorId: mentor.id,
          qualification: randomMapping.qualification,
          specialization: randomMapping.specialization,
          score: generateRandomScore(),
          priority: i + 1
        });
        qualificationInserts++;
      }
    }
    
    console.log(`✅ Inserted ${qualificationInserts} teacher qualifications`);
    
    // Import teacher subjects
    console.log('📚 Importing teacher subjects...');
    let subjectInserts = 0;
    for (const mentor of existingMentors) {
      // Add 3-5 random subjects per mentor
      const numSubjects = Math.floor(Math.random() * 3) + 3; // 3-5 subjects
      const mentorSubjects = getRandomSubjects(subjects, numSubjects);
      
      for (let i = 0; i < mentorSubjects.length; i++) {
        await db.insert(teacherSubjects).values({
          id: randomUUID(),
          mentorId: mentor.id,
          subject: mentorSubjects[i],
          experience: generateRandomExperience(),
          priority: i + 1
        });
        subjectInserts++;
      }
    }
    
    console.log(`✅ Inserted ${subjectInserts} teacher subjects`);
    
    // Verify the import
    const totalQualifications = await db.select().from(teacherQualifications);
    const totalSubjects = await db.select().from(teacherSubjects);
    
    console.log('\\n🎉 Import completed successfully!');
    console.log(`📊 Total teacher qualifications: ${totalQualifications.length}`);
    console.log(`📊 Total teacher subjects: ${totalSubjects.length}`);
    
    return {
      qualifications: totalQualifications.length,
      subjects: totalSubjects.length,
      mentors: existingMentors.length
    };
    
  } catch (error) {
    console.error('❌ Error importing teacher data:', error);
    throw error;
  }
}

function generateRandomScore(): string {
  const scoreTypes = [
    '3.8 GPA', '3.9 GPA', '4.0 GPA', '3.7 GPA', '3.6 GPA',
    'First Class', 'Upper Second Class', 'Lower Second Class',
    '85%', '90%', '95%', '88%', '92%', '87%',
    'Distinction', 'Merit', 'Pass with Honours'
  ];
  return scoreTypes[Math.floor(Math.random() * scoreTypes.length)];
}

function generateRandomExperience(): string {
  const experiences = [
    '1 year', '2 years', '3 years', '4 years', '5+ years',
    'Beginner', 'Intermediate', 'Advanced', 'Expert',
    '6 months', '18 months', '2.5 years', '3.5 years'
  ];
  return experiences[Math.floor(Math.random() * experiences.length)];
}

function getRandomSubjects(subjects: string[], count: number): string[] {
  const shuffled = [...subjects].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Run the import
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  importTeacherData()
    .then((result) => {
      console.log('\\n✨ Teacher data import completed!', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export { importTeacherData, readExcelFiles };