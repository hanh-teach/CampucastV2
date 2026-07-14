# Definition of Done (DoD) - Backend Modularization

Tài liệu này quy định các tiêu chuẩn bắt buộc phải đạt được trước khi đánh dấu một đợt tách module (route extraction) từ `server.ts` là hoàn tất. Mọi thay đổi kiến trúc theo kiểu Strangler-Fig phải đối chiếu và đạt 100% các mục sau:

## 1. Static Analysis & Build
- [ ] **Linter Check**: Chạy `npm run lint` và trả về exit code 0. Không còn lỗi type (TS errors) hoặc biến không sử dụng (unused vars) trong module mới và monolith cũ.
- [ ] **Production Build**: Chạy `npm run build` và trả về exit code 0. Đảm bảo bundling server qua esbuild không bị lỗi import path.

## 2. Automated Testing (Safety Net)
- [ ] **Module Integration Test**: Phải có ít nhất một file test riêng (vd: `tests/feature.test.ts`) sử dụng `supertest` để test toàn bộ luồng dữ liệu của nhóm route vừa tách.
- [ ] **No Mocks Policy**: Không mock logic xử lý chính. Test phải gọi trực tiếp vào endpoint và kiểm tra kết quả trả về từ database/storage thực (hoặc emulator).
- [ ] **Full Regression**: Toàn bộ `npm test` phải PASS để đảm bảo việc tách module không gây hiệu ứng phụ (side-effects) lên các phần khác.

## 3. Functional Parity (Bảo toàn chức năng)
- [ ] **Feature Audit**: So sánh số dòng logic và các điều kiện `if/else`, `try/catch` trước và sau khi tách. Đảm bảo không có dòng code chức năng nào bị lược bỏ hoặc "tối ưu hóa" sai cách trong quá trình di chuyển.
- [ ] **Error Handling**: Các cơ chế retry, circuit breaker, và log lỗi phải được giữ nguyên 100% hành vi.

## 4. Manual Verification (Thực tế)
- [ ] **CURL/Browser Log**: Dán log kết quả gọi API thực tế (Success response) vào báo cáo hoàn tất.
- [ ] **Performance Check**: Thời gian phản hồi (Response time) không được tăng lên đáng kể do việc chuyển đổi sang modular routing.

## 5. Documentation Update
- [ ] **CHANGELOG.md**: Cập nhật chi tiết các file đã thay đổi và module đã tách.
- [ ] **VERSION.md**: Tăng version minor/patch tương ứng.
- [ ] **TECHNICAL_DEBT_REPORT.md**: Cập nhật lại bảng nợ kỹ thuật (Giảm nợ cho module đã tách).

---

## 6. Voice Intelligence & Continuous Audio (HUD)
- [ ] **Gap Measurement**: Log `Gap between sessions` phải hiển thị trong console.debug và giá trị < 200ms (trung bình trên simulator/mock).
- [ ] **Continuous Session**: Browser tự ngắt session sau ~60s phải được `useDrivingMode` bắt được và restart tự động.
- [ ] **Result Isolation**: Đảm bảo mỗi câu lệnh (isFinal) chỉ được gửi đến `onTranscript` đúng 1 lần, không bị trùng lặp do cơ chế accumulation của continuous mode.
- [ ] **Manual Stop Integrity**: Khi bấm "STOP" hoặc thoát Driving Mode, session voice phải tắt hẳn, không bị restart tự động.

---
*Lưu ý: Nếu bất kỳ mục nào ở trên không đạt, Sprint đó được coi là **FAILED** và không được phép tiến hành tách module tiếp theo.*
