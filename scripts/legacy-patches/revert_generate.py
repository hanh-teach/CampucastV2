import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace RssNotificationBanner
content = re.sub(
    r'onGenerate=\{\(\) => \{\s*setIsRssBasedGeneration\(true\);\s*const rawContent = formatArticlesForPrompt\(rssNotificationArticles, uiLanguage\);\s*handleGenerateScript\(rawContent\);\s*setShowRssNotification\(false\);\s*removeFromQueue\("automated-rss-daily-briefing"\);\s*setActiveTab\("mission_studio"\);\s*setMissionStudioSubTab\("draft"\);\s*\}\}',
    '''onGenerate={() => {
              setIsRssBasedGeneration(true);
              const rawContent = formatArticlesForPrompt(rssNotificationArticles, uiLanguage);
              setActiveTab("mission_studio");
              setMissionStudioSubTab("draft");
              handleGenerateBriefing(rawContent);
              setShowRssNotification(false);
              removeFromQueue("automated-rss-daily-briefing");
            }}''',
    content
)

# Replace RSSManager in App.tsx
content = re.sub(
    r'onGenerateFromRSS=\{\(content\) => \{\s*setIsRssBasedGeneration\(true\);\s*handleGenerateScript\(content\);\s*setActiveTab\("mission_studio"\);\s*setMissionStudioSubTab\("draft"\);\s*\}\}',
    '''onGenerateFromRSS={(content) => {
                      setIsRssBasedGeneration(true);
                      setActiveTab("mission_studio");
                      setMissionStudioSubTab("draft");
                      handleGenerateBriefing(content);
                    }}''',
    content
)

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r'if \(handleGenerateScript\) \{\s*handleGenerateScript\(content\);\s*\}\s*setActiveTab\("mission_studio"\);\s*if \(setMissionStudioSubTab\) \{\s*setMissionStudioSubTab\("draft"\);\s*\}',
    '''setActiveTab("mission_studio");
                      if (setMissionStudioSubTab) {
                        setMissionStudioSubTab("draft");
                      }
                      if (handleGenerateBriefing) {
                        handleGenerateBriefing(content);
                      }''',
    content
)

with open("src/components/views/AssetsTabView.tsx", "w") as f:
    f.write(content)

