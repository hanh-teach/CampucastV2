import { getApiUrl } from "./apiUtils";
import { logger } from "./logger";

interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

export class ApiClient {
  static async fetch(endpoint: string, options: ApiClientOptions = {}): Promise<Response> {
    const { timeoutMs = 8000, retries = 1, ...fetchOptions } = options;
    const url = getApiUrl(endpoint);
    
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        attempt++;
        logger.warn(`[ApiClient] Request to ${endpoint} failed (Attempt ${attempt}/${retries + 1}):`, error);
        if (attempt > retries) {
          throw error;
        }
        // Exponential backoff could be added here
        await new Promise(res => setTimeout(res, 1000 * attempt));
      }
    }
    throw new Error("ApiClient fetch failed.");
  }
  
  static async get(endpoint: string, options?: ApiClientOptions) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }
  
  static async post(endpoint: string, body: any, options?: ApiClientOptions) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body)
    });
  }
}
