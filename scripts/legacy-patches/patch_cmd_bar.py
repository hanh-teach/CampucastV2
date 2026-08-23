import re

with open("src/components/MissionCommandBar.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r"backgroundColor: status === 'ready' \? `\$\{colors.success\}1a` : `\$\{colors.interactive\}1a`,",
    "backgroundColor: status === 'ready' ? `${colors.success}1a` : status === 'paused' ? `${colors.warning}1a` : `${colors.interactive}1a`,",
    content
)

content = re.sub(
    r"color: status === 'ready' \? colors\.success : colors\.interactive",
    "color: status === 'ready' ? colors.success : status === 'paused' ? colors.warning : colors.interactive",
    content
)

content = re.sub(
    r"backgroundColor: status === 'ready' \? colors\.success : colors\.interactive",
    "backgroundColor: status === 'ready' ? colors.success : status === 'paused' ? colors.warning : colors.interactive",
    content
)

with open("src/components/MissionCommandBar.tsx", "w") as f:
    f.write(content)

