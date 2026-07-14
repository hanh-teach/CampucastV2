import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

content = content.replace("  activeSubTab\n}: MissionStudioProps) {", "  activeSubTab,\n  setMissionStudioSubTab\n}: MissionStudioProps) {")

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
