import re

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

# Let's see what is imported
print(re.search(r'import \{[^}]+\}\s+from\s+"lucide-react";', content).group(0))
