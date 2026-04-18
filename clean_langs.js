const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const files = fs.readdirSync(localesDir);

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(localesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "lang_XX": "XX - LanguageName" with "lang_XX": "LanguageName"
    content = content.replace(/"lang_([A-Z]{2})": "\1 - ([^"]+)"/g, '"lang_$1": "$2"');
    
    // Also fix any other formatting if we need to.
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Language names cleaned up.');
