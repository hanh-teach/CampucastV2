import re

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip() == "</div>":
        # check if it's breaking something
        # in the errors we saw lines 238, 256, 309, 319, 344
        if i+1 < len(lines) and "style={isActive" in lines[i+1]:
            continue
        if i+1 < len(lines) and "</button>" in lines[i+1]:
            continue
        if i+1 < len(lines) and ">" == lines[i+1].strip():
            continue
        if i-1 >= 0 and "}" == lines[i-1].strip() and "{" in lines[i-1]:
            pass # wait, let's just look at the exact line numbers from the errors
    new_lines.append(line)

