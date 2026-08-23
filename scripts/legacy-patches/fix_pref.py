import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
'''                  <PreferencesForm
                    preferences={preferences}
                    updatePreferences={updatePreferences}
                    uiLanguage={uiLanguage}
                    t={t}
                    userPref={userPref}
                    updateSpeed={updateSpeed}
                    step={step}
                    setIsRssBasedGeneration={setIsRssBasedGeneration}
                  />''',
'''                  <PreferencesForm
                    preferences={preferences}
                    updatePreferences={updatePreferences}
                    uiLanguage={uiLanguage}
                    t={t}
                    userPref={userPref}
                    updateSpeed={updateSpeed}
                    step={step}
                    setIsRssBasedGeneration={setIsRssBasedGeneration}
                    handleGenerateBriefing={() => {
                      setActiveTab("mission_studio");
                      setMissionStudioSubTab("draft");
                      handleGenerateBriefing();
                    }}
                  />'''
)

with open("src/App.tsx", "w") as f:
    f.write(content)
