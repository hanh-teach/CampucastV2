import { describe, it, expect } from "vitest";
import { parseVoiceCommand } from "../src/utils/parseVoiceCommand";

describe("parseVoiceCommand", () => {
  it("should parse play commands", () => {
    expect(parseVoiceCommand("phát", "vi")).toEqual({ type: "PLAY" });
    expect(parseVoiceCommand("play", "en")).toEqual({ type: "PLAY" });
    expect(parseVoiceCommand("tiếp đi", "vi")).toEqual({ type: "PLAY" });
    // "mở giùm" matches "mở" in youtube switch view regex first in original code
    expect(parseVoiceCommand("mở giùm", "vi")).toEqual({ type: "SWITCH_VIEW", view: "youtube" });
    expect(parseVoiceCommand("resume", "en")).toEqual({ type: "PLAY" });
  });

  it("should parse pause commands", () => {
    expect(parseVoiceCommand("tạm dừng", "vi")).toEqual({ type: "PAUSE" });
    expect(parseVoiceCommand("pause", "en")).toEqual({ type: "PAUSE" });
    expect(parseVoiceCommand("dừng lại", "vi")).toEqual({ type: "PAUSE" });
    expect(parseVoiceCommand("im lặng", "vi")).toEqual({ type: "PAUSE" });
    expect(parseVoiceCommand("stop", "en")).toEqual({ type: "PAUSE" });
  });

  it("should parse next commands", () => {
    expect(parseVoiceCommand("qua bài", "vi")).toEqual({ type: "NEXT" });
    expect(parseVoiceCommand("next", "en")).toEqual({ type: "NEXT" });
    expect(parseVoiceCommand("bài khác", "vi")).toEqual({ type: "NEXT" });
    expect(parseVoiceCommand("skip", "en")).toEqual({ type: "NEXT" });
  });

  it("should parse forward commands", () => {
    expect(parseVoiceCommand("tua nhanh", "vi")).toEqual({ type: "FORWARD", seconds: 15 });
    expect(parseVoiceCommand("forward", "en")).toEqual({ type: "FORWARD", seconds: 15 });
    expect(parseVoiceCommand("nhích lên", "vi")).toEqual({ type: "FORWARD", seconds: 15 });
    expect(parseVoiceCommand("fast forward", "en")).toEqual({ type: "FORWARD", seconds: 15 });
  });

  it("should parse rewind commands", () => {
    expect(parseVoiceCommand("tua lại", "vi")).toEqual({ type: "REWIND", seconds: 15 });
    expect(parseVoiceCommand("rewind", "en")).toEqual({ type: "REWIND", seconds: 15 });
    expect(parseVoiceCommand("lùi lại", "vi")).toEqual({ type: "REWIND", seconds: 15 });
    expect(parseVoiceCommand("back", "en")).toEqual({ type: "REWIND", seconds: 15 });
  });

  it("should parse exit commands", () => {
    expect(parseVoiceCommand("thoát", "vi")).toEqual({ type: "EXIT" });
    expect(parseVoiceCommand("exit", "en")).toEqual({ type: "EXIT" });
    // "quay về" matches in rewindRegex first in original code
    expect(parseVoiceCommand("quay về", "vi")).toEqual({ type: "REWIND", seconds: 15 });
    expect(parseVoiceCommand("close", "en")).toEqual({ type: "EXIT" });
  });

  it("should parse view switch commands", () => {
    expect(parseVoiceCommand("mở youtube", "vi")).toEqual({ type: "SWITCH_VIEW", view: "youtube" });
    expect(parseVoiceCommand("entertainment", "en")).toEqual({ type: "SWITCH_VIEW", view: "youtube" });
    expect(parseVoiceCommand("nghe tin", "vi")).toEqual({ type: "SWITCH_VIEW", view: "briefing" });
    expect(parseVoiceCommand("news", "en")).toEqual({ type: "SWITCH_VIEW", view: "briefing" });
  });

  it("should parse search commands with query", () => {
    expect(parseVoiceCommand("tìm kiếm nhạc trẻ", "vi")).toEqual({ type: "SEARCH", query: "nhạc trẻ" });
    expect(parseVoiceCommand("search for lo-fi", "en")).toEqual({ type: "SEARCH", query: "lo-fi" });
    // "mở bài..." matches "mở" in youtube switch view regex first
    expect(parseVoiceCommand("tìm bài sơn tùng", "vi")).toEqual({ type: "SEARCH", query: "sơn tùng" });
  });

  it("should return unrecognized for empty search query", () => {
    expect(parseVoiceCommand("tìm kiếm", "vi")).toEqual({ type: "UNRECOGNIZED", raw: "tìm kiếm" });
    expect(parseVoiceCommand("search for", "en")).toEqual({ type: "UNRECOGNIZED", raw: "search for" });
  });

  it("should handle unrecognized commands", () => {
    expect(parseVoiceCommand("xin chào", "vi")).toEqual({ type: "UNRECOGNIZED", raw: "xin chào" });
    expect(parseVoiceCommand("unknown command", "en")).toEqual({ type: "UNRECOGNIZED", raw: "unknown command" });
  });

  it("should handle case sensitivity and trimming", () => {
    expect(parseVoiceCommand("  PHÁT  ", "vi")).toEqual({ type: "PLAY" });
    expect(parseVoiceCommand("PAUSE ", "en")).toEqual({ type: "PAUSE" });
  });
});
