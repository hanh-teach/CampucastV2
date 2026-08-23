import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

# Replace the onClick handler for the Next button in renderSourceTab
old_onclick = 'onClick={() => { setIsRssBasedGeneration(false); handleGenerateBriefing(newsContent); }}'
new_onclick = 'onClick={() => { setIsRssBasedGeneration(false); handleGenerateBriefing(newsContent); if (setMissionStudioSubTab) setMissionStudioSubTab("draft"); }}'

content = content.replace(old_onclick, new_onclick)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
