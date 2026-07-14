# Information Architecture (IA)

Bản đồ cấu trúc điều hướng và tổ chức màn hình của CommuteCast dựa trên triết lý **Operator UX**.

## 1. Top-Level Navigation
Hệ thống được tổ chức thành 4 Workstation cốt lõi:

- **Home**: Resume Console (Trình điều khiển tiếp tục công việc)
- **Create**: Studio Workbench (Xưởng tạo nội dung)
- **Library**: Unified Asset Manager (Quản lý toàn bộ sản phẩm)
- **Settings**: System Configuration (Cấu hình hệ thống)

---

## 2. Structural Hierarchy

### 🏠 Home (Resume Console)
- **Continue Working**: Danh sách dự án đang dở, trạng thái render, thời gian dự kiến.
- **Recent Outputs**: Truy cập nhanh các sản phẩm vừa hoàn thành.
- **Pending Tasks**: Các việc cần sự chú ý của người dùng.

### 🎙 Create (Studio Workbench)
- **Project Context**: Tên dự án hiện tại.
- **Workflow Steps (Wizard)**: 
  - Nguồn (RSS/Search/Upload)
  - Chỉnh sửa Script
  - Chọn Giọng/Persona
  - Xem trước & Render
  - Xuất bản
- **Tools Panel (Contextual)**: Ẩn/hiện tùy theo bước hiện tại.

### 📚 Library (Unified Asset Manager)
- **Unified List**: Hiển thị tất cả: Video, Audio, Script, Briefing, Thumbnail.
- **Filtering**: Theo Dự án, Ngày, Loại tệp.
- **Search**: Tìm kiếm toàn bộ nội dung.

### ⚙ Settings (Configuration)
- **AI**: Cấu hình AI Host, Persona.
- **Voice**: Quản lý giọng đọc.
- **Account**: Tài khoản, API keys.
- **Storage**: Dung lượng, Backup.
- **Advanced**: Cấu hình hệ thống nâng cao.

---

## 3. Universal Objects
Tất cả dữ liệu được tổ chức xoay quanh thực thể **Project**:
`Project`
  ├── `Script`
  ├── `Audio`
  ├── `Video`
  ├── `Thumbnail`
  ├── `Metadata`
  └── `Activity Timeline`
