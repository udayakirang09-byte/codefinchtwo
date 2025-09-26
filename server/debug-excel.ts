import ExcelJS from 'exceljs';

async function debugExcelFiles() {
  console.log('🔍 Debugging Excel files...');
  
  try {
    // Debug subjects file
    console.log('\n📚 Subjects file structure:');
    const subjectsWorkbook = new ExcelJS.Workbook();
    await subjectsWorkbook.xlsx.readFile('../attached_assets/Good-Board_Category_Grade_Subject_List_Updated_1758815692812.xlsx');
    
    console.log(`Worksheets: ${subjectsWorkbook.worksheets.length}`);
    subjectsWorkbook.worksheets.forEach((ws, i) => {
      console.log(`  Worksheet ${i + 1}: "${ws.name}" (${ws.rowCount} rows)`);
    });
    
    const firstWorksheet = subjectsWorkbook.getWorksheet(1);
    if (firstWorksheet) {
      console.log('\nFirst 5 rows:');
      for (let rowNumber = 1; rowNumber <= Math.min(5, firstWorksheet.rowCount); rowNumber++) {
        const row = firstWorksheet.getRow(rowNumber);
        const values = [];
        for (let col = 1; col <= 10; col++) {
          const cell = row.getCell(col);
          values.push(cell.value?.toString() || '');
        }
        console.log(`  Row ${rowNumber}: ${values.join(' | ')}`);
      }
    }
    
    // Debug qualifications file
    console.log('\n🎓 Qualifications file structure:');
    const qualificationsWorkbook = new ExcelJS.Workbook();
    await qualificationsWorkbook.xlsx.readFile('../attached_assets/Good-Qualification_Specialization_Mapping_1758815683748.xlsx');
    
    console.log(`Worksheets: ${qualificationsWorkbook.worksheets.length}`);
    qualificationsWorkbook.worksheets.forEach((ws, i) => {
      console.log(`  Worksheet ${i + 1}: "${ws.name}" (${ws.rowCount} rows)`);
    });
    
    const qualFirstWorksheet = qualificationsWorkbook.getWorksheet(1);
    if (qualFirstWorksheet) {
      console.log('\nFirst 5 rows:');
      for (let rowNumber = 1; rowNumber <= Math.min(5, qualFirstWorksheet.rowCount); rowNumber++) {
        const row = qualFirstWorksheet.getRow(rowNumber);
        const values = [];
        for (let col = 1; col <= 10; col++) {
          const cell = row.getCell(col);
          values.push(cell.value?.toString() || '');
        }
        console.log(`  Row ${rowNumber}: ${values.join(' | ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugExcelFiles();