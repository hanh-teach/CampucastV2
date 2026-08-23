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
  AlertCircle,
  Smile,
  Meh,
  Frown,
  BrainCircuit,
  CheckCircle2,
  HardDrive,
  Bookmark,
  BookmarkCheck,
  Clock,
  Share2,
  X
} from "lucide-react";
import { RSSArticle, SavedReadingItem } from "../types";
import { cn } from "../lib/utils";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { detectSentimentFromKeywords, getOfflineCachedArticles } from "../services/rssService";
import { getSavedReadingList, saveReadingItem, removeReadingItem, recordReadHistoryItem } from "../services/storageService";

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
  onAnalyzeSentiment?: () => void;
  isAnalyzingSentiment?: boolean;
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
  onClearAllArticles,
  onAnalyzeSentiment,
  isAnalyzingSentiment
}: RSSFeedListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedSentiment, setSelectedSentiment] = useState<"All" | "positive" | "neutral" | "negative">("All");
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [showOnlySaved, setShowOnlySaved] = useState<boolean>(false);

  // Saved Reading List state
  const [savedReadingList, setSavedReadingList] = useState<SavedReadingItem[]>(() => {
    try {
      return getSavedReadingList();
    } catch {
      return [];
    }
  });

  // Saved map lookup
  const savedMap = useMemo(() => {
    const map = new Set<string>();
    savedReadingList.forEach((item) => {
      if (item.id) map.add(item.id);
      if (item.url) map.add(item.url);
      if (item.title) map.add(item.title);
    });
    return map;
  }, [savedReadingList]);

  // Handle Save / Unsave Article for Read Later
  const handleToggleSaveForLater = (e: React.MouseEvent, art: RSSArticle) => {
    e.stopPropagation();
    const urlOrId = art.link || art.title;
    const isSaved = savedMap.has(urlOrId) || savedMap.has(art.link) || savedMap.has(art.title);

    if (isSaved) {
      const updated = removeReadingItem(urlOrId);
      setSavedReadingList(updated);
    } else {
      const updated = saveReadingItem({
        id: urlOrId,
        title: art.title,
        url: art.link,
        feedTitle: art.feedTitle,
        category: art.feedCategory || art.category,
        content: art.content,
        pubDate: art.pubDate,
        feedType: art.feedType,
      });
      setSavedReadingList(updated);
    }
  };

  // Copy Share Link state
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Reading Modal & Progress bar states
  const [readingArticle, setReadingArticle] = useState<RSSArticle | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      const progress = (target.scrollTop / totalHeight) * 100;
      setScrollProgress(progress);
    } else {
      setScrollProgress(100);
    }
  };

  const handleShareArticle = (e: React.MouseEvent, art: RSSArticle) => {
    e.stopPropagation();
    try {
      const origin = window.location.origin + window.location.pathname;
      const articleData = {
        title: art.title || "",
        link: art.link || "",
        feedTitle: art.feedTitle || "",
        category: art.feedCategory || art.category || "",
        pubDate: art.pubDate || ""
      };
      const b64Data = btoa(unescape(encodeURIComponent(JSON.stringify(articleData))));
      const shareUrl = `${origin}?shared_art=${b64Data}`;
      
      navigator.clipboard.writeText(shareUrl);
      const id = art.link || art.title || "unknown";
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to share article:", err);
    }
  };

  // Base list of articles merging live fetched articles with saved articles if showOnlySaved is active
  const baseArticles = useMemo(() => {
    if (!showOnlySaved) return articles;

    const liveLinks = new Set(articles.map((a) => a.link || a.title));
    const savedAsArticles: RSSArticle[] = savedReadingList.map((s) => ({
      title: s.title,
      link: s.url,
      pubDate: s.pubDate || s.savedAt,
      content: s.content,
      feedTitle: s.feedTitle || (uiLanguage === "vi" ? "Đã lưu Đọc Sau" : "Saved Reading"),
      feedCategory: s.category,
      feedType: s.feedType || "news",
      isSavedForLater: true,
    }));

    const savedInLive = articles.filter((a) => savedMap.has(a.link) || savedMap.has(a.title));
    const missingSaved = savedAsArticles.filter((s) => !liveLinks.has(s.link));

    return [...savedInLive, ...missingSaved];
  }, [articles, showOnlySaved, savedReadingList, savedMap, uiLanguage]);

  // Set of offline cached article identifiers
  const offlineCachedLinks = useMemo(() => {
    try {
      const cached = getOfflineCachedArticles();
      return new Set(cached.map(c => c.link || c.title));
    } catch {
      return new Set<string>();
    }
  }, [articles]);

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

  // Predefined topic categories
  const PREDEFINED_CATEGORIES = [
    "Thời sự",
    "Công nghệ",
    "Kinh tế",
    "Giáo dục",
    "Sức khỏe",
    "Thể thao",
    "Giải trí",
    "Khác"
  ];

  // Extract unique categories from articles merged with predefined topics
  const categories = useMemo(() => {
    const list = new Set<string>(PREDEFINED_CATEGORIES);
    articles.forEach(art => {
      if (art.feedCategory) {
        list.add(art.feedCategory);
      }
    });
    return ["All", ...Array.from(list)];
  }, [articles]);

  // Compute sentiment counts for active articles
  const { positiveCount, neutralCount, negativeCount } = useMemo(() => {
    let pos = 0, neu = 0, neg = 0;
    articles.forEach(art => {
      const s = art.sentiment || detectSentimentFromKeywords(art.title || "", art.content || "");
      if (s === "positive") pos++;
      else if (s === "negative") neg++;
      else neu++;
    });
    return { positiveCount: pos, neutralCount: neu, negativeCount: neg };
  }, [articles]);

  // Filter articles based on search term, category, feedType, sentiment, and duplicates
  const filteredArticles = useMemo(() => {
    return baseArticles.filter(art => {
      const matchSearch = 
        art.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        art.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.feedTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === "All" || 
        (art.feedCategory && art.feedCategory.toLowerCase() === selectedCategory.toLowerCase()) ||
        (art.category && art.category.toLowerCase() === selectedCategory.toLowerCase());
      
      const matchType = selectedType === "All" || art.feedType === selectedType;

      const matchDuplicate = !hideDuplicates || !art.isDuplicate;

      const artSentiment = art.sentiment || detectSentimentFromKeywords(art.title || "", art.content || "");
      const matchSentiment = selectedSentiment === "All" || artSentiment === selectedSentiment;

      return matchSearch && matchCategory && matchType && matchDuplicate && matchSentiment;
    });
  }, [baseArticles, searchTerm, selectedCategory, selectedType, hideDuplicates, selectedSentiment]);

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
          {/* Read Later Saved Filter Button */}
          <button
            type="button"
            onClick={() => setShowOnlySaved(prev => !prev)}
            className={cn(
              "h-7 px-2.5 rounded-app-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1.5 shadow-xs",
              showOnlySaved
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            )}
            title={uiLanguage === "vi" ? "Xem danh sách bài viết đã lưu Đọc Sau" : "View Saved Reading List"}
          >
            {showOnlySaved ? (
              <BookmarkCheck className="w-3 h-3 text-white fill-white shrink-0" />
            ) : (
              <Bookmark className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <span>{uiLanguage === "vi" ? "Đọc sau" : "Read Later"}</span>
            <span className={cn("px-1.5 py-0.2 rounded-full text-[9px] font-mono", showOnlySaved ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-700 dark:text-amber-300")}>
              {savedReadingList.length}
            </span>
          </button>

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
            <option value="All">{t.categoryLabel}: {t.all} ({articles.length})</option>
            {categories.filter(c => c !== "All").map(cat => {
              const count = articles.filter(art => 
                (art.feedCategory && art.feedCategory.toLowerCase() === cat.toLowerCase()) ||
                (art.category && art.category.toLowerCase() === cat.toLowerCase())
              ).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
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

      {/* Sentiment Filter Toggle & AI Sentiment Analysis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-app-subtle border border-app-border rounded-app-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted mr-1 shrink-0">
            {uiLanguage === "vi" ? "Lọc Cảm xúc:" : "Sentiment Filter:"}
          </span>
          <button
            type="button"
            onClick={() => setSelectedSentiment("All")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border",
              selectedSentiment === "All"
                ? "bg-app-accent text-app-surface border-app-accent"
                : "bg-app-surface text-app-text-muted border-app-border hover:border-app-accent/50"
            )}
          >
            {uiLanguage === "vi" ? "Tất cả" : "All"} ({articles.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSentiment("positive")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1",
              selectedSentiment === "positive"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            )}
          >
            <Smile className="w-3 h-3" />
            <span>{uiLanguage === "vi" ? "Tích cực" : "Positive"}</span>
            <span className="ml-0.5 opacity-80">({positiveCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSentiment("neutral")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1",
              selectedSentiment === "neutral"
                ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
            )}
          >
            <Meh className="w-3 h-3" />
            <span>{uiLanguage === "vi" ? "Trung lập" : "Neutral"}</span>
            <span className="ml-0.5 opacity-80">({neutralCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSentiment("negative")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1",
              selectedSentiment === "negative"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            )}
          >
            <Frown className="w-3 h-3" />
            <span>{uiLanguage === "vi" ? "Tiêu cực" : "Negative"}</span>
            <span className="ml-0.5 opacity-80">({negativeCount})</span>
          </button>
        </div>

        {onAnalyzeSentiment && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAnalyzeSentiment}
            disabled={isAnalyzingSentiment || articles.length === 0}
            className="h-7 text-[10px] font-black border transition-all shrink-0 flex items-center gap-1.5 shadow-xs"
            style={{ borderColor: `${colors.interactive}40`, color: colors.interactive }}
          >
            <BrainCircuit className={cn("w-3.5 h-3.5", isAnalyzingSentiment && "animate-spin")} />
            <span>
              {isAnalyzingSentiment 
                ? (uiLanguage === "vi" ? "AI Đang phân tích..." : "AI Analyzing...") 
                : (uiLanguage === "vi" ? "Phân tích cảm xúc AI" : "AI Sentiment Analysis")}
            </span>
          </Button>
        )}
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
        <div className="p-4 border rounded-app-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-app-lg animate-fade-in-up"
             style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <span className="text-[12px] font-black uppercase tracking-wide text-center md:text-left" style={{ color: colors.textPrimary }}>
            {uiLanguage === "vi" 
              ? `Đã chọn ${selectedArticles.length} bài viết. Bạn muốn:` 
              : `Selected ${selectedArticles.length} articles. What would you like to do?`}
          </span>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            <Button
              variant="secondary"
              onClick={() => handleAddToDraftClick()}
              className="w-full sm:w-auto h-auto min-h-[44px] sm:min-h-[38px] py-2 px-4 text-xs font-bold transition-all flex items-center justify-center border"
              style={{ backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }}
            >
              <Plus className="w-4 h-4 mr-1.5 shrink-0" style={{ color: colors.interactive }} />
              <span className="leading-tight">{t.btnAddToDraft}</span>
            </Button>

            <Button
              variant="primary"
              disabled={isGenerating}
              onClick={() => onGenerateFromSelected(selectedArticles)}
              className="w-full sm:w-auto h-auto min-h-[44px] sm:min-h-[38px] py-2 px-4 text-xs font-black transition-all flex items-center justify-center border-0"
              style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
            >
              <Sparkles className="w-4 h-4 mr-1.5 shrink-0 animate-pulse" />
              <span className="leading-tight">{t.btnGenerateNow}</span>
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
              const urlOrId = art.link || art.title;
              const isSaved = savedMap.has(urlOrId) || savedMap.has(art.link) || savedMap.has(art.title);

              return (
                <div 
                  key={idx}
                  onClick={() => {
                    recordReadHistoryItem({
                      title: art.title,
                      url: art.link,
                      feedTitle: art.feedTitle,
                      category: art.feedCategory || art.category,
                      contentSnippet: art.content,
                      pubDate: art.pubDate,
                      feedType: art.feedType
                    });
                    onToggleSelectArticle(art);
                  }}
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
                        {/* Sentiment Badge */}
                        {(() => {
                          const s = art.sentiment || detectSentimentFromKeywords(art.title || "", art.content || "");
                          if (s === "positive") {
                            return (
                              <Badge variant="outline" className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                                <Smile className="w-2.5 h-2.5 shrink-0" />
                                <span>{uiLanguage === "vi" ? "Tích cực" : "Positive"}</span>
                              </Badge>
                            );
                          } else if (s === "negative") {
                            return (
                              <Badge variant="outline" className="text-[9px] font-extrabold px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 flex items-center gap-1">
                                <Frown className="w-2.5 h-2.5 shrink-0" />
                                <span>{uiLanguage === "vi" ? "Tiêu cực" : "Negative"}</span>
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge variant="outline" className="text-[9px] font-extrabold px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 flex items-center gap-1">
                                <Meh className="w-2.5 h-2.5 shrink-0" />
                                <span>{uiLanguage === "vi" ? "Trung lập" : "Neutral"}</span>
                              </Badge>
                            );
                          }
                        })()}

                        {/* Reading Time Badge based on 200 words per minute */}
                        {(() => {
                          const fullText = `${art.title || ""} ${art.content || ""}`.trim();
                          const words = fullText.split(/\s+/).filter(Boolean).length;
                          const minutes = Math.max(1, Math.ceil(words / 200));
                          return (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 flex items-center gap-1 shrink-0 shadow-xs"
                              title={uiLanguage === "vi" ? `${words} từ, tốc độ 200 từ/phút` : `${words} words, 200 wpm`}
                            >
                              <Clock className="w-2.5 h-2.5 shrink-0 text-indigo-500" />
                              <span>{minutes} {uiLanguage === "vi" ? `${minutes} phút đọc` : `${minutes} min read`}</span>
                            </Badge>
                          );
                        })()}

                        {/* Offline Cached Sync Indicator */}
                        {(art.isOfflineCached || offlineCachedLinks.has(art.link) || offlineCachedLinks.has(art.title)) && (
                          <Badge 
                            variant="outline" 
                            className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 flex items-center gap-1 shrink-0 shadow-xs"
                            title={uiLanguage === "vi" ? "Đã đồng bộ & lưu trữ offline (Đọc không cần mạng)" : "Synced & cached offline in local storage"}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-teal-500 shrink-0" />
                            <span>{uiLanguage === "vi" ? "Đã lưu Offline" : "Offline Cached"}</span>
                          </Badge>
                        )}

                        {/* Saved for Later Badge */}
                        {isSaved && (
                          <Badge 
                            variant="outline" 
                            className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 shrink-0 shadow-xs"
                            title={uiLanguage === "vi" ? "Bài viết đã lưu trong danh sách Đọc Sau" : "Article saved in Read Later list"}
                          >
                            <BookmarkCheck className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span>{uiLanguage === "vi" ? "Đã lưu Đọc sau" : "Read Later"}</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Read Later Bookmark Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleSaveForLater(e, art)}
                          className={cn(
                            "p-1 px-2 rounded-app-lg transition shrink-0 border cursor-pointer flex items-center gap-1 text-[9px] font-mono font-extrabold select-none shadow-2xs",
                            isSaved
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/25"
                              : "bg-app-subtle text-app-text-muted border-app-border hover:text-app-text hover:border-amber-500/40"
                          )}
                          title={isSaved ? (uiLanguage === "vi" ? "Bỏ khỏi danh sách Đọc Sau" : "Remove from Read Later") : (uiLanguage === "vi" ? "Lưu vào danh sách Đọc Sau" : "Save to Read Later")}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          ) : (
                            <Bookmark className="w-3 h-3 shrink-0" />
                          )}
                          <span className="hidden sm:inline">{isSaved ? (uiLanguage === "vi" ? "Đã lưu" : "Saved") : (uiLanguage === "vi" ? "Đọc sau" : "Read Later")}</span>
                        </button>

                        {/* Share Article Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => handleShareArticle(e, art)}
                          className={cn(
                            "p-1 px-2 rounded-app-lg transition shrink-0 border cursor-pointer flex items-center gap-1 text-[9px] font-mono font-extrabold select-none shadow-2xs",
                            copiedStates[art.link || art.title || "unknown"]
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                              : "bg-app-subtle text-app-text-muted border-app-border hover:text-app-text hover:border-app-accent/40"
                          )}
                          title={uiLanguage === "vi" ? "Chia sẻ bài viết này" : "Share this article"}
                        >
                          {copiedStates[art.link || art.title || "unknown"] ? (
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          ) : (
                            <Share2 className="w-3 h-3 shrink-0" />
                          )}
                          <span className="hidden sm:inline">
                            {copiedStates[art.link || art.title || "unknown"]
                              ? (uiLanguage === "vi" ? "Đã sao chép" : "Copied")
                              : (uiLanguage === "vi" ? "Chia sẻ" : "Share")}
                          </span>
                        </button>

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

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            recordReadHistoryItem({
                              title: art.title,
                              url: art.link,
                              feedTitle: art.feedTitle,
                              category: art.feedCategory || art.category,
                              contentSnippet: art.content,
                              pubDate: art.pubDate,
                              feedType: art.feedType
                            });
                            setReadingArticle(art);
                            setScrollProgress(0); // Reset scroll progress
                          }}
                          className="flex items-center gap-0.5 text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer font-bold"
                          title={uiLanguage === "vi" ? "Đọc nội dung đầy đủ" : "Read full content"}
                        >
                          <BookOpen className="w-3 h-3 text-indigo-500" />
                          <span>{uiLanguage === "vi" ? "Đọc" : "Read"}</span>
                        </button>

                        {art.link && (
                          <a 
                            href={art.link} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              recordReadHistoryItem({
                                title: art.title,
                                url: art.link,
                                feedTitle: art.feedTitle,
                                category: art.feedCategory || art.category,
                                contentSnippet: art.content,
                                pubDate: art.pubDate,
                                feedType: art.feedType
                              });
                            }}
                            className="flex items-center gap-0.5 text-app-accent hover:underline font-bold"
                            title={t.readMore}
                          >
                            <span>{uiLanguage === "vi" ? "Gốc" : "Source"}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RSS Article Reader Modal with Reading Progress Bar */}
      {readingArticle && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl rounded-app-2xl shadow-2xl flex flex-col h-[80vh] md:h-[70vh] relative overflow-hidden border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: colors.border }}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <span 
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${colors.interactive}15`, color: colors.interactive }}
                  >
                    {readingArticle.feedTitle || (uiLanguage === "vi" ? "Nguồn Tin" : "Feed Source")}
                  </span>
                  {(readingArticle.feedCategory || readingArticle.category) && (
                    <span 
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${colors.textMuted}15`, color: colors.textMuted }}
                    >
                      {readingArticle.feedCategory || readingArticle.category}
                    </span>
                  )}
                  {readingArticle.feedType && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-[9px]"
                      style={{ backgroundColor: `${colors.success || '#10b981'}15`, color: colors.success || '#10b981' }}
                    >
                      {readingArticle.feedType}
                    </span>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-black text-app-text leading-snug" style={{ color: colors.textPrimary }}>
                  {readingArticle.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-app-text-muted font-bold">
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateString(readingArticle.pubDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {Math.max(1, Math.ceil((readingArticle.content || "").split(/\s+/).length / 200))} {uiLanguage === "vi" ? "phút đọc" : "min read"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="p-1 rounded-full transition-colors cursor-pointer"
                style={{ color: colors.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.critical;
                  e.currentTarget.style.backgroundColor = `${colors.critical}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.textMuted;
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Article Content */}
            <div 
              className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 leading-relaxed text-xs md:text-sm"
              onScroll={handleScroll}
              style={{ color: colors.textPrimary }}
            >
              <div className="whitespace-pre-line font-medium text-justify">
                {readingArticle.content || (uiLanguage === "vi" ? "Không có nội dung đầy đủ." : "No content available.")}
              </div>
            </div>

            {/* Modal Footer with Scroll Percentage */}
            <div className="p-4 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider relative" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
              <div className="flex items-center gap-1" style={{ color: colors.textMuted }}>
                <span>{uiLanguage === "vi" ? "Tiến trình đọc:" : "Reading Progress:"}</span>
                <span className="font-mono text-indigo-500">{Math.round(scrollProgress)}%</span>
              </div>

              {readingArticle.link && (
                <a 
                  href={readingArticle.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  <span>{uiLanguage === "vi" ? "Đọc bài gốc" : "Read source"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Dynamic Reading Progress Bar at the Bottom of the Modal */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: `${colors.border}40` }}>
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-app-accent transition-all duration-75"
                  style={{ width: `${scrollProgress}%`, backgroundColor: colors.interactive }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
