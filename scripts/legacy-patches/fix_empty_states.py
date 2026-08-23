import re

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<p className="text-sm font-black text-text-muted uppercase tracking-widest">{t.noMissions}</p>',
    '<p className="text-sm font-black text-text-muted uppercase tracking-widest">{activeCategory === "scripts" ? (uiLanguage === "vi" ? "Chưa có kịch bản nào." : "No scripts found.") : activeCategory === "audio" ? (uiLanguage === "vi" ? "Chưa có âm thanh nào." : "No audio found.") : t.noMissions}</p>'
)

with open("src/components/views/AssetsTabView.tsx", "w") as f:
    f.write(content)

