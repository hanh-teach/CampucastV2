import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r'const handleClearInput = \(\) => \{\s*setNewsContent\(""\);\s*\};',
    '''const handleClearInput = () => {
    setNewsContent("");
    setActivePayload(null);
    setActiveAudioChunks([]);
    setSelectedBriefId("");
    setMissionStudioSubTab("source");
  };''',
    content
)

with open("src/App.tsx", "w") as f:
    f.write(content)

