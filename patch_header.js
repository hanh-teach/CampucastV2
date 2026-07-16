const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');
const searchButton = `<Search className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>`;
const newButton = `<Search className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onDrivingModeToggle}
              className="p-2.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group"
              title={uiLanguage === "vi" ? "Bật HUD Lái Xe" : "Enable Driving HUD"}
            >
              <Car className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>`;
code = code.replace(searchButton, newButton);
fs.writeFileSync('src/components/Header.tsx', code);
