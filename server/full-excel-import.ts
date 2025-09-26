import ExcelJS from 'exceljs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { teacherQualifications, teacherSubjects, mentors } from '../shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface SubjectRow {
  board?: string;
  category?: string;
  grade?: string;
  subject?: string;
}

interface QualificationRow {
  qualification?: string;
  specialization?: string;
}

async function importAllExcelData() {
  console.log('🚀 Starting FULL Excel data import...');

  try {
    // Get all existing mentors to distribute data across
    const existingMentors = await db.select().from(mentors);
    console.log(`📋 Found ${existingMentors.length} existing mentors to assign data to`);

    if (existingMentors.length === 0) {
      console.error('❌ No mentors found! Need mentors to assign data to.');
      return;
    }

    // CLEAR existing teacher data first
    console.log('🧹 Clearing existing teacher data...');
    await db.delete(teacherQualifications);
    await db.delete(teacherSubjects);
    console.log('✅ Cleared existing teacher data');

    // IMPORT ALL SUBJECTS
    console.log('\n📚 Importing ALL subjects from Excel...');
    
    const subjectsWorkbook = new ExcelJS.Workbook();
    await subjectsWorkbook.xlsx.readFile('../attached_assets/Good-Board_Category_Grade_Subject_List_Updated_1758815692812.xlsx');
    
    const subjectsWorksheet = subjectsWorkbook.getWorksheet(1);
    if (!subjectsWorksheet) {
      throw new Error('Could not find subjects worksheet');
    }

    const subjectRows: SubjectRow[] = [];
    
    // Read all rows (starting from row 2 to skip headers)
    subjectsWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const combinedData = row.getCell(1).value?.toString()?.trim() || '';
      
      if (combinedData) {
        // Parse "CIE-LowerSecondary-7th-Mathematics" format
        const parts = combinedData.split('-');
        if (parts.length >= 4) {
          const board = parts[0];
          const category = parts[1];
          const grade = parts[2];
          const subject = parts.slice(3).join('-'); // Join in case subject has dashes
          
          subjectRows.push({ board, category, grade, subject });
        }
      }
    });

    console.log(`📖 Found ${subjectRows.length} subjects in Excel`);

    // Insert ALL subjects
    const experienceDescriptions = ['2 years teaching experience', '5 years advanced level', '3 years intermediate', '7 years expert level', '4 years beginner friendly'];
    const subjects = subjectRows.map((row, index) => ({
      id: `subject_${Date.now()}_${index}`,
      mentorId: existingMentors[index % existingMentors.length].id, // Distribute across mentors
      subject: `${row.subject} (${row.grade || 'General'})`,
      experience: experienceDescriptions[Math.floor(Math.random() * experienceDescriptions.length)],
      priority: (index % 5) + 1
    }));

    await db.insert(teacherSubjects).values(subjects);
    console.log(`✅ Imported ${subjects.length} subjects`);

    // IMPORT ALL QUALIFICATIONS
    console.log('\n🎓 Importing ALL qualifications from Excel...');
    
    const qualificationsWorkbook = new ExcelJS.Workbook();
    await qualificationsWorkbook.xlsx.readFile('../attached_assets/Good-Qualification_Specialization_Mapping_1758815683748.xlsx');
    
    const qualificationsWorksheet = qualificationsWorkbook.getWorksheet(1);
    if (!qualificationsWorksheet) {
      throw new Error('Could not find qualifications worksheet');
    }

    const qualificationRows: QualificationRow[] = [];
    
    // Read all rows (starting from row 2 to skip headers)
    qualificationsWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const qualification = row.getCell(1).value?.toString()?.trim() || '';
      const specialization = row.getCell(2).value?.toString()?.trim() || '';
      
      if (qualification && specialization) {
        qualificationRows.push({ qualification, specialization });
      }
    });

    console.log(`🎯 Found ${qualificationRows.length} qualifications in Excel`);

    // Insert ALL qualifications
    const scores = ['85%', '90%', '95%', '3.5 GPA', '3.7 GPA', '3.8 GPA', '3.9 GPA', 'First Class', 'Pass with Honours'];
    const qualifications = qualificationRows.map((row, index) => ({
      id: `qual_${Date.now()}_${index}`,
      mentorId: existingMentors[index % existingMentors.length].id, // Distribute across mentors
      qualification: row.qualification!,
      specialization: row.specialization!,
      score: scores[Math.floor(Math.random() * scores.length)],
      priority: (index % 3) + 1
    }));

    await db.insert(teacherQualifications).values(qualifications);
    console.log(`✅ Imported ${qualifications.length} qualifications`);

    // FINAL VERIFICATION
    console.log('\n📊 Final verification:');
    const finalSubjectCount = await db.select().from(teacherSubjects);
    const finalQualificationCount = await db.select().from(teacherQualifications);
    
    console.log(`✅ Total subjects imported: ${finalSubjectCount.length}`);
    console.log(`✅ Total qualifications imported: ${finalQualificationCount.length}`);
    console.log(`🎉 FULL Excel import complete!`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Run import if this file is executed directly
importAllExcelData().catch(console.error);

export { importAllExcelData };