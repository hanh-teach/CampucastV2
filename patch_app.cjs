const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const searchClick = `        onSearchClick={() => setShowSearchModal(true)}`;
const newClick = `        onSearchClick={() => setShowSearchModal(true)}
        onDrivingModeToggle={toggleDrivingMode}`;
code = code.replace(searchClick, newClick);
fs.writeFileSync('src/App.tsx', code);
