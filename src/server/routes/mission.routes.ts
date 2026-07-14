/**
 * Mission Routes - V4 Architecture
 * API endpoints cho Mission CRUD operations
 * Tương thích với MissionIntelligenceWorkspace
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { 
  Mission, 
  MissionStatus, 
  MissionFilter,
  CreateMissionDTO,
  UpdateMissionDTO,
  DEFAULT_MISSION
} from "../../types/v4/mission";
import { getSupabaseClient } from "../shared";
import { logger } from "../../utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const router = express.Router();

// ============================================================
// MIDDLEWARE
// ============================================================

async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Authentication failed" });
  }
}

// ============================================================
// HELPERS
// ============================================================

function buildQuery(supabase: any, filter?: MissionFilter, userId?: string) {
  let query = supabase
    .from("missions")
    .select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (filter?.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    query = query.in("status", statuses);
  }
  if (filter?.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    query = query.in("type", types);
  }
  if (filter?.priority) {
    const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
    query = query.in("priority", priorities);
  }
  if (filter?.language) {
    query = query.eq("language", filter.language);
  }
  if (filter?.topic) {
    query = query.ilike("topic", `%${filter.topic}%`);
  }
  if (filter?.fromDate) {
    query = query.gte("created_at", filter.fromDate);
  }
  if (filter?.toDate) {
    query = query.lte("created_at", filter.toDate);
  }
  if (filter?.tags?.length) {
    query = query.contains("tags", filter.tags);
  }

  // Sort
  if (filter?.sortBy) {
    const sortField = filter.sortBy === "createdAt" ? "created_at" :
                      filter.sortBy === "updatedAt" ? "updated_at" :
                      filter.sortBy;
    query = query.order(sortField, {
      ascending: filter.sortOrder === "asc",
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Paginate
  if (filter?.limit !== undefined) {
    query = query.range(
      filter.offset || 0,
      (filter.offset || 0) + filter.limit - 1
    );
  }

  return query;
}

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/missions
 * Lấy danh sách missions với filter
 */
router.get("/", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const filter: MissionFilter = {
      status: req.query.status as any,
      type: req.query.type as any,
      priority: req.query.priority as any,
      language: req.query.language as any,
      topic: req.query.topic as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const query = buildQuery(supabase, filter, req.user.id);
    const { data, error } = await query;

    if (error) {
      logger.error("[Mission API] Failed to get missions:", error);
      return res.status(500).json({ error: error.message });
    }

    // Transform to match frontend types
    const missions = (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      status: m.status,
      priority: m.priority,
      language: m.language,
      topic: m.topic,
      config: m.config,
      steps: m.steps || [],
      result: m.result,
      confidence: m.confidence || 0,
      totalSteps: m.total_steps || 0,
      completedSteps: m.completed_steps || 0,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      startedAt: m.started_at,
      completedAt: m.completed_at,
      userId: m.user_id,
      tags: m.tags || [],
      metadata: m.metadata,
    }));

    // Also get count
    const countQuery = buildQuery(supabase, { ...filter, limit: undefined, offset: undefined }, req.user.id);
    const { count, error: countError } = await countQuery.select("*", { count: "exact", head: true });

    return res.json({
      data: missions,
      total: count || 0,
      limit: filter.limit || 50,
      offset: filter.offset || 0,
    });
  } catch (err: any) {
    logger.error("[Mission API] GET /missions error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * GET /api/missions/:id
 * Lấy mission chi tiết theo ID
 */
router.get("/:id", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) {
      logger.error(`[Mission API] Failed to get mission ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Mission not found" });
    }

    // Transform to match frontend types
    const mission = {
      id: data.id,
      name: data.name,
      type: data.type,
      status: data.status,
      priority: data.priority,
      language: data.language,
      topic: data.topic,
      config: data.config,
      steps: data.steps || [],
      result: data.result,
      confidence: data.confidence || 0,
      totalSteps: data.total_steps || 0,
      completedSteps: data.completed_steps || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      userId: data.user_id,
      tags: data.tags || [],
      metadata: data.metadata,
    };

    return res.json(mission);
  } catch (err: any) {
    logger.error(`[Mission API] GET /missions/${req.params.id} error:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * POST /api/missions
 * Tạo mission mới
 */
router.post("/", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const dto: CreateMissionDTO = req.body;

    if (!dto.name || !dto.type) {
      return res.status(400).json({ error: "name and type are required" });
    }

    const now = new Date().toISOString();
    const mission: any = {
      id: uuidv4(),
      user_id: req.user.id,
      name: dto.name,
      type: dto.type,
      status: "idle",
      priority: dto.priority || "medium",
      language: dto.language || "vi",
      topic: dto.topic || null,
      config: {
        name: dto.name,
        type: dto.type,
        priority: dto.priority || "medium",
        language: dto.language || "vi",
        topic: dto.topic || null,
        feedIds: dto.feedIds || [],
        articleIds: dto.articleIds || [],
        options: dto.options || {
          voice: "vi-HN",
          tone: "conversational",
          emotion: "cheerful",
          publishPodcast: false,
          aiMode: "balanced",
        },
      },
      steps: [],
      result: null,
      confidence: 0,
      total_steps: 0,
      completed_steps: 0,
      created_at: now,
      updated_at: now,
      started_at: null,
      completed_at: null,
      tags: [],
      metadata: {},
    };

    const { data, error } = await supabase
      .from("missions")
      .insert(mission)
      .select()
      .single();

    if (error) {
      logger.error("[Mission API] Failed to create mission:", error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`[Mission API] Created mission ${data.id} for user ${req.user.id}`);
    return res.status(201).json(data);
  } catch (err: any) {
    logger.error("[Mission API] POST /missions error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * PUT /api/missions/:id
 * Cập nhật mission
 */
router.put("/:id", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { id } = req.params;
    const dto: UpdateMissionDTO = req.body;

    // Get existing mission
    const { data: existing, error: getError } = await supabase
      .from("missions")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (getError || !existing) {
      return res.status(404).json({ error: "Mission not found" });
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.metadata !== undefined) updates.metadata = dto.metadata;
    
    if (dto.config !== undefined) {
      updates.config = { ...existing.config, ...dto.config };
    }
    if (dto.steps !== undefined) {
      updates.steps = dto.steps;
      updates.total_steps = dto.steps.length;
      updates.completed_steps = dto.steps.filter(s => 
        s.status === "success" || s.status === "skipped"
      ).length;
    }
    if (dto.result !== undefined) {
      updates.result = dto.result;
    }
    if (dto.confidence !== undefined) {
      updates.confidence = dto.confidence;
    }

    // Auto-update timestamps based on status
    if (updates.status === "running" && !existing.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (updates.status === "completed" && !existing.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("missions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      logger.error(`[Mission API] Failed to update mission ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`[Mission API] Updated mission ${id} for user ${req.user.id}`);
    return res.json(data);
  } catch (err: any) {
    logger.error(`[Mission API] PUT /missions/${req.params.id} error:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * POST /api/missions/:id/step
 * Thêm step vào mission
 */
router.post("/:id/step", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { id } = req.params;
    const step = req.body;

    if (!step.event || !step.actor) {
      return res.status(400).json({ error: "event and actor are required" });
    }

    // Get existing mission
    const { data: existing, error: getError } = await supabase
      .from("missions")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (getError || !existing) {
      return res.status(404).json({ error: "Mission not found" });
    }

    const newStep = {
      id: uuidv4(),
      timestamp: step.timestamp || new Date().toISOString(),
      actor: step.actor,
      event: step.event,
      duration: step.duration || 0,
      status: step.status || "pending",
      retryCount: step.retryCount || 0,
      correlationId: step.correlationId || `${id}-${Date.now()}`,
      schemaVersion: step.schemaVersion || "1.0",
      error: step.error || null,
      metadata: step.metadata || {},
    };

    const steps = [...(existing.steps || []), newStep];
    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => 
      s.status === "success" || s.status === "skipped"
    ).length;
    const confidence = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Auto-update status
    let status = existing.status;
    if (step.status === "in_progress" && status === "idle") {
      status = "running";
    }
    if (steps.every(s => s.status === "success" || s.status === "skipped" || s.status === "failed")) {
      const hasFailure = steps.some(s => s.status === "failed");
      status = hasFailure ? "failed" : "completed";
    }

    const updates = {
      steps,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      confidence,
      status,
      updated_at: new Date().toISOString(),
      ...(status === "running" && !existing.started_at ? { started_at: new Date().toISOString() } : {}),
      ...(status === "completed" && !existing.completed_at ? { completed_at: new Date().toISOString() } : {}),
    };

    const { data, error } = await supabase
      .from("missions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      logger.error(`[Mission API] Failed to add step to mission ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`[Mission API] Added step to mission ${id} for user ${req.user.id}`);
    return res.json(data);
  } catch (err: any) {
    logger.error(`[Mission API] POST /missions/${req.params.id}/step error:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * DELETE /api/missions/:id
 * Xóa mission
 */
router.delete("/:id", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) {
      logger.error(`[Mission API] Failed to delete mission ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`[Mission API] Deleted mission ${id} for user ${req.user.id}`);
    return res.json({ success: true });
  } catch (err: any) {
    logger.error(`[Mission API] DELETE /missions/${req.params.id} error:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * POST /api/missions/:id/abort
 * Hủy bỏ mission
 */
router.post("/:id/abort", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from("missions")
      .update({
        status: "aborted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      logger.error(`[Mission API] Failed to abort mission ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Mission not found" });
    }

    logger.info(`[Mission API] Aborted mission ${id} for user ${req.user.id}`);
    return res.json(data);
  } catch (err: any) {
    logger.error(`[Mission API] POST /missions/${req.params.id}/abort error:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * GET /api/missions/stats
 * Thống kê missions
 */
router.get("/stats", authMiddleware, async (req, res): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { data, error } = await supabase
      .from("missions")
      .select("status, type, priority, confidence")
      .eq("user_id", req.user.id);

    if (error) {
      logger.error("[Mission API] Failed to get mission stats:", error);
      return res.status(500).json({ error: error.message });
    }

    const stats = {
      total: data.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      avgConfidence: 0,
      completed: 0,
      running: 0,
      failed: 0,
    };

    let totalConfidence = 0;
    for (const m of data) {
      stats.byStatus[m.status] = (stats.byStatus[m.status] || 0) + 1;
      stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
      stats.byPriority[m.priority] = (stats.byPriority[m.priority] || 0) + 1;
      totalConfidence += m.confidence || 0;

      if (m.status === "completed") stats.completed++;
      if (m.status === "running" || m.status === "initializing") stats.running++;
      if (m.status === "failed") stats.failed++;
    }

    stats.avgConfidence = data.length > 0 ? Math.round(totalConfidence / data.length) : 0;

    return res.json(stats);
  } catch (err: any) {
    logger.error("[Mission API] GET /missions/stats error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;