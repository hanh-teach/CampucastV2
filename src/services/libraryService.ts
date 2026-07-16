/**
 * Library Service
 * Bảng điều khiển và quản lý nghiệp vụ cho Tab Thư viện (Library)
 * Cung cấp API lưu trữ, sao chép, lưu trữ lưu trữ (archive), xóa, chia sẻ và xuất bản tin
 */

import { SavedSummary } from "../types";
import { Mission } from "../types/v4/mission";
import { 
  saveBriefing, 
  deleteBriefing, 
  getBriefing 
} from "./storageService";
import { 
  updateMission, 
  deleteMission as deleteV4Mission, 
  createMission,
  getMission
} from "./missionService";
import { saveSharedBriefing } from "./shareService";
import { getApiUrl } from "../utils/apiUtils";
import { v4 as uuidv4 } from "uuid";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

// ============================================================
// TYPES & CUSTOM ERRORS
// ============================================================

/**
 * Định danh lỗi đặc trưng cho các thao tác trên Thư viện
 */
export class LibraryError extends Error {
  constructor(
    public code: string, 
    message: string, 
    public details?: any
  ) {
    super(message);
    this.name = "LibraryError";
    // Đảm bảo prototype chain chính xác khi kế thừa Error trong ES5/ES6
    Object.setPrototypeOf(this, LibraryError.prototype);
  }
}

/**
 * Kết quả chuẩn hóa trả về từ tất cả các thao tác của LibraryService
 */
export interface LibraryOperationResult<T> {
  success: boolean;
  data?: T;
  error?: LibraryError;
  rollback?: () => Promise<void>;
}

export interface ShareResult {
  shareUrl: string;
  canShare: boolean;
  title: string;
  text: string;
}

export type ExportFormat = "json" | "markdown" | "txt" | "docx" | "script" | "audio" | "zip";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Kiểm tra xem đối tượng có phải là một bản tin đã lưu (SavedSummary) hay không
 */
export function isSavedSummary(item: any): item is SavedSummary {
  return !!(item && typeof item === "object" && "payload" in item && "preferences" in item);
}

/**
 * Trình kích hoạt tải xuống tệp trên trình duyệt từ một Blob
 */
function triggerFileDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// SERVICE IMPLEMENTATION
// ============================================================

/**
 * LƯU TRỮ (SAVE)
 * Lưu trữ đối tượng vào IndexedDB / Local Storage tương ứng.
 * Trả về đối tượng sau khi lưu thành công để cập nhật UI.
 * Hỗ trợ optimistic updates và rollback hành động nếu gặp sự cố.
 */
export async function saveMission(
  item: SavedSummary | Mission
): Promise<LibraryOperationResult<SavedSummary | Mission>> {
  let originalState: SavedSummary | Mission | undefined;

  try {
    if (isSavedSummary(item)) {
      // 1. Sao lưu trạng thái gốc cho Rollback
      const prev = await getBriefing(item.id);
      if (prev) {
        originalState = JSON.parse(JSON.stringify(prev));
      }

      // 2. Thiết lập đối tượng cập nhật với timestamp & dirty state mới nhất
      const updatedItem: SavedSummary = {
        ...item,
        timestamp: new Date().toISOString()
      };

      await saveBriefing(updatedItem);

      return {
        success: true,
        data: updatedItem,
        rollback: async () => {
          if (originalState && isSavedSummary(originalState)) {
            await saveBriefing(originalState);
          } else {
            await deleteBriefing(item.id);
          }
        }
      };
    } else {
      // 1. Sao lưu trạng thái gốc cho Rollback
      const prev = await getMission(item.id);
      if (prev) {
        originalState = JSON.parse(JSON.stringify(prev));
      }

      // 2. Thực hiện cập nhật
      const updatedMission = await updateMission(item.id, {
        name: item.name,
        status: item.status,
        priority: item.priority,
        config: item.config,
        steps: item.steps,
        result: item.result,
        metadata: {
          ...(item.metadata || {}),
          savedAt: new Date().toISOString()
        }
      } as any);
      
      if (!updatedMission) {
        throw new LibraryError(
          "MISSION_NOT_FOUND",
          `Mission with ID ${item.id} could not be updated because it was not found.`
        );
      }

      return {
        success: true,
        data: updatedMission,
        rollback: async () => {
          if (originalState && !isSavedSummary(originalState)) {
            await updateMission(item.id, {
              name: originalState.name,
              status: originalState.status,
              priority: originalState.priority,
              config: originalState.config,
              steps: originalState.steps,
              result: originalState.result,
              metadata: originalState.metadata
            } as any);
          } else {
            await deleteV4Mission(item.id);
          }
        }
      };
    }
  } catch (error: any) {
    console.error("[LibraryService] Error in saveMission:", error);
    return {
      success: false,
      error: error instanceof LibraryError 
        ? error 
        : new LibraryError("SAVE_FAILED", error.message || "Failed to save the asset.", error)
    };
  }
}

/**
 * SAO CHÉP (DUPLICATE)
 * Nhân bản đối tượng hiện tại thành một bản sao mới với ID mới.
 * Khởi tạo lại toàn bộ metadata runtime và analytics để tránh rò rỉ dữ liệu cũ.
 */
export async function duplicateMission(
  item: SavedSummary | Mission
): Promise<LibraryOperationResult<SavedSummary | Mission>> {
  try {
    if (isSavedSummary(item)) {
      const uniqueId = `brief_${uuidv4()}`;
      
      // Khởi tạo bản sao sạch với toàn bộ các trường metadata / thống kê được đặt lại
      const duplicatedBriefing: SavedSummary = {
        id: uniqueId,
        timestamp: new Date().toISOString(),
        payload: {
          ...item.payload,
          title: `${item.payload.title} (Bản sao)`
        },
        preferences: {
          ...item.preferences
        },
        // Khởi tạo/Đặt lại hoàn toàn các chỉ số đo lường & analytics
        likeCount: 0,
        shareCount: 0,
        audioChunks: item.audioChunks, // Giữ các đoạn âm thanh gốc nếu có
        isArchived: false
      } as any;

      // Xóa bỏ tất cả các trường dữ liệu mang tính cá nhân, lịch sử hoặc phân tích
      const cleanBriefing = { ...duplicatedBriefing } as any;
      delete cleanBriefing.statistics;
      delete cleanBriefing.history;
      delete cleanBriefing.shareLink;
      delete cleanBriefing.downloadCount;
      delete cleanBriefing.lastPlayed;
      delete cleanBriefing.createdAt;
      delete cleanBriefing.updatedAt;
      delete cleanBriefing.archivedAt;
      delete cleanBriefing.archivedBy;
      delete cleanBriefing.archiveReason;
      delete cleanBriefing.isDeleted;
      delete cleanBriefing.deletedAt;

      await saveBriefing(cleanBriefing);

      return {
        success: true,
        data: cleanBriefing,
        rollback: async () => {
          await deleteBriefing(uniqueId);
        }
      };
    } else {
      // Gọi API createMission từ missionService để sinh một V4 Mission mới sạch sẽ
      const clonedMission = await createMission({
        name: `${item.name} (Bản sao)`,
        type: item.type,
        priority: item.priority,
        language: item.language,
        topic: item.topic,
        feedIds: item.config?.feedIds || [],
        articleIds: item.config?.articleIds || [],
        options: item.config?.options || {}
      });

      if (!clonedMission) {
        throw new LibraryError(
          "DUPLICATE_MISSION_FAILED",
          "Failed to create duplicated V4 Mission object."
        );
      }

      return {
        success: true,
        data: clonedMission,
        rollback: async () => {
          await deleteV4Mission(clonedMission.id);
        }
      };
    }
  } catch (error: any) {
    console.error("[LibraryService] Error in duplicateMission:", error);
    return {
      success: false,
      error: error instanceof LibraryError 
        ? error 
        : new LibraryError("DUPLICATE_FAILED", error.message || "Failed to duplicate the asset.", error)
    };
  }
}

/**
 * LƯU TRỮ TẠM (ARCHIVE / RESTORE)
 * Đánh dấu trạng thái lưu trữ (isArchived=true/false) mà không xóa thật khỏi cơ sở dữ liệu.
 * Đóng gói chi tiết siêu dữ liệu (người thực hiện, lý do, mốc thời gian).
 */
export async function archiveMission(
  item: SavedSummary | Mission, 
  archive: boolean = true,
  options?: { archivedBy?: string; archiveReason?: string }
): Promise<LibraryOperationResult<SavedSummary | Mission>> {
  let originalState: SavedSummary | Mission | undefined;

  try {
    const operator = options?.archivedBy || "user";
    const reason = options?.archiveReason || "manual_archive";

    if (isSavedSummary(item)) {
      const prev = await getBriefing(item.id);
      if (prev) {
        originalState = JSON.parse(JSON.stringify(prev));
      }

      const updatedItem: SavedSummary & { 
        isArchived?: boolean; 
        archivedAt?: string; 
        archivedBy?: string; 
        archiveReason?: string;
      } = {
        ...item,
        isArchived: archive,
        archivedAt: archive ? new Date().toISOString() : undefined,
        archivedBy: archive ? operator : undefined,
        archiveReason: archive ? reason : undefined
      };

      if (!archive) {
        delete updatedItem.archivedAt;
        delete updatedItem.archivedBy;
        delete updatedItem.archiveReason;
      }

      await saveBriefing(updatedItem);

      return {
        success: true,
        data: updatedItem,
        rollback: async () => {
          if (originalState) {
            await saveBriefing(originalState);
          }
        }
      };
    } else {
      const prev = await getMission(item.id);
      if (prev) {
        originalState = JSON.parse(JSON.stringify(prev));
      }

      const updatedMission = await updateMission(item.id, {
        metadata: {
          ...(item.metadata || {}),
          isArchived: archive,
          archivedAt: archive ? new Date().toISOString() : undefined,
          archivedBy: archive ? operator : undefined,
          archiveReason: archive ? reason : undefined
        }
      } as any);
      
      if (!updatedMission) {
        throw new LibraryError(
          "MISSION_NOT_FOUND",
          `Mission with ID ${item.id} not found to perform archive action.`
        );
      }

      return {
        success: true,
        data: updatedMission,
        rollback: async () => {
          if (originalState && !isSavedSummary(originalState)) {
            await updateMission(item.id, {
              metadata: originalState.metadata
            } as any);
          }
        }
      };
    }
  } catch (error: any) {
    console.error("[LibraryService] Error in archiveMission:", error);
    return {
      success: false,
      error: error instanceof LibraryError 
        ? error 
        : new LibraryError("ARCHIVE_FAILED", error.message || "Failed to toggle archive status.", error)
    };
  }
}

/**
 * XÓA VÂN TAY (DELETE / PURGE)
 * Hỗ trợ hai chế độ xóa:
 * 1. Soft Delete (Mặc định): Chỉ gắn cờ `isDeleted` kèm thời gian `deletedAt`
 *    để ẩn khỏi giao diện hiển thị chính nhưng vẫn hỗ trợ khôi phục.
 * 2. Hard Delete (Purge): Xóa vĩnh viễn dữ liệu để tiết kiệm bộ nhớ IndexedDB & đảm bảo GDPR.
 */
export async function deleteMission(
  id: string,
  options?: { softDelete?: boolean }
): Promise<LibraryOperationResult<boolean>> {
  const isSoft = options?.softDelete !== false; // Mặc định là Soft Delete
  let originalState: SavedSummary | Mission | undefined;

  try {
    // Tìm kiếm nguồn dữ liệu gốc trước khi xóa để hỗ trợ Rollback
    let isBrief = false;
    let isV4 = false;

    const existingBrief = await getBriefing(id);
    if (existingBrief) {
      isBrief = true;
      originalState = JSON.parse(JSON.stringify(existingBrief));
    } else {
      const existingMission = await getMission(id);
      if (existingMission) {
        isV4 = true;
        originalState = JSON.parse(JSON.stringify(existingMission));
      }
    }

    if (!originalState) {
      throw new LibraryError(
        "ASSET_NOT_FOUND",
        `Asset with ID ${id} was not found for deletion.`
      );
    }

    if (isSoft) {
      // --- CHẾ ĐỘ SOFT DELETE ---
      if (isBrief) {
        const updatedItem: SavedSummary & { isDeleted?: boolean; deletedAt?: string } = {
          ...(originalState as SavedSummary),
          isDeleted: true,
          deletedAt: new Date().toISOString()
        };
        await saveBriefing(updatedItem);
      } else if (isV4) {
        await updateMission(id, {
          metadata: {
            ...((originalState as Mission).metadata || {}),
            isDeleted: true,
            deletedAt: new Date().toISOString()
          }
        } as any);
      }
    } else {
      // --- CHẾ ĐỘ HARD DELETE ---
      if (isBrief) {
        await deleteBriefing(id);
      } else if (isV4) {
        const success = await deleteV4Mission(id);
        if (!success) {
          throw new LibraryError("HARD_DELETE_FAILED", `Failed to purge V4 Mission: ${id}`);
        }
      }
    }

    return {
      success: true,
      data: true,
      rollback: async () => {
        if (originalState) {
          if (isBrief) {
            await saveBriefing(originalState as SavedSummary);
          } else if (isV4) {
            // Khôi phục lại trạng thái V4
            await updateMission(id, {
              name: (originalState as Mission).name,
              status: (originalState as Mission).status,
              priority: (originalState as Mission).priority,
              config: (originalState as Mission).config,
              steps: (originalState as Mission).steps,
              result: (originalState as Mission).result,
              metadata: (originalState as Mission).metadata
            } as any);
          }
        }
      }
    };
  } catch (error: any) {
    console.error("[LibraryService] Error in deleteMission:", error);
    return {
      success: false,
      error: error instanceof LibraryError 
        ? error 
        : new LibraryError("DELETE_FAILED", error.message || "Failed to delete the asset.", error)
    };
  }
}

/**
 * CHIA SẺ (SHARE)
 * Đăng ký bản tin lên hệ thống chia sẻ trung tâm của CommuteCast và trả về siêu dữ liệu chia sẻ.
 */
export async function shareMission(
  item: SavedSummary | Mission
): Promise<LibraryOperationResult<ShareResult>> {
  try {
    let title = "Bản tin CommuteCast";
    let text = "Nghe bản tin radio cá nhân hóa của bạn được sản xuất bởi CommuteCast.";
    let shareUrl = typeof window !== "undefined" ? window.location.origin : "";
    
    if (isSavedSummary(item)) {
      title = item.payload.title || title;
      text = item.payload.introduction || text;
      
      try {
        shareUrl = await saveSharedBriefing(item);
      } catch (err) {
        console.warn("[LibraryService] Back-end sharing service unavailable, falling back to local route:", err);
        shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${item.id}`;
      }
    } else {
      title = item.name || title;
      text = `Quy trình sản xuất CommuteCast: ${item.type}`;
      shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/mission/${item.id}`;
    }
    
    const result: ShareResult = {
      shareUrl,
      canShare: typeof navigator !== "undefined" && typeof navigator.share === "function",
      title,
      text
    };

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error("[LibraryService] Error in shareMission:", error);
    return {
      success: false,
      error: new LibraryError("SHARE_FAILED", error.message || "Failed to initialize sharing data.", error)
    };
  }
}

/**
 * XUẤT TÀI NGUYÊN (EXPORT)
 * Hỗ trợ xuất dữ liệu ra nhiều định dạng chuyên nghiệp.
 * Tích hợp thư viện `docx` để tạo các tệp Word (.docx) chuẩn cấu trúc XML thay vì giả lập HTML.
 * Sử dụng `jszip` để nén gói tài nguyên phong phú.
 */
export async function exportMission(
  item: SavedSummary | Mission, 
  format: ExportFormat
): Promise<LibraryOperationResult<void>> {
  try {
    if (!isSavedSummary(item)) {
      if (format === "json") {
        const jsonStr = JSON.stringify(item, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        triggerFileDownload(blob, `mission_${item.id}.json`);
        return { success: true };
      }
      throw new LibraryError(
        "INVALID_EXPORT_FORMAT",
        "V4 Mission objects only support JSON export format."
      );
    }
    
    const title = item.payload.title || "Untitled Briefing";
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    
    // 1. Định dạng JSON
    if (format === "json") {
      const jsonStr = JSON.stringify(item, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      triggerFileDownload(blob, `${sanitizedTitle}.json`);
      return { success: true };
    }
    
    // 2. Định dạng Markdown (.md)
    if (format === "markdown") {
      let md = `# ${title}\n`;
      md += `*Thời gian tạo: ${new Date(item.timestamp).toLocaleString()}*\n\n`;
      md += `## Lời Mở Đầu / Giới Thiệu\n${item.payload.introduction}\n\n`;
      
      item.payload.chapters.forEach((ch, idx) => {
        md += `## Chương ${idx + 1}: ${ch.topic}\n`;
        md += `### Kịch Bản Đọc Giọng Nói\n${ch.scriptText}\n\n`;
        if (ch.summaryBullets && ch.summaryBullets.length > 0) {
          md += `### Ý Chính Điểm Tin\n`;
          ch.summaryBullets.forEach(b => {
            md += `- ${b}\n`;
          });
          md += `\n`;
        }
      });
      
      md += `## Lời Kết / Thông Tin Giao Thông\n${item.payload.conclusion}\n`;
      
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      triggerFileDownload(blob, `${sanitizedTitle}.md`);
      return { success: true };
    }
    
    // 3. Định dạng Văn Bản Thuần (.txt)
    if (format === "txt") {
      let txt = `${title}\n`;
      txt += `Ngày tạo: ${new Date(item.timestamp).toLocaleString()}\n`;
      txt += `==================================================\n\n`;
      txt += `[MỞ ĐẦU]\n${item.payload.introduction}\n\n`;
      
      item.payload.chapters.forEach((ch, idx) => {
        txt += `[CHƯƠNG ${idx + 1}: ${ch.topic}]\n`;
        txt += `${ch.scriptText}\n\n`;
        if (ch.summaryBullets && ch.summaryBullets.length > 0) {
          txt += `Ý chính:\n`;
          ch.summaryBullets.forEach(b => {
            txt += `- ${b}\n`;
          });
          txt += `\n`;
        }
      });
      
      txt += `[LỜI KẾT]\n${item.payload.conclusion}\n`;
      
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      triggerFileDownload(blob, `${sanitizedTitle}.txt`);
      return { success: true };
    }
    
    // 4. Định dạng Tài Liệu Word Chuẩn (.docx)
    // Sử dụng thư viện `docx` chuyên nghiệp để tạo tài liệu chuẩn XML
    if (format === "docx") {
      const docChildren: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 48, // 24pt
            }),
          ],
          heading: HeadingLevel.TITLE,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Ngày tạo bản tin: ${new Date(item.timestamp).toLocaleString()}`,
              italics: true,
              color: "64748b",
            }),
          ],
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Lời Mở Đầu",
              bold: true,
              size: 32, // 16pt
              color: "1e3a8a",
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: item.payload.introduction,
            }),
          ],
          spacing: { after: 200 },
        }),
      ];

      item.payload.chapters.forEach((ch, idx) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Chương ${idx + 1}: ${ch.topic}`,
                bold: true,
                size: 32,
                color: "1e3a8a",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          })
        );

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Kịch bản giọng đọc:",
                bold: true,
                size: 24,
                color: "475569",
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 80 },
          })
        );

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ch.scriptText,
              }),
            ],
            spacing: { after: 200 },
          })
        );

        if (ch.summaryBullets && ch.summaryBullets.length > 0) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Ý chính điểm tin:",
                  bold: true,
                  size: 24,
                  color: "475569",
                }),
              ],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 100, after: 80 },
            })
          );

          ch.summaryBullets.forEach(bullet => {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: bullet,
                  }),
                ],
                bullet: { level: 0 },
                spacing: { after: 80 },
              })
            );
          });
        }
      });

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Lời Kết & Giao Thông",
              bold: true,
              size: 32,
              color: "1e3a8a",
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: item.payload.conclusion,
            }),
          ],
          spacing: { after: 200 },
        })
      );

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      triggerFileDownload(blob, `${sanitizedTitle}.docx`);
      return { success: true };
    }
    
    // 5. Định dạng Kịch Bản Đọc (Script)
    if (format === "script") {
      let script = `[NARRATION SCRIPT FOR: ${title}]\n\n`;
      script += `[HOST A (INTRO)]\n${item.payload.introduction}\n\n`;
      
      item.payload.chapters.forEach((ch, idx) => {
        script += `[HOST A / B (CHAPTER ${idx + 1}: ${ch.topic})]\n`;
        script += `${ch.scriptText}\n\n`;
      });
      
      script += `[HOST A (CONCLUSION & OUTRO)]\n${item.payload.conclusion}\n`;
      
      const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
      triggerFileDownload(blob, `${sanitizedTitle}_script.txt`);
      return { success: true };
    }
    
    // 6. Định dạng Âm Thanh (MP3 / WAV)
    if (format === "audio") {
      if (typeof window !== "undefined") {
        const downloadUrl = getApiUrl(`/api/audio/download/${item.id}`);
        window.open(downloadUrl, "_blank");
      }
      return { success: true };
    }
    
    // 7. Định dạng ZIP Trọn Gói (.zip) sử dụng JSZip
    if (format === "zip") {
      const zip = new JSZip();
      
      zip.file("metadata.json", JSON.stringify(item, null, 2));
      
      let md = `# ${title}\n\n## Introduction\n${item.payload.introduction}\n\n`;
      item.payload.chapters.forEach((ch, idx) => {
        md += `## Chapter ${idx + 1}: ${ch.topic}\n${ch.scriptText}\n\n`;
      });
      md += `## Conclusion\n${item.payload.conclusion}\n`;
      zip.file("briefing.md", md);
      
      let script = `[INTRO]\n${item.payload.introduction}\n\n`;
      item.payload.chapters.forEach((ch, idx) => {
        script += `[CHAPTER ${idx + 1}]\n${ch.scriptText}\n\n`;
      });
      script += `[CONCLUSION]\n${item.payload.conclusion}\n`;
      zip.file("script.txt", script);
      
      const content = await zip.generateAsync({ type: "blob" });
      triggerFileDownload(content, `${sanitizedTitle}_bundle.zip`);
      return { success: true };
    }
    
    throw new LibraryError(
      "UNSUPPORTED_FORMAT",
      `The requested format ${format} is not supported.`
    );
  } catch (error: any) {
    console.error("[LibraryService] Error in exportMission:", error);
    return {
      success: false,
      error: error instanceof LibraryError 
        ? error 
        : new LibraryError("EXPORT_FAILED", error.message || "Failed to export the asset.", error)
    };
  }
}

export default {
  saveMission,
  duplicateMission,
  archiveMission,
  deleteMission,
  shareMission,
  exportMission,
  isSavedSummary
};
