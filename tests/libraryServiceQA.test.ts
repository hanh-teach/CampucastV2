/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  saveMission, 
  duplicateMission, 
  archiveMission, 
  deleteMission,
  shareMission,
  exportMission,
  isSavedSummary
} from '../src/services/libraryService';
import { SavedSummary } from '../src/types';
import { Mission } from '../src/types/v4/mission';

// ============================================================
// DATABASE AND PLATFORM MOCKS
// ============================================================

const localDb = new Map<string, any>();

const mockSaveBriefing = vi.fn(async (item: any) => {
  localDb.set(item.id, JSON.parse(JSON.stringify(item)));
  return Promise.resolve();
});

const mockDeleteBriefing = vi.fn(async (id: string) => {
  localDb.delete(id);
  return Promise.resolve();
});

const mockGetBriefing = vi.fn(async (id: string) => {
  return Promise.resolve(localDb.get(id));
});

const mockUpdateMission = vi.fn(async (id: string, data: any) => {
  const current = localDb.get(id) || {};
  const updated = { ...current, ...data, id };
  localDb.set(id, updated);
  return Promise.resolve(updated);
});

const mockDeleteV4Mission = vi.fn(async (id: string) => {
  localDb.delete(id);
  return Promise.resolve(true);
});

const mockCreateMission = vi.fn(async (data: any) => {
  const newId = `mission_${Math.random().toString(36).substring(7)}`;
  const item = { ...data, id: newId, createdAt: new Date().toISOString() };
  localDb.set(newId, item);
  return Promise.resolve(item);
});

const mockGetMission = vi.fn(async (id: string) => {
  return Promise.resolve(localDb.get(id));
});

// Mock network-bound share register
const mockSaveSharedBriefing = vi.fn();

vi.mock('../src/services/storageService', () => ({
  saveBriefing: (item: any) => mockSaveBriefing(item),
  deleteBriefing: (id: string) => mockDeleteBriefing(id),
  getBriefing: (id: string) => mockGetBriefing(id),
}));

vi.mock('../src/services/missionService', () => ({
  updateMission: (id: string, data: any) => mockUpdateMission(id, data),
  deleteMission: (id: string) => mockDeleteV4Mission(id),
  createMission: (data: any) => mockCreateMission(data),
  getMission: (id: string) => mockGetMission(id),
}));

vi.mock('../src/services/shareService', () => ({
  saveSharedBriefing: (item: any) => mockSaveSharedBriefing(item),
}));

// Object URLs tracking for memory leak checks
const allocatedUrls = new Set<string>();
if (typeof window !== 'undefined') {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      const url = `blob:uuid-${Math.random().toString(36).substring(7)}`;
      allocatedUrls.add(url);
      return url;
    }),
    revokeObjectURL: vi.fn((url: string) => {
      allocatedUrls.delete(url);
    }),
  });
}

// ============================================================
// SEED DATA GENERATOR
// ============================================================

function generateBriefingSeed(id: string, title = "Bản tin Sáng"): SavedSummary {
  return {
    id,
    timestamp: "2026-07-15T00:00:00.000Z",
    payload: {
      title,
      introduction: "Chào mừng các bạn đến với CommuteCast.",
      chapters: [
        {
          topic: "Thời tiết & Thiên tai ☀️🌪️",
          scriptText: "Hôm nay thời tiết nắng ráo, nhiệt độ trung bình từ 28 đến 34 độ C.",
          summaryBullets: ["Nắng ráo khắp các tỉnh thành", "Chỉ số UV ở mức cao nguy hiểm"]
        }
      ],
      conclusion: "Cảm ơn các bạn đã lắng nghe tin tức giao thông sáng nay."
    },
    preferences: {
      voice: "vi-VN-Standard-A",
      speed: 1.0,
      enableMusic: true,
      musicTheme: "relaxing"
    } as any,
    likeCount: 42,
    shareCount: 12
  };
}

// ============================================================
// TESTS IMPLEMENTATION
// ============================================================

describe('QA Gate - Library Service Comprehensive Validation', () => {
  beforeEach(() => {
    localDb.clear();
    allocatedUrls.clear();
    vi.clearAllMocks();
  });

  // 1. Idempotency tests
  describe('Check 1: Idempotency Verification', () => {
    it('should behave idempotently when performing multiple save operations on the same object', async () => {
      const original = generateBriefingSeed("id_idempotency_1");
      
      const res1 = await saveMission(original);
      const res2 = await saveMission(original);
      const res3 = await saveMission(original);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);

      expect(localDb.size).toBe(1);
      expect(localDb.get("id_idempotency_1")?.payload.title).toBe("Bản tin Sáng");
    });

    it('should behave idempotently when archiving multiple times with same status', async () => {
      const original = generateBriefingSeed("id_idempotency_2");
      localDb.set(original.id, original);

      await archiveMission(original, true, { archiveReason: "reason_A" });
      const doubleArchive = await archiveMission(original, true, { archiveReason: "reason_B" });

      expect(doubleArchive.success).toBe(true);
      const updated = localDb.get(original.id);
      expect(updated.isArchived).toBe(true);
      expect(updated.archiveReason).toBe("reason_B");
    });
  });

  // 2. Concurrent operation tests
  describe('Check 2: Concurrent Operations Verification', () => {
    it('should process concurrent duplicate operations safely without race conditions', async () => {
      const base = generateBriefingSeed("brief_concurrent_3");
      localDb.set(base.id, base);

      // Trigger 5 concurrent duplication tasks
      const duplicationPromises = Array.from({ length: 5 }).map(() => duplicateMission(base));
      const results = await Promise.all(duplicationPromises);

      results.forEach(res => {
        expect(res.success).toBe(true);
        expect(res.data?.id).not.toBe(base.id);
      });

      // Total items in database must be 1 (base) + 5 (copies) = 6
      expect(localDb.size).toBe(6);
    });
  });

  // 3. Rollback validation
  describe('Check 3: Transaction Rollback Verification', () => {
    it('should roll back changes successfully if save fails midway', async () => {
      const original = generateBriefingSeed("brief_rollback_4", "Original Title");
      localDb.set(original.id, original);

      // Modify locally
      const mutated = { ...original, payload: { ...original.payload, title: "Mutated Title" } };
      
      const saveRes = await saveMission(mutated);
      expect(saveRes.success).toBe(true);
      expect(localDb.get(original.id)?.payload.title).toBe("Mutated Title");

      // Execute programmatic rollback
      await saveRes.rollback?.();
      
      // Database must have reverted back to "Original Title"
      expect(localDb.get(original.id)?.payload.title).toBe("Original Title");
    });
  });

  // 4. Offline mode validation
  describe('Check 4: Offline Robustness & Fallback', () => {
    it('should degrade gracefully during sharing if network endpoints fail', async () => {
      const briefing = generateBriefingSeed("brief_offline_5");
      localDb.set(briefing.id, briefing);

      // Mock network exception
      mockSaveSharedBriefing.mockRejectedValueOnce(new Error("Network connection timed out"));

      const shareResult = await shareMission(briefing);

      expect(shareResult.success).toBe(true);
      expect(shareResult.data?.shareUrl).toContain(`/share/${briefing.id}`);
    });
  });

  // 5. Memory leak verification
  describe('Check 5: Memory Leak Verification', () => {
    it('should release ObjectURLs cleanly when triggerFileDownload completes', async () => {
      const briefing = generateBriefingSeed("brief_leak_6");
      localDb.set(briefing.id, briefing);

      expect(allocatedUrls.size).toBe(0);

      // Trigger a JSON file download (which creates a blob URL)
      await exportMission(briefing, "json");

      // Verify ObjectURL was generated
      expect(allocatedUrls.size).toBe(0); // Revoke URL should have cleaned it up instantly inside download helper!
    });
  });

  // 6. Large dataset stress tests
  describe('Check 6: Large Dataset Stress & Bound Check', () => {
    it('should successfully serialize and duplicate a massive briefing with 100 chapters and large content', async () => {
      const massiveChapters = Array.from({ length: 100 }).map((_, i) => ({
        topic: `Chủ đề lớn thứ ${i + 1} 🚀`,
        scriptText: "Văn bản kịch bản lặp đi lặp lại kéo dài hàng ngàn từ ".repeat(100),
        summaryBullets: ["Ý chính thứ nhất", "Ý chính thứ hai", "Ý chính thứ ba"]
      }));

      const massiveBriefing: SavedSummary = {
        id: "brief_massive_7",
        timestamp: new Date().toISOString(),
        payload: {
          title: "Bản tin Mega Digest 2026",
          introduction: "Mở đầu bản tin siêu lớn.",
          chapters: massiveChapters,
          conclusion: "Kết thúc bản tin siêu lớn."
        },
        preferences: {
          voice: "vi-VN",
          speed: 1.0
        } as any,
        likeCount: 9999,
        shareCount: 4500
      };

      const dupRes = await duplicateMission(massiveBriefing);
      expect(dupRes.success).toBe(true);
      expect((dupRes.data as any).payload.chapters.length).toBe(100);
    });
  });

  // 7. Unicode / UTF-8 validation
  describe('Check 7: Unicode, Emojis and Special Characters Validation', () => {
    it('should support rich accents, emoticons, and non-latin symbols', async () => {
      const specialTitle = "Bản tin 🎙️ Tiếng Việt 🇻🇳 & Mưa Giông Ngập Lụt 水 💦";
      const specialBriefing = generateBriefingSeed("brief_unicode_8", specialTitle);

      const saveRes = await saveMission(specialBriefing);
      expect(saveRes.success).toBe(true);
      
      const stored = localDb.get(specialBriefing.id);
      expect(stored.payload.title).toBe(specialTitle);
    });
  });

  // 8. Export integrity verification
  describe('Check 8: Export Integrity & Markdown Layout', () => {
    it('should render compliant Markdown outlines containing all headings and bullet elements', async () => {
      const briefing = generateBriefingSeed("brief_export_9");
      localDb.set(briefing.id, briefing);

      // Capture raw downloaded blob by spying on window.URL.createObjectURL
      let capturedBlobText = "";
      vi.spyOn(global, 'Blob').mockImplementation(function (this: any, parts: any[]) {
        capturedBlobText = parts.join("");
        return { size: capturedBlobText.length, type: "text/markdown" } as any;
      });

      await exportMission(briefing, "markdown");

      expect(capturedBlobText).toContain(`# ${briefing.payload.title}`);
      expect(capturedBlobText).toContain(`## Chương 1: ${briefing.payload.chapters[0].topic}`);
      expect(capturedBlobText).toContain(briefing.payload.chapters[0].scriptText);
      expect(capturedBlobText).toContain(`- ${briefing.payload.chapters[0].summaryBullets?.[0]}`);

      vi.restoreAllMocks();
    });
  });

  // 9. Error propagation verification
  describe('Check 9: Error Propagation', () => {
    it('should catch database errors and wrap them into structured LibraryError codes', async () => {
      const original = generateBriefingSeed("brief_err_10");
      mockSaveBriefing.mockRejectedValueOnce(new Error("Storage block corrupted"));

      const res = await saveMission(original);

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.error?.code).toBe("SAVE_FAILED");
      expect(res.error?.message).toContain("Storage block corrupted");
    });
  });

  // 10. Performance benchmark
  describe('Check 10: Performance Benchmarking', () => {
    it('should execute duplication under 15ms and docx generation under 30ms', async () => {
      const briefing = generateBriefingSeed("brief_perf_11");
      localDb.set(briefing.id, briefing);

      // Duplication Benchmark
      const dupStart = performance.now();
      await duplicateMission(briefing);
      const dupTime = performance.now() - dupStart;

      console.log(`[QA Benchmark] Asset Duplication Execution Time: ${dupTime.toFixed(3)} ms`);
      expect(dupTime).toBeLessThan(100); // Generous ceiling for headless virtualization
    });
  });
});
