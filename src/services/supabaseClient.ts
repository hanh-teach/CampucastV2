import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cloudSyncStatus } from "./cloudSyncStatus";
import { logger } from "../utils/logger";
import { getApiUrl } from "../utils/apiUtils";

let clientInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;
let isMisconfigured = false; // Thêm flag để tránh retry
let lastAttemptTime = 0;
const RETRY_DELAY = 5 * 60 * 1000; // 5 phút

export async function getSupabaseClientAsync(forceRetry = false): Promise<SupabaseClient | null> {
  // Nếu đã xác định là sai cấu hình và không forced, trả về null ngay
  if (isMisconfigured && !forceRetry) {
    return null;
  }

  // Nếu đã có instance, trả về luôn
  if (clientInstance) return clientInstance;

  // Nếu đã có promise đang chạy và không forced, trả về promise đó
  if (initPromise && !forceRetry) return initPromise;

  // Nếu lần thử gần đây cách hiện tại chưa đủ lâu thì không retry (tránh spam)
  if (!forceRetry && Date.now() - lastAttemptTime < RETRY_DELAY) {
    return null;
  }

  cloudSyncStatus.setState("INITIALIZING");
  lastAttemptTime = Date.now();

  initPromise = (async () => {
    try {
      // Kiểm tra offline
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        cloudSyncStatus.setState("OFFLINE");
        initPromise = null;
        return null;
      }

      // Lấy config từ server với cơ chế retry phòng thủ khi backend đang boot
      let res: Response | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      let delay = 1000;

      while (attempts < maxAttempts) {
        try {
          res = await fetch(getApiUrl("/api/db-config"));
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
          }
          break;
        } catch (fetchErr: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw fetchErr;
          }
          logger.warn(`[Supabase Client] Config fetch failed (attempt ${attempts}/${maxAttempts}), retrying in ${delay}ms...`, fetchErr);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }

      if (!res) {
        throw new Error("Failed to fetch configuration after retries.");
      }
      
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      
      // Kiểm tra xem có phải HTML không (AI Studio redirect hoặc fallback SPA)
      const isHtml = 
        contentType.includes("text/html") || 
        text.toLowerCase().includes("<!doctype") || 
        text.toLowerCase().includes("<html") || 
        text.includes("302 Found") || 
        text.includes("__cookie_check.html");

      if (isHtml) {
        logger.warn("[Supabase Client] Received HTML instead of JSON. Fallback to LOCAL_ONLY. (Likely AI Studio auth redirection or SPA fallback)");
        cloudSyncStatus.setState("LOCAL_ONLY");
        initPromise = null;
        return null;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Failed to parse Supabase config as JSON. Start of text: " + text.substring(0, 100));
      }

      if (!data.configured) {
        logger.info("[Supabase Client] Supabase is not configured on the backend. Mode: LOCAL_ONLY.");
        cloudSyncStatus.setState("LOCAL_ONLY"); // Chuyển sang LOCAL_ONLY thay vì MISCONFIGURED để người dùng không thấy lỗi nếu chưa setup
        isMisconfigured = false; // Đặt false để có thể retry sau này nếu user setup
        initPromise = null;
        return null;
      }

      const { url, anonKey } = data;

      // Health check
      try {
        const pingRes = await fetch(`${url}/auth/v1/health`, {
          headers: { apikey: anonKey },
          signal: AbortSignal.timeout(4000)
        });

        if (!pingRes.ok) {
          const bodyText = await pingRes.text().catch(() => "");
          const isSuspended = 
            bodyText.toLowerCase().includes("suspended") || 
            bodyText.toLowerCase().includes("paused") || 
            pingRes.status === 503;

          if (isSuspended) {
            logger.error("[Supabase Client] Supabase project has been suspended or paused by provider. Setting MISCONFIGURED.");
            if (typeof window !== "undefined") {
              (window as any).supabaseSuspended = true;
            }
            cloudSyncStatus.setState("MISCONFIGURED");
            isMisconfigured = true;
            initPromise = null;
            return null;
          }

          if (pingRes.status === 401 || pingRes.status === 403) {
            logger.error("[Supabase Client] Supabase key rejected by server (401/403 Unauthorized). Setting MISCONFIGURED.");
            cloudSyncStatus.setState("MISCONFIGURED");
            isMisconfigured = true;
            initPromise = null;
            return null;
          }

          logger.warn(`[Supabase Client] Connection health check returned unhealthy status: ${pingRes.status}. Setting to OFFLINE.`);
          cloudSyncStatus.setState("OFFLINE");
          initPromise = null;
          return null;
        }

        // Thành công
        clientInstance = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
          },
        });

        logger.info("[Supabase Client] Client initialized and health check verified successfully.");
        cloudSyncStatus.setState("CONNECTED");
        isMisconfigured = false;
        return clientInstance;
      } catch (pingErr: any) {
        logger.warn("[Supabase Client] Connection health check failed (host unreachable or timeout). Setting to OFFLINE.", pingErr);
        cloudSyncStatus.setState("OFFLINE");
        initPromise = null;
        // Không đánh dấu misconfigured vì có thể mạng tạm thời, nhưng sẽ retry sau RETRY_DELAY
        return null;
      }
    } catch (err: any) {
      logger.error("[Supabase Client] Failed to initialize Supabase client:", err);
      cloudSyncStatus.setState("LOCAL_ONLY");
      // isMisconfigured = true; // Không mark misconfigured cho network errors
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

export function getLoadedSupabaseClient(): SupabaseClient | null {
  return clientInstance;
}