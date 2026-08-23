# Feature Catalog - CommuteCast Enterprise

Dưới đây là bảng đánh giá mức độ hoàn thiện của các tính năng dựa trên phân tích mã nguồn thực tế tại `src/` và `server.ts`.

| Tính năng | % Hoàn thiện | Thành phần triển khai (File/Hook/Endpoint) | Test coverage | TODO / Placeholder / Stub | Phần còn thiếu |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **RSS Intelligence** | 100% | `src/services/rssService.ts`, `src/components/RSSManager.tsx`, `server.ts` (`/api/parse-rss`) | `tests/rssService.test.ts`, `tests/assetsRSSIntegration.test.ts` | Không tìm thấy TODO — cần review thủ công | Đã hoàn thiện toàn bộ kết nối RSS thật, URL scraping, bộ lọc từ khóa, và gợi ý cá nhân hóa. |
| **Mission / Briefing** | 98% | `src/hooks/useBriefingGeneration.ts`, `src/hooks/useBriefcase.ts` | `tests/integration/RealBriefingFlow.test.tsx` | Không tìm thấy TODO — cần review thủ công | Quản lý hạn ngạch (Quota Management) cho API AI ở mức độ người dùng cá nhân. |
| **Summarize AI** | 100% | `server.ts` (`/api/summarize`), `src/hooks/useBriefingGeneration.ts` | `tests/text.test.ts` | Không tìm thấy TODO — cần review thủ công | Đã hoàn thiện toàn bộ các chế độ AI (Rewrite, Fact Check, Podcast Style, v.v.). |
| **TTS / Voice Engine** | 100% | `src/services/broadcastSpeechEngine.ts`, `server.ts` (`/api/tts`) | `tests/synthesis.test.ts` | Không tìm thấy TODO — cần review thủ công | Hệ thống xử lý song ngữ (Bilingual) và chuẩn hóa số tiếng Việt đã hoàn thiện. |
| **Driving Mode** | 90% | `src/hooks/useDrivingMode.ts` | `tests/drivingMode.test.tsx` | Không tìm thấy TODO — cần review thủ công | Thiếu một HUD View chuyên biệt (mặc dù đã có logic Voice Command và HUD State). |
| **Podcast Publish** | 92% | `src/hooks/usePodcastPublishing.ts`, `server.ts` (`/api/podcast/publish`) | `tests/integration/api-e2e.test.ts` | Không tìm thấy TODO — cần review thủ công | Tích hợp sâu hơn với các nền tảng Podcast ngoài (Spotify/Apple Podcasts API). |
| **Library / Assets** | 95% | `src/services/offlineStorageService.ts`, `src/components/views/AssetsTabView.tsx` | `tests/offlineStorage.test.ts` | Không tìm thấy TODO — cần review thủ công | Hoàn thiện tính năng đánh dấu (Bookmark) đoạn hội thoại trong podcast. |
| **Sync / Offline** | 90% | `src/services/syncService.ts`, `src/services/supabaseClient.ts` | `tests/useSync.test.ts` | `src/services/syncService.ts:568` - `// Conflict Resolution: Last-Write-Wins (LWW)` | đã có LWW cơ bản, phần còn thiếu là merge field-level cho trường hợp 2 thiết bị sửa đồng thời khác trường dữ liệu |
| **Voice Search** | 85% | `src/hooks/useVoiceSearch.ts`, `server.ts` (`/api/voice-query`) | Không tìm thấy bằng chứng test | Không tìm thấy TODO — cần review thủ công | Cải thiện độ chính xác của RAG (Retrieval-Augmented Generation) khi tìm kiếm nội dung cũ. |
| **Settings** | 100% | `src/features/settings`, `src/hooks/usePreferences.ts` | `tests/preferenceService.test.ts`, `tests/SettingsRegression.test.tsx` | Không tìm thấy TODO — cần review thủ công | Đã hoàn thiện toàn bộ UI và logic lưu trữ Preferences. |
| **Media Session** | 100% | `src/components/ManualPcmPlayer.tsx` | `tests/mediaSession.test.tsx` | Không tìm thấy TODO | Hỗ trợ điều khiển qua vô-lăng, tai nghe Bluetooth và màn hình khoá. |
| **Assistant Chat** | 100% | `src/hooks/useAssistant.ts`, `server.ts` (`/api/assistant-chat`) | Không tìm thấy bằng chứng test | Không tìm thấy TODO — cần review thủ công | Đã tích hợp hoàn toàn và hỗ trợ hội thoại trợ lý phát thanh chuyên nghiệp thông minh. |

---
*Ghi chú: % hoàn thiện được tính dựa trên sự hiện diện của logic nghiệp vụ cốt lõi, xử lý lỗi, và khả năng vận hành thực tế thay vì chỉ là giao diện UI.*

### Đối chiếu nội dung thực tế (4 dòng đã gán nhãn sai trước đó):
1. **server.ts:41**: `    fs.accessSync(TTS_CACHE_DIR, fs.constants.W_OK);`
2. **src/services/syncService.ts:150**: `    const bucketName = "audio-briefings";`
3. **server.ts:2086**: `          const friendlyError = parseGeminiError(geminiError, isVi, false);`
4. **server.ts:3111**: `      console.log("[Podcast - GCS] No valid client keys discovered in env. Disabling active GCS module initialization.");`
