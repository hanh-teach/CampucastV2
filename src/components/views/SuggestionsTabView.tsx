import React, { useState } from "react";
import { Sparkles, Compass, Radio, ArrowRight, Zap, RefreshCw, Layers, ExternalLink, Lightbulb, Bookmark } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { colors } from "../../foundation/tokens/colors";
import { PageTemplate } from "../../foundation/PageTemplate";
import { AdaptiveGrid } from "../../foundation/AdaptiveGrid";
import TopicSuggestions from "../TopicSuggestions";

interface SuggestionsTabViewProps {
  uiLanguage: "vi" | "en";
  onSelectTopic: (topic: string) => void;
  isGenerating: boolean;
  onGenerateFromCurated?: (title: string, category: string, summary: string) => void;
}

export function SuggestionsTabView({
  uiLanguage,
  onSelectTopic,
  isGenerating,
  onGenerateFromCurated
}: SuggestionsTabViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const curatedTopics = [
    {
      id: "ai-trends",
      title: uiLanguage === "vi" ? "Đột phá Mô hình AI Đa phương thức 2026" : "Multimodal AI Model Breakthroughs 2026",
      category: "ai",
      categoryName: uiLanguage === "vi" ? "Trí Tuệ Nhân Tạo" : "AI & Data",
      description: uiLanguage === "vi" 
        ? "Tổng hợp bước nhảy vọt của Gemini 3.5 và thế hệ AI trợ lý thời gian thực tương tác qua giọng nói tự nhiên."
        : "Overview of Gemini 3.5 breakthroughs and real-time voice conversational assistants.",
      readTime: "3 min",
      tags: ["Gemini", "AI Agents", "Tech Trends"]
    },
    {
      id: "green-energy",
      title: uiLanguage === "vi" ? "Chuyển dịch Năng lượng Xanh & Xe điện Đô thị" : "Urban Clean Energy & EV Transition",
      category: "energy",
      categoryName: uiLanguage === "vi" ? "Năng Lượng & Môi Trường" : "Green Tech",
      description: uiLanguage === "vi"
        ? "Xu hướng hạ tầng sạc siêu nhanh và quy hoạch mạng lưới giao thông thông minh tại các siêu đô thị."
        : "Ultra-fast charging infrastructure trends and smart traffic grid planning in metropolitan areas.",
      readTime: "4 min",
      tags: ["Clean Energy", "Smart Cities", "EV"]
    },
    {
      id: "macro-economy",
      title: uiLanguage === "vi" ? "Toàn cảnh Kinh tế Vĩ mô & Thị trường Tài chính" : "Macroeconomic Outlook & Markets",
      category: "finance",
      categoryName: uiLanguage === "vi" ? "Tài Chính & Thị Trường" : "Finance & Markets",
      description: uiLanguage === "vi"
        ? "Phân tích biến động tỷ giá, lãi suất và xu hướng đầu tư công nghệ trước làn sóng tự động hóa."
        : "Analysis of currency movements, interest rates, and tech investment trends in the automation era.",
      readTime: "3 min",
      tags: ["Markets", "Interest Rates", "Fintech"]
    },
    {
      id: "productivity-deep-work",
      title: uiLanguage === "vi" ? "Kỹ năng Làm việc Sâu & Tối ưu Năng suất Thời đại AI" : "Deep Work & Productivity in the AI Era",
      category: "lifestyle",
      categoryName: uiLanguage === "vi" ? "Phong Cách Sống & Kỹ Năng" : "Productivity",
      description: uiLanguage === "vi"
        ? "Phương pháp quản trị thông tin đầu vào khi lái xe và thói quen nghe chủ động giúp nâng cao hiệu suất."
        : "Input management methods during commutes and active listening habits for high peak performance.",
      readTime: "2 min",
      tags: ["Deep Work", "Commute Habits", "Focus"]
    }
  ];

  const filteredCurated = selectedCategory === "all" 
    ? curatedTopics 
    : curatedTopics.filter(item => item.category === selectedCategory);

  return (
    <PageTemplate 
      title={uiLanguage === "vi" ? "Trung Tâm Đề Xuất Thông Minh" : "AI Intelligence Recommendations"}
      subtitle={uiLanguage === "vi" 
        ? "Khám phá các chủ đề tin tức, xu hướng nổi bật và gợi ý cá nhân hóa dành riêng cho hành trình của bạn."
        : "Discover trending topics, smart curation, and personalized briefing suggestions for your journey."}
    >
      <div className="space-y-8 animate-fade-in" id="ai-suggestions-workspace">
        
        {/* Dynamic User Preferences AI Topic Suggestions */}
        <TopicSuggestions 
          uiLanguage={uiLanguage}
          onSelectTopic={onSelectTopic}
          isGenerating={isGenerating}
        />

        {/* Curated Editorial Feeds */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-text-main">
                {uiLanguage === "vi" ? "Chủ Đề Biên Tập Chuyên Sâu" : "Curated Editorial Deep Dives"}
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: uiLanguage === "vi" ? "Tất cả" : "All" },
                { id: "ai", label: uiLanguage === "vi" ? "AI & Công Nghệ" : "AI & Tech" },
                { id: "energy", label: uiLanguage === "vi" ? "Năng Lượng" : "Energy" },
                { id: "finance", label: uiLanguage === "vi" ? "Kinh Tế" : "Finance" },
                { id: "lifestyle", label: uiLanguage === "vi" ? "Kỹ Năng" : "Productivity" },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === cat.id 
                      ? "bg-brand-accent text-white shadow-sm" 
                      : "bg-surface-subtle text-text-muted hover:text-text-main border border-border-subtle"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCurated.map((item) => (
              <Card 
                key={item.id} 
                className="p-5 rounded-2xl border border-border-subtle bg-surface-subtle/40 hover:bg-surface-subtle hover:border-brand-accent/30 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-surface-bg border border-border-subtle text-brand-accent">
                      {item.categoryName}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      ~ {item.readTime}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-text-main group-hover:text-brand-accent transition-colors leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-medium text-text-muted px-2 py-0.5 rounded-md bg-surface-bg/80 border border-border-subtle">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border-subtle/60 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectTopic(item.title)}
                    disabled={isGenerating}
                    className="text-xs font-bold flex items-center gap-1.5 py-1.5 rounded-xl border-border-subtle group-hover:border-brand-accent/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                    <span>{uiLanguage === "vi" ? "Tạo Bản Tin" : "Generate Briefing"}</span>
                    <ArrowRight className="w-3 h-3 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
