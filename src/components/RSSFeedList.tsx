import { colors } from "../foundation/tokens/colors";
import React, { useState, useMemo } from "react";
import { 
  Check, 
  Plus, 
  Sparkles, 
  Search, 
  Filter, 
  BookOpen, 
  ExternalLink,
  Calendar,
  Layers,
  Trash2,
  AlertCircle
} from "lucide-react";
import { RSSArticle } from "../types";
import { cn } from "../lib/utils";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface RSSFeedListProps {
  articles: RSSArticle[];
  selectedArticles: RSSArticle[];
  onToggleSelectArticle: (article: RSSArticle) => void;
  onSelectAllArticles: (articlesToSelect: RSSArticle[]) => void;
  onClearSelection: () => void;
  onAddToDraft: (text: string) => void;
  onGenerateFromSelected: (articles: RSSArticle[]) => void;
  uiLanguage: "vi" | "en";
  isGenerating: boolean;
  onDeleteArticle?: (article: RSSArticle) => void;
  onClearAllArticles?: () => void;
}

export default function RSSFeedList({
  articles,
  selectedArticles,
  onToggleSelectArticle,
  onSelectAllArticles,
  onClearSelection,
  onAddToDraft,
  onGenerateFromSelected,
  uiLanguage,
  isGenerating,
  onDeleteArticle,
  onClearAllArticles
}: RSSFeedListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [hideDuplicates, setHideDuplicates] = useState(true);

  const t = {
    searchPlaceholder: uiLanguage === "vi" ? "Tìm kiếm bài viết..." : "Search articles...",
    categoryLabel: uiLanguage === "vi" ? "Chủ đề" : "Category",
    typeLabel: uiLanguage === "vi" ? "Loại nguồn" : "Feed Type",
    all: uiLanguage === "vi" ? "Tất cả" : "All",
    news: uiLanguage === "vi" ? "📰 Báo chí" : "📰 News",
    podcast: uiLanguage === "vi" ? "🎙️ Podcast" : "🎙️ Podcast",
    blog: uiLanguage === "vi" ? "✍️ Blog" : "✍️ Blog",
    selectedCount: uiLanguage === "vi" ? "Đã chọn" : "Selected",
    btnAddToDraft: uiLanguage === "vi" ? "Thêm vào soạn thảo" : "Append to Draft",
    btnGenerateNow: uiLanguage === "vi" ? "Tạo bản tin từ nguồn đã chọn" : "Generate Briefing from Selected",
    noArticles: uiLanguage === "vi" ? "Không tìm thấy bài viết nào khớp với bộ lọc." : "No articles found matching the current filters.",
    selectAll: uiLanguage === "vi" ? "Chọn tất cả" : "Select All",
    deselectAll: uiLanguage === "vi" ? "Bỏ chọn tất cả" : "Deselect All",
    readMore: uiLanguage === "vi" ? "Đọc bài gốc" : "Read Source Article",
    totalArticles: uiLanguage === "vi" ? "Tổng số tin tức" : "Total Articles",
    noContent: uiLanguage === "vi" ? "Không có tóm tắt chi tiết." : "No content description available."
  };

  // Extract unique categories from articles
  const categories = useMemo(() => {
    const list = new Set<string>();
    articles.forEach(art => {
      if (art.feedCategory) {
        list.add(art.feedCategory);
      }
    });
    return ["All", ...Array.from(list)];
  }, [articles]);

  // Filter articles based on search term, category, feedType, and duplicates
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchSearch = 
        art.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        art.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.feedTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === "All" || art.feedCategory === selectedCategory;
      
      const matchType = selectedType === "All" || art.feedType === selectedType;

      const matchDuplicate = !hideDuplicates || !art.isDuplicate;

      return matchSearch && matchCategory && matchType && matchDuplicate;
    });
  }, [articles, searchTerm, selectedCategory, selectedType, hideDuplicates]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredArticles.length === 0) return false;
    return filteredArticles.every(art => 
      selectedArticles.some(sel => sel.link === art.link && sel.title === art.title)
    );
  }, [filteredArticles, selectedArticles]);

  const handleSelectAllToggle = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered
      const remaining = selectedArticles.filter(sel => 
        !filteredArticles.some(filt => filt.link === sel.link && filt.title === sel.title)
      );
      onSelectAllArticles(remaining);
    } else {
      // Select all filtered (merge with existing)
      const merged = [...selectedArticles];
      filteredArticles.forEach(art => {
        if (!merged.some(sel => sel.link === art.link && sel.title === art.title)) {
          merged.push(art);
        }
      });
      onSelectAllArticles(merged);
    }
  };

  const handleAddToDraftClick = () => {
    if (selectedArticles.length === 0) return;
    const formatted = selectedArticles.map((art, idx) => {
      const source = art.feedTitle ? ` (Nguồn: ${art.feedTitle})` : "";
      return `[Tin tức #${idx + 1}] ${art.title}${source}\n${art.content || ""}`;
    }).join("\n\n---\n\n");
    onAddToDraft(formatted);
  };

  // Helper to format nice readable dates
  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Return sliced pubdate string
        return dateStr.split(" ").slice(0, 4).join(" ");
      }
      return date.toLocaleDateString(uiLanguage === "vi" ? "vi-VN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card id="rss-unified-feed-list" className="space-y-5 shadow-app-md animate-fade-in border-app-border">
      {/* Header and Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-app-border pb-4">
        <div>
          <h3 className="text-sm font-extrabold text-app-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-app-accent" />
            <span>{t.totalArticles} ({filteredArticles.length}/{articles.length})</span>
          </h3>
          <p className="text-[11px] text-app-text-muted mt-0.5">
            {uiLanguage === "vi" ? "Chọn lọc các bài viết chất lượng từ RSS để đưa trực tiếp vào studio phát sóng." : "Select news and blogs from RSS feeds to load directly into the audio studio."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {onClearAllArticles && articles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllArticles}
              className="h-7 text-[10px] border transition-colors"
              style={{ color: colors.critical, borderColor: `${colors.critical}33` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.critical}1a`;
                e.currentTarget.style.borderColor = colors.critical;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = `${colors.critical}33`;
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              <span>{uiLanguage === "vi" ? "Xóa tất cả tin" : "Clear all"}</span>
            </Button>
          )}

          {selectedArticles.length > 0 && (
            <Badge variant="accent" className="h-7 px-3 text-[10px] font-bold">
              <Check className="w-3 h-3 mr-1" />
              {t.selectedCount}: <strong className="ml-1">{selectedArticles.length}</strong>
            </Badge>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-app-text-muted" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 bg-app-subtle border border-app-border rounded-app-xl text-xs text-app-text placeholder-app-text-muted focus:outline-none focus:ring-1 focus:ring-app-accent transition-all font-bold"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 bg-app-subtle border border-app-border rounded-app-xl px-3 py-1.5">
          <Filter className="w-3.5 h-3.5 text-app-text-muted shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-app-text w-full focus:outline-none cursor-pointer"
          >
            <option value="All">{t.categoryLabel}: {t.all}</option>
            {categories.filter(c => c !== "All").map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-app-subtle border border-app-border rounded-app-xl px-3 py-1.5">
          <BookOpen className="w-3.5 h-3.5 text-app-text-muted shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-app-text w-full focus:outline-none cursor-pointer"
          >
            <option value="All">{t.typeLabel}: {t.all}</option>
            <option value="news">{t.news}</option>
            <option value="podcast">{t.podcast}</option>
            <option value="blog">{t.blog}</option>
          </select>
        </div>
      </div>

      {/* Duplicate Detection Toggle Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-app-subtle border border-app-border rounded-app-xl text-[11px] text-app-text-muted">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={hideDuplicates}
            onChange={(e) => setHideDuplicates(e.target.checked)}
            className="rounded border-app-border text-app-accent focus:ring-app-accent h-4 w-4 cursor-pointer"
          />
          <span className="font-bold text-app-text-muted group-hover:text-app-text transition-colors">
            {uiLanguage === "vi" ? "Lọc & Ẩn bài viết trùng lặp (Deep Duplicate Detection)" : "Filter & Hide Duplicate Articles"}
          </span>
        </label>
        
        {articles.some(a => a.isDuplicate) && (
          <Badge variant="warning" className="animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.warning }}></span>
            {uiLanguage === "vi" 
              ? `Phát hiện ${articles.filter(a => a.isDuplicate).length} tin trùng lặp` 
              : `Detected ${articles.filter(a => a.isDuplicate).length} duplicate articles`}
          </Badge>
        )}
      </div>

      {/* Floating / Contextual Action Bar when articles are selected */}
      {selectedArticles.length > 0 && (
        <div className="p-3 border rounded-app-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-app-lg animate-fade-in-up"
             style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: colors.textPrimary }}>
            {uiLanguage === "vi" 
              ? `Đã chọn ${selectedArticles.length} bài viết. Bạn muốn:` 
              : `Selected ${selectedArticles.length} articles. What would you like to do?`}
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => handleAddToDraftClick()}
              className="flex-1 sm:flex-initial border h-9"
              style={{ backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" style={{ color: colors.interactive }} />
              <span>{t.btnAddToDraft}</span>
            </Button>

            <Button
              variant="default"
              disabled={isGenerating}
              onClick={() => onGenerateFromSelected(selectedArticles)}
              className="flex-1 sm:flex-initial border-0 h-9 font-black"
              style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
              <span>{t.btnGenerateNow}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Selection Helpers and Article Shelf */}
      <div className="space-y-3">
        {filteredArticles.length > 0 && (
          <div className="flex justify-between items-center px-1">
            <button
              type="button"
              onClick={() => handleSelectAllToggle()}
              className="text-xs font-bold text-app-accent hover:text-app-accent/80 flex items-center gap-1.5 transition-colors"
            >
              <span className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                isAllFilteredSelected 
                  ? "bg-app-accent border-app-accent text-app-surface" 
                  : "border-app-border bg-app-surface"
              )}>
                {isAllFilteredSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span>{isAllFilteredSelected ? t.deselectAll : t.selectAll} ({filteredArticles.length})</span>
            </button>

            {selectedArticles.length > 0 && (
              <button
                type="button"
                onClick={() => onClearSelection()}
                className="text-xs font-bold transition-colors cursor-pointer"
                style={{ color: colors.critical }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8" }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
              >
                {uiLanguage === "vi" ? "Hủy chọn tất cả" : "Clear selection"}
              </button>
            )}
          </div>
        )}

        {/* Scrollable list */}
        {filteredArticles.length === 0 ? (
          <div className="py-12 px-4 border border-dashed border-app-border rounded-app-2xl bg-app-subtle text-center text-xs text-app-text-muted italic font-medium">
            {t.noArticles}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredArticles.map((art, idx) => {
              const isSelected = selectedArticles.some(
                sel => sel.link === art.link && sel.title === art.title
              );

              return (
                <div 
                  key={idx}
                  onClick={() => onToggleSelectArticle(art)}
                  className={cn(
                    "p-4 rounded-app-2xl border transition-all text-left flex gap-3 cursor-pointer select-none relative group",
                    isSelected 
                      ? "bg-app-accent/5 border-app-accent shadow-app-sm" 
                      : "bg-app-surface border-app-border hover:border-app-accent/30 hover:bg-app-subtle/50"
                  )}
                >
                  {/* Select Checkbox Indicator */}
                  <div className="shrink-0 pt-0.5">
                    <span className={cn(
                      "w-4.5 h-4.5 rounded-app-lg border flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-app-accent border-app-accent text-app-surface" 
                        : "border-app-border bg-app-surface group-hover:border-app-accent/50"
                    )}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0 flex-1 space-y-2 relative">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <Badge variant="warning" className="text-[9px] font-black uppercase px-1.5 py-0.5 truncate">
                          {art.feedTitle}
                        </Badge>
                        {art.feedCategory && (
                          <Badge variant="secondary" className="text-[9px] font-extrabold px-1.5 py-0.5">
                            {art.feedCategory}
                          </Badge>
                        )}
                        {art.feedType && (
                          <Badge variant="outline" className="text-[9px] font-mono font-extrabold text-app-accent border-app-accent/30 px-1.5 py-0.5 uppercase">
                            {art.feedType}
                          </Badge>
                        )}
                      </div>

                      {onDeleteArticle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteArticle(art);
                          }}
                          className="p-1 rounded-app-lg transition shrink-0 border-0 bg-transparent cursor-pointer"
                          style={{ color: colors.textMuted }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.critical;
                            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${colors.critical}, transparent 90%)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = colors.textMuted;
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title={uiLanguage === "vi" ? "Xóa bài viết này khỏi danh sách" : "Remove this article"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-app-text leading-snug line-clamp-2 group-hover:text-app-accent transition-colors">
                      {art.title}
                    </h4>

                    <p className="text-[11px] text-app-text-muted leading-relaxed line-clamp-3 font-medium">
                      {art.content || t.noContent}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-app-text-muted font-bold">
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateString(art.pubDate)}</span>
                      </div>

                      {art.link && (
                        <a 
                          href={art.link} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-0.5 text-app-accent hover:underline"
                          title={t.readMore}
                        >
                          <span>{uiLanguage === "vi" ? "Gốc" : "Source"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
