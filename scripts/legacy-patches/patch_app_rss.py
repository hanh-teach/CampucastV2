import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace handleGenerateBriefing with handleGenerateScript in App.tsx
# RssNotificationBanner
content = re.sub(
    r'handleGenerateBriefing\(rawContent\);\s*setShowRssNotification\(false\);\s*removeFromQueue\("automated-rss-daily-briefing"\);',
    'handleGenerateScript(rawContent);\n              setShowRssNotification(false);\n              removeFromQueue("automated-rss-daily-briefing");\n              setActiveTab("mission_studio");\n              setMissionStudioSubTab("draft");',
    content
)

# RSSManager in AI Center
content = re.sub(
    r'handleGenerateBriefing\(content\);\s*\}\}\s*isGenerating=\{false\}',
    'handleGenerateScript(content);\n                      setActiveTab("mission_studio");\n                      setMissionStudioSubTab("draft");\n                    }}\n                    isGenerating={false}',
    content
)

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

# RSSManager in AssetsTabView
content = re.sub(
    r'if \(handleGenerateBriefing\) \{\s*handleGenerateBriefing\(content\);\s*\}\s*setActiveTab\("mission_studio"\);',
    'if (handleGenerateScript) {\n                        handleGenerateScript(content);\n                      }\n                      setActiveTab("mission_studio");\n                      if (setMissionStudioSubTab) {\n                        setMissionStudioSubTab("draft");\n                      }',
    content
)

with open("src/components/views/AssetsTabView.tsx", "w") as f:
    f.write(content)

