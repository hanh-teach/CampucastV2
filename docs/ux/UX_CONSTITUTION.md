# Hiến pháp UX (UX Constitution)

Tài liệu này quy định các nguyên tắc bất biến cho toàn bộ trải nghiệm người dùng trong CommuteCast. Mọi thay đổi về giao diện và luồng thao tác đều phải tuân thủ nghiêm ngặt các nguyên tắc này.

## Các nguyên tắc cốt lõi

1.  **Không bắt người dùng ghi nhớ (Recognition over Recall)**: Hệ thống phải nhớ, người dùng không cần nhớ. Mọi trạng thái, file, dự án phải tự động được truy xuất đúng ngữ cảnh.
2.  **Không đánh số bước nếu không có toàn bộ quy trình**: Chỉ hiển thị số bước (Wizard) trong các quy trình tuần tự thực sự. Nếu không, hãy sử dụng nhãn ngữ cảnh.
3.  **Mọi lỗi đều đi kèm giải pháp**: Không bao giờ báo lỗi mà không cung cấp hành động để giải quyết. Mỗi thông báo lỗi phải kèm theo nút dẫn đến nơi cần thao tác.
4.  **Không làm mất công việc**: Tự động lưu và khôi phục trạng thái 100%. Người dùng không bao giờ phải thực hiện lại công việc dang dở.
5.  **Mọi thao tác đều có thể tiếp tục (Resume)**: Luôn cho phép người dùng tiếp tục tại đúng vị trí, thời điểm mà họ đã rời đi. Không bao giờ buộc người dùng khởi động lại từ đầu.
6.  **Một công việc = một hành trình liền mạch**: Thiết kế xoay quanh mục tiêu người dùng (Tạo bản tin, Tạo video), không ép buộc chuyển đổi qua nhiều màn hình module để hoàn thành một nhiệm vụ.
7.  **Hệ thống dẫn đường theo ngữ cảnh**: Khi thiếu bước, thay vì báo lỗi, hãy hiển thị gợi ý và cung cấp hành động dẫn trực tiếp đến đúng nơi cần hoàn thành.
8.  **Ưu tiên tiến độ công việc hơn cấu trúc kỹ thuật**: Người dùng làm việc với "Bản tin", "Video", không làm việc với "RSS", "Persona", hay "AI Pipeline". Các cấu trúc kỹ thuật phải nằm ẩn sau AI và quy trình làm việc.
9.  **The UI must never expose the system's internal architecture**: Internal Architecture belongs to developers. User Interface belongs to operators. Never expose technical terms like "Repository", "Session", "Capability", "Lifecycle", or "Payload" to the operator.
10. **No Pixel Before Purpose**: Mọi thành phần giao diện phải có mục đích rõ ràng trước khi được thiết kế.
11. **Every UI Must Earn Its Place**: Nếu một thành phần không giúp người dùng hoàn thành công việc hoặc ra quyết định nhanh hơn, hãy loại bỏ.
12. **Workflow Before Decoration**: Luồng công việc luôn quan trọng hơn hiệu ứng và trang trí.
13. **One Primary Action Per Screen**: Mỗi màn hình chỉ có một hành động chính nổi bật.
14. **Design Before Code**: Không triển khai giao diện khi chưa có tài liệu thiết kế và đặc tả được phê duyệt.
15. **Mission Immutability**: Every significant transition in a Mission must be recorded as an immutable event. The current state may change, but the history of how we got there must never be lost.

