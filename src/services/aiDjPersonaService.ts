/**
 * AI DJ Persona Service
 * Generates natural conversational transition hooks (segues) between topics
 * and injects personalized automotive commentary.
 */
export class AiDjPersonaService {
  private static instance: AiDjPersonaService;

  public static getInstance(): AiDjPersonaService {
    if (!AiDjPersonaService.instance) {
      AiDjPersonaService.instance = new AiDjPersonaService();
    }
    return AiDjPersonaService.instance;
  }

  /**
   * Generates dynamic interstitial transition text between chapters
   */
  public getInterstitialBridge(fromTopic?: string, toTopic?: string, language: "vi" | "en" = "vi"): string {
    const isVi = language === "vi";

    if (isVi) {
      const transitions = [
        `Chuyển sang diễn biến tiếp theo${toTopic ? ` về ${toTopic}` : ""}, mời bạn cùng lắng nghe.`,
        `Tiếp tục hành trình${toTopic ? ` với tiêu điểm ${toTopic}` : ""}.`,
        `Vừa rồi là các thông tin đáng chú ý${fromTopic ? ` về ${fromTopic}` : ""}. Bây giờ chúng ta cùng đến với phần tin tiếp theo.`,
        `Cùng MC Minh và An điểm tiếp các tin tức nổi bật ngay sau đây.`
      ];
      return transitions[Math.floor(Math.random() * transitions.length)];
    } else {
      const transitions = [
        `Moving on to our next headline${toTopic ? ` on ${toTopic}` : ""}, let's tune in.`,
        `Next up in your commute briefing${toTopic ? `: ${toTopic}` : ""}.`,
        `That wraps up our focus${fromTopic ? ` on ${fromTopic}` : ""}. Here's what else is developing right now.`,
        `Stay tuned as we dive into the next segment of your customized playlist.`
      ];
      return transitions[Math.floor(Math.random() * transitions.length)];
    }
  }

  /**
   * Generates driving companion safety nudge
   */
  public getDrivingSafetyNudge(language: "vi" | "en" = "vi"): string {
    return language === "vi"
      ? "Hãy giữ khoảng cách an toàn và tập trung quan sát khi điều khiển xe."
      : "Remember to maintain safe distance and stay attentive on the road.";
  }
}

export const aiDjPersonaService = AiDjPersonaService.getInstance();
