/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  saveMission, 
  duplicateMission, 
  archiveMission, 
  deleteMission,
  isSavedSummary
} from '../src/services/libraryService';
import { SavedSummary } from '../src/types';
import { Mission } from '../src/types/v4/mission';

// ============================================================
// STUBS / MOCKS SETUP
// ============================================================

const mockSaveBriefing = vi.fn();
const mockDeleteBriefing = vi.fn();
const mockGetBriefing = vi.fn();

const mockUpdateMission = vi.fn();
const mockDeleteV4Mission = vi.fn();
const mockCreateMission = vi.fn();
const mockGetMission = vi.fn();

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

// Mock standard window URL download triggers
if (typeof window !== 'undefined') {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });
}

// ============================================================
// DATA SETS
// ============================================================

const sampleSavedSummary: SavedSummary = {
  id: "brief_test_123",
  timestamp: "2026-07-15T00:00:00.000Z",
  payload: {
    title: "Bản tin Sáng Thứ Tư",
    introduction: "Chào buổi sáng!",
    chapters: [
      {
        topic: "Công nghệ",
        scriptText: "Gemini 3.5 Flash được phát hành...",
        summaryBullets: ["Nhanh hơn", "Rẻ hơn"]
      }
    ],
    conclusion: "Chúc bạn một ngày làm việc vui vẻ."
  },
  preferences: {
    voice: "vi-HN",
    speed: 1.0,
    enableMusic: true,
    musicTheme: "acoustic"
  } as any,
  likeCount: 5,
  shareCount: 2,
  isArchived: false
} as any;

const sampleMission: Mission = {
  id: "mission_test_999",
  name: "Daily News Digest Pipeline",
  type: "briefing",
  status: "idle",
  priority: "high",
  language: "vi",
  topic: "Kinh tế",
  config: {
    name: "Daily News Digest Pipeline",
    type: "briefing",
    priority: "high",
    language: "vi",
    feedIds: ["feed_1"],
    articleIds: [],
    options: { maxDuration: 180 }
  },
  steps: [],
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
  confidence: 100,
  totalSteps: 0,
  completedSteps: 0
};

// ============================================================
// TEST SUITE
// ============================================================

describe('LibraryService Architecture Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSavedSummary Guard', () => {
    it('should correctly distinguish SavedSummary from other types', () => {
      expect(isSavedSummary(sampleSavedSummary)).toBe(true);
      expect(isSavedSummary(sampleMission)).toBe(false);
      expect(isSavedSummary(null)).toBe(false);
      expect(isSavedSummary({})).toBe(false);
    });
  });

  describe('saveMission() with Operation Envelope and Rollback', () => {
    it('should successfully save a SavedSummary and register rollback', async () => {
      mockGetBriefing.mockResolvedValue(sampleSavedSummary);
      mockSaveBriefing.mockResolvedValue(true);

      const result = await saveMission(sampleSavedSummary);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.rollback).toBeTypeOf('function');
      expect(mockSaveBriefing).toHaveBeenCalled();

      // Execute rollback
      await result.rollback?.();
      expect(mockSaveBriefing).toHaveBeenCalledTimes(2); // Second time for restore
    });

    it('should successfully save a Mission and register rollback', async () => {
      mockGetMission.mockResolvedValue(sampleMission);
      mockUpdateMission.mockResolvedValue({ ...sampleMission, name: "Updated Name" });

      const result = await saveMission(sampleMission);

      expect(result.success).toBe(true);
      expect((result.data as any)?.name).toBe("Updated Name");
      expect(result.rollback).toBeTypeOf('function');
      expect(mockUpdateMission).toHaveBeenCalled();

      // Execute rollback
      await result.rollback?.();
      expect(mockUpdateMission).toHaveBeenCalledTimes(2); // Second time for restore
    });

    it('should return error envelope upon database failures', async () => {
      mockSaveBriefing.mockRejectedValue(new Error("IndexedDB full"));
      
      const result = await saveMission(sampleSavedSummary);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("SAVE_FAILED");
    });
  });

  describe('duplicateMission() with Analytics & Metadata Purge', () => {
    it('should duplicate SavedSummary and reset all metadata/metrics', async () => {
      mockSaveBriefing.mockResolvedValue(true);

      const result = await duplicateMission(sampleSavedSummary);

      expect(result.success).toBe(true);
      const duplicated = result.data as any;
      expect(duplicated.id).not.toBe(sampleSavedSummary.id);
      expect(duplicated.payload.title).toContain("(Bản sao)");
      
      // Verification of pristine telemetry fields
      expect(duplicated.likeCount).toBe(0);
      expect(duplicated.shareCount).toBe(0);
      expect(duplicated.statistics).toBeUndefined();
      expect(duplicated.history).toBeUndefined();
      expect(duplicated.shareLink).toBeUndefined();
      expect(duplicated.downloadCount).toBeUndefined();
      expect(duplicated.lastPlayed).toBeUndefined();
      expect(duplicated.createdAt).toBeUndefined();
      expect(duplicated.isArchived).toBe(false);
    });

    it('should duplicate Mission using missionService helper', async () => {
      const mockCloned = { ...sampleMission, id: "mission_cloned_111", name: `${sampleMission.name} (Bản sao)` };
      mockCreateMission.mockResolvedValue(mockCloned);

      const result = await duplicateMission(sampleMission);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("mission_cloned_111");
      expect((result.data as any)?.name).toContain("(Bản sao)");
    });
  });

  describe('archiveMission() with Metadata Attachment', () => {
    it('should archive SavedSummary with operator and reasoning details', async () => {
      mockGetBriefing.mockResolvedValue(sampleSavedSummary);
      mockSaveBriefing.mockResolvedValue(true);

      const result = await archiveMission(sampleSavedSummary, true, {
        archivedBy: "editor_chief",
        archiveReason: "outdated_feed"
      });

      expect(result.success).toBe(true);
      const archived = result.data as any;
      expect(archived.isArchived).toBe(true);
      expect(archived.archivedAt).toBeDefined();
      expect(archived.archivedBy).toBe("editor_chief");
      expect(archived.archiveReason).toBe("outdated_feed");
    });

    it('should clear archive metadata when restoring', async () => {
      const archivedSummary = {
        ...sampleSavedSummary,
        isArchived: true,
        archivedAt: "some-time",
        archivedBy: "editor"
      };
      mockGetBriefing.mockResolvedValue(archivedSummary);
      mockSaveBriefing.mockResolvedValue(true);

      const result = await archiveMission(archivedSummary, false);

      expect(result.success).toBe(true);
      const restored = result.data as any;
      expect(restored.isArchived).toBe(false);
      expect(restored.archivedAt).toBeUndefined();
      expect(restored.archivedBy).toBeUndefined();
    });
  });

  describe('deleteMission() with Soft and Hard Deletion', () => {
    it('should soft delete SavedSummary (default mode)', async () => {
      mockGetBriefing.mockResolvedValue(sampleSavedSummary);
      mockSaveBriefing.mockResolvedValue(true);

      const result = await deleteMission(sampleSavedSummary.id);

      expect(result.success).toBe(true);
      expect(mockSaveBriefing).toHaveBeenCalled();
      const savedCallArg = mockSaveBriefing.mock.calls[0][0];
      expect(savedCallArg.isDeleted).toBe(true);
      expect(savedCallArg.deletedAt).toBeDefined();
    });

    it('should hard delete SavedSummary when softDelete is set to false', async () => {
      mockGetBriefing.mockResolvedValue(sampleSavedSummary);
      mockDeleteBriefing.mockResolvedValue(true);

      const result = await deleteMission(sampleSavedSummary.id, { softDelete: false });

      expect(result.success).toBe(true);
      expect(mockDeleteBriefing).toHaveBeenCalledWith(sampleSavedSummary.id);
    });
  });
});
