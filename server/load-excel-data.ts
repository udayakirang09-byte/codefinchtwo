import ExcelJS from 'exceljs';
import { storage } from './storage.js';
import { db } from './db.js';

interface QualificationData {
  name: string;
  description?: string;
  category?: string;
  displayOrder?: number;
}

interface SpecializationData {
  name: string;
  description?: string;
  category?: string;
  displayOrder?: number;
}

interface SubjectData {
  name: string;
  description?: string;
  board?: string;
  grade?: string;
  category?: string;
  displayOrder?: number;
}

async function loadQualificationsAndSpecializations() {
  console.log('📂 Loading qualifications and specializations from Excel...');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('attached_assets/Good-Qualification_Specialization_Mapping_1758815683748.xlsx');
  
  // Get the first worksheet
  const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in qualifications Excel file');
  }
  
  console.log(`📊 Found worksheet: ${worksheet.name}`);
  console.log(`📋 Total rows: ${worksheet.rowCount}`);
  
  const qualifications: QualificationData[] = [];
  const specializations: SpecializationData[] = [];
  const specializationSet = new Set<string>();
  
  // Skip header row, start from row 2
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    // Skip empty rows
    if (!row.hasValues) continue;
    
    const qualification = row.getCell(1).value?.toString()?.trim();
    const specialization = row.getCell(2).value?.toString()?.trim();
    const category = row.getCell(3).value?.toString()?.trim() || '';
    
    if (qualification) {
      qualifications.push({
        name: qualification,
        description: `Professional qualification: ${qualification}`,
        category: category || (qualification.toLowerCase().includes('bachelor') ? 'undergraduate' : 
                  qualification.toLowerCase().includes('master') ? 'postgraduate' :
                  qualification.toLowerCase().includes('phd') ? 'doctoral' : 'professional'),
        displayOrder: qualifications.length
      });
    }
    
    if (specialization && !specializationSet.has(specialization)) {
      specializationSet.add(specialization);
      specializations.push({
        name: specialization,
        description: `Specialization area: ${specialization}`,
        category: category || 'General',
        displayOrder: specializations.length
      });
    }
  }
  
  console.log(`✅ Processed ${qualifications.length} qualifications`);
  console.log(`✅ Processed ${specializations.length} unique specializations`);
  
  // Clear existing data
  console.log('🗑️ Clearing existing qualification and specialization data...');
  await storage.clearQualifications();
  await storage.clearSpecializations();
  
  // Insert new data using batch operations for much better performance
  console.log('📥 Batch inserting qualifications...');
  await storage.batchCreateQualifications(qualifications);
  
  console.log('📥 Batch inserting specializations...');
  await storage.batchCreateSpecializations(specializations);
  
  console.log('✅ Qualifications and specializations loaded successfully!');
}

async function loadSubjects() {
  console.log('📂 Loading subjects from Excel...');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('attached_assets/Good-Board_Category_Grade_Subject_List_Updated_1758815692812.xlsx');
  
  // Get the first worksheet
  const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in subjects Excel file');
  }
  
  console.log(`📊 Found worksheet: ${worksheet.name}`);
  console.log(`📋 Total rows: ${worksheet.rowCount}`);
  
  const subjects: SubjectData[] = [];
  
  // Skip header row, start from row 2
  // Format is: "Board-Category-Grade-Subject" in single column
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    
    // Skip empty rows
    if (!row.hasValues) continue;
    
    const combinedData = row.getCell(1).value?.toString()?.trim();
    
    if (combinedData) {
      // Split by hyphen: "CIE-LowerSecondary-7th-Mathematics"
      const parts = combinedData.split('-');
      
      if (parts.length >= 4) {
        const board = parts[0]; // CIE
        const category = parts[1]; // LowerSecondary
        const grade = parts[2]; // 7th
        const subject = parts.slice(3).join('-'); // Mathematics (or "Further Mathematics")
        
        subjects.push({
          name: subject,
          description: `${board} ${subject} for ${grade} (${category})`,
          board: board,
          grade: grade,
          category: category,
          displayOrder: subjects.length
        });
      }
    }
  }
  
  console.log(`✅ Processed ${subjects.length} subjects`);
  
  // Clear existing data
  console.log('🗑️ Clearing existing subject data...');
  await storage.clearSubjects();
  
  // Insert new data using batch operations for much better performance
  console.log('📥 Batch inserting subjects...');
  await storage.batchCreateSubjects(subjects);
  
  console.log('✅ Subjects loaded successfully!');
}

async function main() {
  try {
    console.log('🚀 Starting Excel data loading process...');
    
    await loadQualificationsAndSpecializations();
    await loadSubjects();
    
    console.log('🎉 All Excel data loaded successfully!');
    
    // Display final counts
    const qualCount = await storage.getQualificationsCount();
    const specCount = await storage.getSpecializationsCount();
    const subjCount = await storage.getSubjectsCount();
    
    console.log(`📊 Final counts:`);
    console.log(`   - Qualifications: ${qualCount}`);
    console.log(`   - Specializations: ${specCount}`);
    console.log(`   - Subjects: ${subjCount}`);
    
  } catch (error) {
    console.error('❌ Error loading Excel data:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
main();