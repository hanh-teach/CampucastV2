import re

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

# 1. Update Scripts
content = content.replace(
    'filteredBriefings.map((brief) => (',
    'filteredBriefings.length > 0 ? (\n                filteredBriefings.map((brief) => (',
    1
)

content = content.replace(
    '</Button>\n                    </div>\n                  </Card>\n                ))\n              )}',
    '</Button>\n                    </div>\n                  </Card>\n                ))\n              ) : (\n                  <div className="py-20 text-center space-y-4">\n                    <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto">\n                      <FileText className="w-8 h-8 text-text-muted opacity-50" />\n                    </div>\n                    <p className="text-sm font-black text-text-muted uppercase tracking-widest">{t.noMissions}</p>\n                  </div>\n                )\n              )}',
    1
)

content = content.replace(
    '<h4 className="font-black text-sm text-text-main truncate">Script: {brief.payload.title}</h4>',
    '<h4 className="font-black text-sm text-text-main truncate">{uiLanguage === "vi" ? "Kịch bản" : "Script"}: {brief.payload.title}</h4>',
    1
)

content = content.replace(
    'View Text</Button>',
    '{uiLanguage === "vi" ? "Xem văn bản" : "View Text"}</Button>',
    1
)

# 2. Update Audio
content = content.replace(
    '{activeCategory === "audio" && (\n                filteredBriefings.map((brief) => (',
    '{activeCategory === "audio" && (\n                filteredBriefings.length > 0 ? (\n                filteredBriefings.map((brief) => (',
    1
)

content = content.replace(
    '<Download className="w-3 h-3 mr-2" /> Export\n                       </Button>\n                    </div>\n                  </Card>\n                ))\n              )}',
    '<Download className="w-3 h-3 mr-2" /> {uiLanguage === "vi" ? "Xuất" : "Export"}\n                       </Button>\n                    </div>\n                  </Card>\n                ))\n              ) : (\n                  <div className="py-20 text-center space-y-4">\n                    <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto">\n                      <Mic className="w-8 h-8 text-text-muted opacity-50" />\n                    </div>\n                    <p className="text-sm font-black text-text-muted uppercase tracking-widest">{t.noMissions}</p>\n                  </div>\n                )\n              )}',
    1
)

content = content.replace(
    '<h4 className="font-black text-sm text-text-main truncate">Audio Master: {brief.payload.title}</h4>',
    '<h4 className="font-black text-sm text-text-main truncate">{uiLanguage === "vi" ? "Bản thu" : "Audio Master"}: {brief.payload.title}</h4>',
    1
)

content = content.replace(
    '{selectedBriefId === brief.id ? (isPlayerPlaying ? "Pause" : "Resume") : "Play"}',
    '{selectedBriefId === brief.id ? (isPlayerPlaying ? (uiLanguage === "vi" ? "Tạm dừng" : "Pause") : (uiLanguage === "vi" ? "Tiếp tục" : "Resume")) : (uiLanguage === "vi" ? "Phát" : "Play")}',
    1
)

# 3. Update Templates
content = content.replace(
    'Use Template</Button>',
    '{uiLanguage === "vi" ? "Sử dụng mẫu" : "Use Template"}</Button>',
    1
)

# 4. Update Archive
content = content.replace(
    '<h3 className="text-sm font-black text-text-main uppercase tracking-widest">Archive Vault Empty</h3>',
    '<h3 className="text-sm font-black text-text-main uppercase tracking-widest">{uiLanguage === "vi" ? "Kho lưu trữ trống" : "Archive Vault Empty"}</h3>',
    1
)

content = content.replace(
    '<p className="text-[10px] text-text-muted font-medium uppercase tracking-wider max-w-xs mx-auto">Items older than 30 days are automatically archived here. No objects found currently.</p>',
    '<p className="text-[10px] text-text-muted font-medium uppercase tracking-wider max-w-xs mx-auto">{uiLanguage === "vi" ? "Các mục cũ hơn 30 ngày sẽ tự động được lưu trữ tại đây. Hiện chưa có mục nào." : "Items older than 30 days are automatically archived here. No objects found currently."}</p>',
    1
)

with open("src/components/views/AssetsTabView.tsx", "w") as f:
    f.write(content)

