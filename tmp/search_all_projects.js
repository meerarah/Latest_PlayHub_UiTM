import fs from 'fs';
import path from 'path';

const searchDirs = [
  'c:\\PlayHub vscode',
  'c:\\Project_FYP',
  'c:\\Ameerah',
  'c:\\Ameerah2',
  'c:\\FYP_PLAYHUB'
];
const query = 'Organize a tournament';

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.toLowerCase().includes(query.toLowerCase())) {
      console.log(`Found in: ${filePath}`);
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          console.log(`  Line ${idx + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
}

function traverse(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'dev-dist' || file === 'tmp') continue;
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        traverse(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html')) {
        searchFile(fullPath);
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

for (const dir of searchDirs) {
  if (fs.existsSync(dir)) {
    console.log(`Searching in ${dir}...`);
    traverse(dir);
  }
}
console.log("Search complete.");
