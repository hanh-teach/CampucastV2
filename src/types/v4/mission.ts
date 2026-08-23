/**
 * Mission Types - V4 Architecture
 * Định nghĩa các kiểu dữ liệu cho hệ thống Mission/Studio Nhiệm vụ
 * Tương thích với MissionIntelligenceWorkspace và MissionCommandBar
 */

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

/**
 * Trạng thái của một Mission
 */
export type MissionStatus =
  | "idle"        // Chưa bắt đầu
  | "initializing" // Đang khởi tạo
  | "running"     // Đang chạy
  | "paused"      // Tạm dừng
  | "retrying"    // Đang thử lại sau lỗi
  | "completed"   // Hoàn thành
  | "failed"      // Thất bại
  | "aborted";    // Bị hủy bỏ

/**
 * Trạng thái của từng step trong Mission
 */
export type MissionStepStatus =
  | "pending"
  | "in_progress"
  | "success"
  | "failed"
  | "retrying"
  | "skipped";

/**
 * Actor thực hiện step
 */
export type MissionActor =
  | "Operator"
  | "RSS Connector"
  | "Gemini AI"
  | "Voice TTS"
  | "Storage"
  | "System"
  | "User";

/**
 * Loại Mission
 */
export type MissionType =
  | "briefing"      // Tạo bản tin
  | "podcast"       // Tạo podcast
  | "summary"       // Tóm tắt
  | "translate"     // Dịch thuật
  | "custom";       // Tùy chỉnh

/**
 * Mức độ ưu tiên
 */
export type MissionPriority = "low" | "medium" | "high" | "critical";

// ============================================================
// CORE INTERFACES
// ============================================================

/**
 * Một step/log entry trong Mission
 * Tương thích với StructuredEvent trong UI
 */
export interface MissionStep {
  /** ID duy nhất của step */
  id: string;

  /** Thời gian diễn ra (ISO string hoặc HH:MM:SS) */
  timestamp: string;

  /** Ai thực hiện step này */
  actor: MissionActor;

  /** Mô tả sự kiện */
  event: string;

  /** Thời gian thực hiện (ms) */
  duration: number;

  /** Trạng thái của step */
  status: MissionStepStatus;

  /** Số lần thử lại (nếu có) */
  retryCount: number;

  /** Correlation ID để theo dõi luồng */
  correlationId: string;

  /** Schema version */
  schemaVersion: string;

  /** Thông tin lỗi (nếu có) */
  error?: string;

  /** Metadata bổ sung */
  metadata?: Record<string, any>;
}

/**
 * Cấu hình cho một Mission
 */
export interface MissionConfig {
  /** Tên mission */
  name: string;

  /** Loại mission */
  type: MissionType;

  /** Mức độ ưu tiên */
  priority: MissionPriority;

  /** Ngôn ngữ chính */
  language: "vi" | "en" | "bilingual";

  /** Chủ đề (nếu có) */
  topic?: string;

  /** Danh sách RSS feed IDs (nếu có) */
  feedIds?: string[];

  /** Danh sách article IDs (nếu có) */
  articleIds?: string[];

  /** Tùy chọn bổ sung */
  options?: {
    /** Giọng đọc TTS */
    voice?: string;

    /** Tone giọng */
    tone?: "conversational" | "professional" | "fast" | "slow";

    /** Cảm xúc */
    emotion?: "cheerful" | "professional" | "calm" | "energetic";

    /** Độ dài tối đa (giây) */
    maxDuration?: number;

    /** Có xuất podcast không */
    publishPodcast?: boolean;

    /** Chế độ AI */
    aiMode?: "creative" | "balanced" | "precise";
  };
}

/**
 * Kết quả của Mission
 */
export interface MissionResult {
  /** Nội dung script (text) */
  script?: string;

  /** Đường dẫn audio (nếu có) */
  audioUrl?: string;

  /** Danh sách audio chunks (base64) */
  audioChunks?: string[];

  /** Thời lượng audio (giây) */
  duration?: number;

  /** Danh sách bài báo đã dùng */
  usedArticles?: {
    id: string;
    title: string;
    link: string;
  }[];

  /** Metadata bổ sung */
  metadata?: Record<string, any>;
}

/**
 * Mission hoàn chỉnh
 */
export interface Mission {
  /** ID duy nhất */
  id: string;

  /** Tên hiển thị */
  name: string;

  /** Loại mission */
  type: MissionType;

  /** Trạng thái hiện tại */
  status: MissionStatus;

  /** Mức độ ưu tiên */
  priority: MissionPriority;

  /** Ngôn ngữ */
  language: "vi" | "en" | "bilingual";

  /** Chủ đề (nếu có) */
  topic?: string;

  /** Cấu hình */
  config: MissionConfig;

  /** Danh sách các step/log */
  steps: MissionStep[];

  /** Kết quả (nếu hoàn thành) */
  result?: MissionResult;

  /** Thời gian tạo */
  createdAt: string;

  /** Thời gian bắt đầu */
  startedAt?: string;

  /** Thời gian hoàn thành */
  completedAt?: string;

  /** Thời gian cập nhật cuối */
  updatedAt: string;

  /** Độ tin cậy (0-100) */
  confidence: number;

  /** Tổng số step */
  totalSteps: number;

  /** Số step đã hoàn thành */
  completedSteps: number;

  /** ID người dùng (nếu có) */
  userId?: string;

  /** Tags để phân loại */
  tags?: string[];

  /** Metadata bổ sung */
  metadata?: Record<string, any>;
}

// ============================================================
// DTOs (Data Transfer Objects) - cho API
// ============================================================

/**
 * Tạo Mission mới
 */
export interface CreateMissionDTO {
  name: string;
  type: MissionType;
  priority?: MissionPriority;
  language?: "vi" | "en" | "bilingual";
  topic?: string;
  feedIds?: string[];
  articleIds?: string[];
  options?: MissionConfig["options"];
}

/**
 * Cập nhật Mission
 */
export interface UpdateMissionDTO {
  name?: string;
  status?: MissionStatus;
  priority?: MissionPriority;
  config?: Partial<MissionConfig>;
  steps?: MissionStep[];
  result?: MissionResult;
  confidence?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Lọc Mission
 */
export interface MissionFilter {
  status?: MissionStatus | MissionStatus[];
  type?: MissionType | MissionType[];
  priority?: MissionPriority | MissionPriority[];
  language?: "vi" | "en" | "bilingual";
  topic?: string;
  fromDate?: string;
  toDate?: string;
  userId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "confidence" | "name";
  sortOrder?: "asc" | "desc";
}

// ============================================================
// EVENT STREAMING
// ============================================================

/**
 * Event streaming từ Mission
 */
export interface MissionEvent {
  type: "step_added" | "step_updated" | "status_changed" | "mission_completed" | "mission_failed" | "sync_completed";
  missionId: string;
  timestamp: string;
  data: any;
}

/**
 * Callback cho Mission Event
 */
export type MissionEventCallback = (event: MissionEvent) => void;

// ============================================================
// MISSION SUMMARY (cho UI hiển thị nhanh)
// ============================================================

/**
 * Tóm tắt Mission (cho danh sách)
 */
export interface MissionSummary {
  id: string;
  name: string;
  type: MissionType;
  status: MissionStatus;
  priority: MissionPriority;
  confidence: number;
  totalSteps: number;
  completedSteps: number;
  createdAt: string;
  updatedAt: string;
  language: "vi" | "en" | "bilingual";
  topic?: string;
}

// ============================================================
// HELPER FUNCTIONS (type guards)
// ============================================================

export function isMissionRunning(status: MissionStatus): boolean {
  return status === "running" || status === "initializing" || status === "retrying";
}

export function isMissionFinished(status: MissionStatus): boolean {
  return status === "completed" || status === "failed" || status === "aborted";
}

export function isMissionStepSuccess(status: MissionStepStatus): boolean {
  return status === "success";
}

export function isMissionStepFailed(status: MissionStepStatus): boolean {
  return status === "failed";
}

export function isMissionStepInProgress(status: MissionStepStatus): boolean {
  return status === "in_progress" || status === "retrying";
}

// ============================================================
// DEFAULT VALUES
// ============================================================

export const DEFAULT_MISSION_CONFIG: Partial<MissionConfig> = {
  priority: "medium",
  language: "vi",
  options: {
    voice: "vi-HN",
    tone: "conversational",
    emotion: "cheerful",
    publishPodcast: false,
    aiMode: "balanced",
  },
};

export const DEFAULT_MISSION: Omit<Mission, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  type: "briefing",
  status: "idle",
  priority: "medium",
  language: "vi",
  config: DEFAULT_MISSION_CONFIG as MissionConfig,
  steps: [],
  confidence: 0,
  totalSteps: 0,
  completedSteps: 0,
};