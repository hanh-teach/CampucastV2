const fs = require('fs');
let content = fs.readFileSync('ARCHITECTURE.md', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## Pipeline Engine Architecture (Application Layer)')) {
        skip = true;
    } else if (line.startsWith('## 4-Workstation Operator Platform Architecture')) {
        skip = false;
    }
    
    if (!skip) {
        newLines.push(line);
    }
}

fs.writeFileSync('ARCHITECTURE.md', newLines.join('\n'));
