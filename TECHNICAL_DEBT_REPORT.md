# Technical Debt Report - CommuteCast Enterprise

Báo cáo này liệt kê các khoản nợ kỹ thuật thực tế đang tồn tại trong hệ thống, được đánh giá dựa trên độ phức tạp, mức độ phụ thuộc và độ phủ của test.

## 1. Nợ kỹ thuật mức độ CRITICAL (Rủi ro cực cao)

| Vị trí | Vấn đề cụ thể | Số dòng | Test bảo vệ | Hệ quả / Rủi ro |
| :--- | :--- | :---: | :---: | :--- |
| `server.ts` | **Monolithic Backend**: Chứa các endpoint cốt lõi chưa tách: `/api/share`, `/api/summarize`, `/api/voice-query`, `/api/assistant-chat`, `/api/prepare-wav`, `/api/download-wav-file`, `/api/db-config`. Module Podcast, TTS và News đã được tách thành công. | 1272 | File E2E (`tests/integration/api-e2e.test.ts`), Podcast Test (`tests/integration/podcast.routes.test.ts`), TTS Test (`tests/integration/tts.test.ts`) & News Test (`tests/integration/news.routes.test.ts`) | Thời gian build/transform đã giảm đáng kể. Tuy nhiên, logic xử lý Summarize và Voice Query vẫn là "nút thắt" CRITICAL. |
| `src/App.tsx` | **State & Layout Bloat**: Quản lý toàn bộ state toàn cục, logic điều phối (orchestration) và cấu trúc UI chính trong một file. | 1501 | Một số test tích hợp | Khó bảo trì, logic xử lý sự kiện (event handling) chồng chéo, dễ gây ra lỗi "mất state" khi chuyển tab. |

## 2. Nợ kỹ thuật mức độ HIGH (Rủi ro cao)

| Vị trí | Vấn đề cụ thể | Test bảo vệ | Hệ quả / Rủi ro |
| :--- | :--- | :---: | :--- |
| `src/components/views/SettingsTabView.tsx` | **Complex UI without Tests**: Chứa 475 dòng logic cấu hình quan trọng nhưng không có file test riêng biệt. | **Không có** | Từng xảy ra mất nội dung. Bất kỳ thay đổi nào vào UI Settings đều có thể làm hỏng logic lưu Preferences mà không hay biết. |
| `src/hooks/useAssistant.ts` | **AI Response Parsing**: Logic xử lý hội thoại với Assistant hoàn toàn là "hộp đen". | **Không có** | Rủi ro lỗi parsing khi định dạng trả về từ AI thay đổi, gây treo ứng dụng. |
| `src/hooks/useVoiceSearch.ts` | **Voice Integration Logic**: Xử lý stream audio và kết quả từ Search Engine. | **Không có** | Khó phát hiện lỗi trong quá trình trích xuất thông tin (RAG) hoặc lỗi kết nối Speech-to-Text. |

## 3. Nợ kỹ thuật mức độ MEDIUM (Rủi ro trung bình)

| Vị trí | Vấn đề cụ thể | Dòng code liên quan | Mức độ phụ thuộc (Imports) |
| :--- | :--- | :--- | :---: |
| `src/services/syncService.ts` | **Conflict Resolution Debt**: Logic giải quyết xung đột đã có Last-Write-Wins (LWW), nhưng chưa hỗ trợ merge field-level. | `src/services/syncService.ts:568` (`// Conflict Resolution: Last-Write-Wins (LWW)`) | 4 files |
| `src/services/rssService.ts` | **Parsing Complexity**: Logic parse RSS thô lồng ghép nhiều điều kiện xử lý lỗi cho các nguồn tin khác nhau. | `src/services/rssService.ts` | 5 files |

---
*Ghi chú: Mức độ rủi ro được tính dựa trên tần suất sửa đổi gần đây và tầm quan trọng của tính năng đối với trải nghiệm "Mission Success" của người dùng.*

## 4. Các vấn đề bảo mật đã giải quyết (Resolved Security Debt)
- **Vá lỗ hổng WebSocket `/ws/voice` (Critical)**: Đã xóa hoàn toàn biến hardcode `isAuthenticated = true`. Thay vào đó bằng hệ thống sinh token ngắn hạn một lần (`/api/voice-token`) có rate-limit riêng. Các kết nối WebSocket nâng cấp bắt buộc phải truyền token hợp lệ, giảm thiểu nguy cơ lạm dụng hạn mức Gemini API. Bảo vệ bởi test tích hợp `/tests/integration/voiceWs.test.ts`.
- **Siết chặt CORS & Tích hợp Helmet / Rate Limit (High)**: Cấu hình whitelist nguồn gốc CORS chỉ cho phép miền `APP_URL` và localhost. Tích hợp `helmet` bảo vệ ứng dụng, kết hợp `express-rate-limit` giới hạn 20 request/phút đối với các tác vụ AI nặng và 100 request/phút đối với các API thông thường để tránh tấn công DoS và lạm dụng API.

## 5. Các vấn đề UI/UX đã giải quyết (Resolved UI/UX Debt)
- **YouTube Audio Continuity & Ducking**: Khắc phục lỗi âm thanh bị ngắt quãng khi chuyển đổi chế độ lái xe (do unmount iframe). Đã chuyển sang YouTube IFrame Player API, hỗ trợ ducking âm lượng (100% -> 15%) mượt mà bằng kỹ thuật ramping khi có briefing/voice interaction. Đảm bảo audio luôn liên tục kể cả khi hình ảnh bị ẩn đi vì lý do an toàn.
- **Continuous Voice Intelligence (Gap Reduction)**: Loại bỏ khoảng trễ 300ms+ giữa mỗi lượt nhận diện giọng nói bằng cách chuyển sang `continuous: true` (Chrome Engine native support). Tối ưu `onresult` để xử lý accumulation stream, giảm "điểm mù" (blind spots) của trợ lý giọng nói khi người dùng ra lệnh liên tục. Đạt độ trễ trung bình < 10ms giữa các session khởi động lại (auto-restart).

