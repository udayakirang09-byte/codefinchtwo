import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix relative imports to add .js extension and fix @shared paths
  const fixedContent = content
    .replace(/from\s+['"](\.\/.+?)['"];/g, (match, importPath) => {
      if (!importPath.endsWith('.js')) {
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    })
    .replace(/from\s+['"](\.\.\/.+?)['"];/g, (match, importPath) => {
      if (!importPath.endsWith('.js')) {
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    })
    // Fix @shared/* imports to relative paths
    .replace(/from\s+['"]@shared\/(.+?)['"];/g, (match, importPath) => {
      // Determine if we're in server or shared directory to get correct relative path
      if (filePath.includes('/server/')) {
        return `from "../shared/${importPath}.js";`;
      } else {
        return `from "./${importPath}.js";`;
      }
    });
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(fullPath);
    }
  }
}

// Fix imports in dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Fixing ESM imports in dist directory...');
  walkDirectory(distPath);
  console.log('ESM import fixes complete!');
} else {
  console.log('dist directory not found. Run build first.');
}