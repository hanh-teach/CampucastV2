# Interaction Guidelines

Quy tắc tương tác, phản hồi hệ thống và quản lý trạng thái.

## 1. Nguyên tắc cốt lõi
- **Recognition over Recall**: Hệ thống phải nhớ, người dùng không cần nhớ.
- **Soft Blocking**: Không chặn thao tác trừ khi thật sự cần thiết. Luôn cung cấp lựa chọn "Bỏ qua".
- **Context Navigation**: Lỗi hoặc thiếu bước phải đi kèm hành động (CTA) dẫn trực tiếp đến nơi cần xử lý.

## 2. Phản hồi hệ thống
- **Loading (Progressive Disclosure)**: Không hiển thị "Loading...". Phải hiển thị trạng thái cụ thể: "Đang phân tích RSS...", "Đang tạo Audio...".
- **Errors**: 
  - Không báo lỗi chung chung.
  - Phải kèm CTA giải quyết (Ví dụ: "Không tìm thấy RSS" -> [Chọn RSS], [Tạo thủ công]).
- **Auto-Save & Resume**: 
  - Mọi thao tác phải được tự động lưu.
  - Mọi workflow phải có khả năng khôi phục (Resume) đúng vị trí cuối cùng.

## 3. Empty States
- Không bao giờ hiển thị màn hình trắng.
- Luôn hiển thị CTA để bắt đầu công việc (Ví dụ: "Bạn chưa có bản tin nào" -> [Tạo bản tin đầu tiên]).

## 4. Universal Actions
- **Search (Ctrl+K)**: Công cụ tìm kiếm/chỉ huy toàn cục (Universal Command).
- **Navigation**: Luôn cho phép quay lại Project mẹ từ bất kỳ thành phần con nào.
