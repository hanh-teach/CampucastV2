# UX Audit: Operator Experience (OX) Assessment

## North Star
**Mục tiêu của CommuteCast không phải là cung cấp nhiều tính năng, mà là giúp người dùng hoàn thành công việc nhanh nhất với ít thao tác nhất.**

### Ba nguyên tắc đánh giá UX:
1. Người dùng có biết phải làm gì tiếp theo không?
2. Người dùng có mất công đi tìm dữ liệu không?
3. Người dùng có phải ghi nhớ trạng thái hệ thống không?

---

## 1. Persona
### Persona 1: Giáo viên
*   **Mục tiêu**: Tạo bản tin để sử dụng ngay.
*   **Không quan tâm**: RSS, JSON, Prompt, AI Pipeline.
*   **Quan tâm**: Làm nhanh, Dễ tìm, Không mất dữ liệu.

### Persona 2: Content Creator
*   **Mục tiêu**: Tạo video.
*   **Quan tâm**: Thumbnail, Audio, Video, Export.
*   **Không quan tâm**: Pipeline AI.

---

## 2. User Journey
*Mở app → Tiếp tục Project → Sửa Script → Nghe thử → Render → Xuất Video → Đóng app → Ngày mai mở lại → Continue Working.*

---

## 3. Job Stories
*   **Khi tôi đang soạn một bản tin, tôi muốn có thể tiếp tục đúng vị trí hôm qua, để tôi không phải tìm lại Project.**

---

## 4. Friction Heatmap
| Pain | Severity |
| :--- | :--- |
| Không tìm thấy video | 🔴 Critical |
| Không biết lưu ở đâu | 🔴 Critical |
| Quá nhiều menu | 🔴 Critical |
| AI Host là màn hình riêng | 🟠 High |
| Analytics xuất hiện quá sớm | 🟡 Medium |

---

## 5. Screen Inventory
| Screen | Keep | Merge | Remove |
| :--- | :--- | :--- | :--- |
| Home | ✅ | | |
| AI Host | | ✅ Create | |
| Persona | | ✅ Create | |
| RSS | | ✅ Create | |
| Analytics | | ✅ Library | |
| Queue | | ✅ Library | |

---

## 6. Object Inventory
| Current Object | Proposed Object (Project-Centric) |
| :--- | :--- |
| Draft | Project |
| Briefing | Project → Script |
| RSS Session | Project → Source |
| Audio | Project → Audio |
| Podcast | Project |
| Video | Project → Video |
| Playlist | Project → Playlist |

---

## 7. Workflow Inventory
*   **Workflow 1**: RSS → Briefing → Audio → Video → Publish.
*   **Workflow 2**: Prompt → Script → Voice → Video → Publish.

---

## 8. UX KPI
| KPI | Target |
| :--- | :--- |
| Time to First Output | < 3 phút |
| Resume Success | >95% |
| Find Output | < 5 giây |
| Click to Export | ≤ 2 |
| Lost Project | 0 |
| Draft Recovery | 100% |

---

## 9. Refactor Backlog
| Sprint | Description |
| :--- | :--- |
| UX-001 | Audit (Completed) |
| UX-002 | Project Model |
| UX-003 | Resume Console |
| UX-004 | Unified Library |
| UX-005 | Studio Workflow |
| UX-006 | Command Palette |
| UX-007 | Background Jobs |
| UX-008 | Notification Center |
