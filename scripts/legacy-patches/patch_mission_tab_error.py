import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

replacement = r'''                     </div>
                   ))}
                   {previewVoiceError && <p className="text-status-error text-xs mt-2">{previewVoiceError}</p>}
                </div>
             </div>'''

content = re.sub(
    r'                     </div>\s*\}\)\}\s*</div>\s*</div>',
    replacement,
    content
)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
