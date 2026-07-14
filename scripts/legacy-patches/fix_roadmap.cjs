const fs = require('fs');
let content = fs.readFileSync('ROADMAP.md', 'utf-8');
const lines = content.split('\n');

const newLines = lines.map((line, i) => {
    if (i >= 129 && i <= 156 && line.includes('- **Sprint #')) {
        return line.replace(/— \*\*COMPLETED\*\* ✅ .*/, '— **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)');
    }
    return line;
});

fs.writeFileSync('ROADMAP.md', newLines.join('\n'));
