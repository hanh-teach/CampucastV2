#!/bin/bash
sed -i 's/{ id: "dashboard", label: "Dashboard" }/{ id: "dashboard", label: uiLanguage === "vi" ? "Bảng điều khiển" : "Dashboard" }/g' src/App.tsx
sed -i 's/{ id: "recent", label: "Recent" }/{ id: "recent", label: uiLanguage === "vi" ? "Gần đây" : "Recent" }/g' src/App.tsx
sed -i 's/{ id: "continue", label: "Continue Mission" }/{ id: "continue", label: uiLanguage === "vi" ? "Tiếp tục nhiệm vụ" : "Continue Mission" }/g' src/App.tsx
sed -i 's/{ id: "suggestions", label: "AI Suggestion" }/{ id: "suggestions", label: uiLanguage === "vi" ? "AI Đề xuất" : "AI Suggestion" }/g' src/App.tsx

sed -i 's/{ id: "source", label: "Source" }/{ id: "source", label: uiLanguage === "vi" ? "Nguồn" : "Source" }/g' src/App.tsx
sed -i 's/{ id: "research", label: "Research" }/{ id: "research", label: uiLanguage === "vi" ? "Nghiên cứu" : "Research" }/g' src/App.tsx
sed -i 's/{ id: "draft", label: "Draft" }/{ id: "draft", label: uiLanguage === "vi" ? "Bản thảo" : "Draft" }/g' src/App.tsx
sed -i 's/{ id: "editor", label: "Editor" }/{ id: "editor", label: uiLanguage === "vi" ? "Trình chỉnh sửa" : "Editor" }/g' src/App.tsx
sed -i 's/{ id: "voice", label: "Voice" }/{ id: "voice", label: uiLanguage === "vi" ? "Giọng đọc" : "Voice" }/g' src/App.tsx
sed -i 's/{ id: "preview", label: "Preview" }/{ id: "preview", label: uiLanguage === "vi" ? "Nghe thử" : "Preview" }/g' src/App.tsx
sed -i 's/{ id: "publish", label: "Publish" }/{ id: "publish", label: uiLanguage === "vi" ? "Xuất bản" : "Publish" }/g' src/App.tsx
sed -i 's/{ id: "history", label: "History" }/{ id: "history", label: uiLanguage === "vi" ? "Lịch sử" : "History" }/g' src/App.tsx

sed -i 's/{ id: "missions", label: "Missions" }/{ id: "missions", label: uiLanguage === "vi" ? "Nhiệm vụ" : "Missions" }/g' src/App.tsx
sed -i 's/{ id: "audio", label: "Audio" }/{ id: "audio", label: uiLanguage === "vi" ? "Âm thanh" : "Audio" }/g' src/App.tsx
sed -i 's/{ id: "scripts", label: "Scripts" }/{ id: "scripts", label: uiLanguage === "vi" ? "Kịch bản" : "Scripts" }/g' src/App.tsx
sed -i 's/{ id: "assets", label: "Assets" }/{ id: "assets", label: uiLanguage === "vi" ? "Tài nguyên" : "Assets" }/g' src/App.tsx
sed -i 's/{ id: "templates", label: "Templates" }/{ id: "templates", label: uiLanguage === "vi" ? "Mẫu" : "Templates" }/g' src/App.tsx
sed -i 's/{ id: "archive", label: "Archive" }/{ id: "archive", label: uiLanguage === "vi" ? "Lưu trữ" : "Archive" }/g' src/App.tsx

sed -i 's/{ id: "models", label: "Models" }/{ id: "models", label: uiLanguage === "vi" ? "Mô hình" : "Models" }/g' src/App.tsx
sed -i 's/{ id: "prompt", label: "Prompt" }/{ id: "prompt", label: uiLanguage === "vi" ? "Prompt" : "Prompt" }/g' src/App.tsx
sed -i 's/{ id: "personas", label: "Personas" }/{ id: "personas", label: uiLanguage === "vi" ? "Nhân vật" : "Personas" }/g' src/App.tsx
sed -i 's/{ id: "memory", label: "Memory" }/{ id: "memory", label: uiLanguage === "vi" ? "Bộ nhớ" : "Memory" }/g' src/App.tsx
sed -i 's/{ id: "automation", label: "Automation" }/{ id: "automation", label: uiLanguage === "vi" ? "Tự động hóa" : "Automation" }/g' src/App.tsx

sed -i 's/{ id: "general", label: "General" }/{ id: "general", label: uiLanguage === "vi" ? "Chung" : "General" }/g' src/App.tsx
sed -i 's/{ id: "appearance", label: "Appearance" }/{ id: "appearance", label: uiLanguage === "vi" ? "Giao diện" : "Appearance" }/g' src/App.tsx
sed -i 's/{ id: "storage", label: "Storage" }/{ id: "storage", label: uiLanguage === "vi" ? "Lưu trữ" : "Storage" }/g' src/App.tsx
sed -i 's/{ id: "sync", label: "Sync" }/{ id: "sync", label: uiLanguage === "vi" ? "Đồng bộ" : "Sync" }/g' src/App.tsx
sed -i 's/{ id: "security", label: "Security" }/{ id: "security", label: uiLanguage === "vi" ? "Bảo mật" : "Security" }/g' src/App.tsx
sed -i 's/{ id: "pwa", label: "PWA" }/{ id: "pwa", label: uiLanguage === "vi" ? "Ứng dụng PWA" : "PWA" }/g' src/App.tsx
sed -i 's/{ id: "about", label: "About" }/{ id: "about", label: uiLanguage === "vi" ? "Giới thiệu" : "About" }/g' src/App.tsx
