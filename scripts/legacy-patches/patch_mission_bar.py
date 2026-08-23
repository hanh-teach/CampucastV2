import re

with open("src/components/MissionIntelligenceWorkspace.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r'status=\{currentMission\?.status === "completed" \? "ready" : \s*isRunning \? "running" : \s*currentMission\?.status === "failed" \? "paused" : "ready"\}',
    'status={currentMission?.status === "completed" ? "ready" : isRunning ? "running" : currentMission?.status === "failed" ? "paused" : currentMission?.status === "paused" ? "paused" : "ready"}',
    content
)

with open("src/components/MissionIntelligenceWorkspace.tsx", "w") as f:
    f.write(content)

