# Recovery Guidelines

Tài liệu này quy định các quy tắc phục hồi trạng thái, xử lý lỗi và hỗ trợ người dùng hoàn thành công việc một cách liền mạch.

## 1. Nguyên tắc "Không bỏ rơi người dùng" (Never Say "Missing")
Hệ thống không bao giờ chỉ báo cáo sự thiếu sót mà không cung cấp giải pháp.
- **Thay vì**: "Thiếu Persona", "Chưa chọn RSS".
- **Nên dùng**: "Bạn có thể làm bản tin hay hơn nếu chọn Persona. [Chọn Persona] [Dùng mặc định]".

## 2. Recovery Design System (Hệ thống thiết kế phục hồi)
Mỗi tình huống lỗi hoặc thiếu sót phải có kịch bản phục hồi một click.

| Tình huống | Kịch bản phục hồi (Recovery) |
| :--- | :--- |
| Thiếu Persona | Dùng Default hoặc Nút dẫn đến chọn Persona |
| Thiếu RSS | Chọn RSS từ danh sách hoặc Dùng dữ liệu cache |
| Thiếu Giọng đọc | Dùng Giọng mặc định hệ thống |
| Chưa lưu dự án | Auto-save liên tục vào IndexedDB |
| Lỗi Generate | Nút Retry thông minh (không bắt đầu lại từ đầu) |
| Chuyển tab/Workstation | Resume Context (giữ nguyên trạng thái workflow) |
| Tải lại trang (Reload) | Restore Draft hoàn toàn từ cache |
| Lỗi Export | Retry Export với thông số đã cấu hình |

## 3. Progressive Assistance (Hỗ trợ tăng tiến)
Hệ thống dẫn dắt người dùng hoàn thành workflow thay vì bắt họ tự tìm đường.
- **Contextual Help**: Hiển thị gợi ý dựa trên bước hiện tại.
- **Soft Blocking**: Chỉ nhắc nhở về các bước quan trọng, không chặn đứng workflow trừ khi không thể tiếp tục về mặt kỹ thuật.
- **Smart Defaults**: Luôn cung cấp giá trị mặc định hợp lý để người dùng có thể "Generate" ngay lập tức mà không cần cấu hình phức tạp.

## 4. Resume Engine
- **Global State Persistence**: Mọi thay đổi trong `StudioDesk` (Script, Voice, Preferences) phải được persist ngay lập tức.
- **Last Active Project**: Home workstation luôn ưu tiên hiển thị dự án đang thực hiện gần nhất với nút "Tiếp tục".
