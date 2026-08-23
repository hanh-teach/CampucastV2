import { AmbientContext, TimeOfDaySlot } from "../types";

/**
 * Calculates current ambient time slot and contextual environment data
 */
export function getAmbientContext(language: "vi" | "en" = "vi"): AmbientContext {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const decimalHour = hour + minute / 60;

  let timeSlot: TimeOfDaySlot = "morning_rush";
  let timeSlotLabelVi = "Giờ Cao Điểm Sáng";
  let timeSlotLabelEn = "Morning Rush";
  let greetingVi = "Chào buổi sáng! Chúc bạn một ngày làm việc tràn đầy năng lượng.";
  let greetingEn = "Good morning! Wishing you an energized and productive day ahead.";
  let recommendedSpeed = 1.05;
  let recommendedTone = "upbeat";

  if (decimalHour >= 5.0 && decimalHour < 9.5) {
    timeSlot = "morning_rush";
    timeSlotLabelVi = "Giờ Cao Điểm Sáng";
    timeSlotLabelEn = "Morning Rush";
    greetingVi = "Chào buổi sáng! Sau đây là bản tin tổng hợp đầu ngày và tình hình giao thông lộ trình của bạn.";
    greetingEn = "Good morning! Here is your daily morning briefing and route traffic updates.";
    recommendedSpeed = 1.05;
    recommendedTone = "upbeat";
  } else if (decimalHour >= 11.0 && decimalHour < 14.5) {
    timeSlot = "midday_brief";
    timeSlotLabelVi = "Điểm Tin Giữa Ngày";
    timeSlotLabelEn = "Mid-day Brief";
    greetingVi = "Chào buổi trưa! Cùng điểm qua các tin tức nổi bật và thị trường nửa đầu ngày.";
    greetingEn = "Good afternoon! Let's check in on midday headlines and financial market highlights.";
    recommendedSpeed = 1.0;
    recommendedTone = "informative";
  } else if (decimalHour >= 16.5 && decimalHour < 20.0) {
    timeSlot = "evening_commute";
    timeSlotLabelVi = "Tan Tầm Chiều";
    timeSlotLabelEn = "Evening Commute";
    greetingVi = "Chào buổi chiều tan tầm! Hãy thư giãn trên đường về với toàn cảnh sự kiện trong ngày.";
    greetingEn = "Good evening commute! Relax on your way home with today's full wrap-up.";
    recommendedSpeed = 1.0;
    recommendedTone = "conversational";
  } else {
    timeSlot = "night_digest";
    timeSlotLabelVi = "Bản Tin Đêm & Thư Giãn";
    timeSlotLabelEn = "Night Digest";
    greetingVi = "Chào buổi tối! Sau đây là bản tin điểm lại các tiêu điểm quan trọng nhất trước khi kết thúc ngày.";
    greetingEn = "Good evening! Here is a calm summary of the key highlights before wrapping up your day.";
    recommendedSpeed = 0.95;
    recommendedTone = "analytical";
  }

  return {
    timeSlot,
    timeSlotLabelVi,
    timeSlotLabelEn,
    greetingVi,
    greetingEn,
    recommendedSpeed,
    recommendedTone,
    weatherCondition: "neutral",
    weatherNoticeVi: "Thời tiết ổn định, thích hợp cho việc di chuyển.",
    weatherNoticeEn: "Stable weather conditions for your commute.",
    trafficIntensity: "moderate",
    trafficNoticeVi: "Mật độ giao thông vừa phải, các tuyến đường chính lưu thông ổn định.",
    trafficNoticeEn: "Moderate traffic density, major arterial routes moving smoothly."
  };
}

/**
 * Builds prompt guidance string based on ambient context
 */
export function buildAmbientPromptInstruction(context: AmbientContext, language: "vi" | "en" = "vi"): string {
  const isVi = language === "vi";
  return `
[AMBIENT CONTEXT - KHUNG GIỜ & NGỮ CẢNH HÀNH TRÌNH]
- Khung giờ hiện tại: ${isVi ? context.timeSlotLabelVi : context.timeSlotLabelEn} (${context.timeSlot})
- Lời chào khởi đầu gợi ý: "${isVi ? context.greetingVi : context.greetingEn}"
- Tình hình môi trường: ${isVi ? context.weatherNoticeVi : context.weatherNoticeEn}
- Cảnh báo giao thông: ${isVi ? context.trafficNoticeVi : context.trafficNoticeEn}
- Hãy mở đầu bản tin tự nhiên, chào hỏi tài xế theo đúng khung giờ và gợi ý lái xe an toàn trước khi vào phần điểm tin cốt lõi.
`.trim();
}
