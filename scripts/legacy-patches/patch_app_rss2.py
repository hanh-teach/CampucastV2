import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r'handleGenerateBriefing\(content\);\s*\}\}\s*isGenerating=\{step === "summarizing" \|\| step === "synthesizing"\}',
    'handleGenerateScript(content);\n                      setActiveTab("mission_studio");\n                      setMissionStudioSubTab("draft");\n                    }}\n                    isGenerating={step === "summarizing" || step === "synthesizing"}',
    content
)

with open("src/App.tsx", "w") as f:
    f.write(content)

