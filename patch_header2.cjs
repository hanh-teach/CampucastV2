const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');
const searchButton = `<Car className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />`;
const newButton = `<Car className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />`;
code = code.replace(searchButton, newButton);
fs.writeFileSync('src/components/Header.tsx', code);
