import { colors } from "../foundation/tokens/colors";
import React, { useState, useEffect } from "react";
import { 
  Rss, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  Check, 
  ExternalLink,
  Edit,
  X,
  FileText,
  Download,
  Upload,
  Shield,
  Activity,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { RSSFeed, RSSArticle } from "../types";
import { saveRSSFeed, getRSSFeeds, deleteRSSFeed } from "../services/storageService";
import { fetchRSSArticles, formatArticlesForPrompt, exportToOPML, parseOPML } from "../services/rssService";
import RSSFeedList from "./RSSFeedList";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface RSSManagerProps {
  uiLanguage: "vi" | "en";
  getApiUrl: (path: string) => string;
  onGenerateFromRSS: (content: string) => void;
  isGenerating: boolean;
  onAddToDraft?: (text: string) => void;
}

export default function RSSManager({
  uiLanguage,
  getApiUrl,
  onGenerateFromRSS,
  isGenerating,
  onAddToDraft
}: RSSManagerProps) {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Thời sự");
  const [newFeedType, setNewFeedType] = useState<"news" | "podcast" | "blog">("news");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newIncludeKeywords, setNewIncludeKeywords] = useState("");
  const [newExcludeKeywords, setNewExcludeKeywords] = useState("");
  const [autoRefreshStrategy, setAutoRefreshStrategy] = useState<"manual" | "5m" | "15m" | "30m">("manual");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  
  // Editing state
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);

  // Status states
  const [isTesting, setIsTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isFetchingArticles, setIsFetchingArticles] = useState(false);
  const [activeArticles, setActiveArticles] = useState<RSSArticle[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<RSSArticle[]>([]);
  const [fetchProgress, setFetchProgress] = useState<{ current: number, total: number, feedTitle: string } | null>(null);
  const [showArticlesPreview, setShowArticlesPreview] = useState(false);

  // States for the custom brief briefing feature
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [briefCount, setBriefCount] = useState<number>(5);
  const [briefDateType, setBriefDateType] = useState<"all" | "today" | "range">("today");
  const [briefStartDate, setBriefStartDate] = useState(getTodayDateString());
  const [briefEndDate, setBriefEndDate] = useState(getTodayDateString());
  const [rssNotification, setRssNotification] = useState<{ message: string; type: "error" | "warning" | "success" | "confirm"; action?: () => void } | null>(null);

  // Suggested RSS Presets
  const rssPresets = [
    { title: "VnExpress Tin Nổi Bật", url: "https://vnexpress.net/rss/tin-noi-bat.rss", category: "Thời sự", feedType: "news" as const },
    { title: "VnExpress Số Hóa (Công Nghệ)", url: "https://vnexpress.net/rss/so-hoa.rss", category: "Công nghệ", feedType: "news" as const },
    { title: "Tuổi Trẻ - Tin Mới Nhất", url: "https://tuoitre.vn/rss/tin-moi-nhat.rss", category: "Thời sự", feedType: "news" as const },
    {
      id: "giaoduc-thoidai-home",
      title: "Báo Giáo dục & Thời đại",
      url: "https://giaoducthoidai.vn",
      category: "Giáo dục",
      feedType: "news" as const,
      addedAt: new Date().toISOString()
    }
  ];

  const t = {
    managerTitle: uiLanguage === "vi" ? "Quản lý Nguồn tin RSS" : "RSS Feeds Manager",
    managerDesc: uiLanguage === "vi" 
      ? "Đăng ký, dán nhãn các nguồn tin RSS chính thống. Hệ thống tự tổng hợp và phát thanh bản tin CommuteCast cho bạn." 
      : "Subscribe, tag, and organize custom RSS channels. The system will auto-synthesize an audio briefing from aggregated feeds.",
    inputUrlPlaceholder: uiLanguage === "vi" ? "Nhập địa chỉ RSS URL..." : "Enter RSS Feed URL...",
    inputTitlePlaceholder: uiLanguage === "vi" ? "Nhập tên nguồn (ví dụ: VnExpress)..." : "Enter Feed Title (e.g. VnExpress)...",
    btnAdd: uiLanguage === "vi" ? "Thêm nguồn" : "Add Source",
    btnUpdate: uiLanguage === "vi" ? "Cập nhật nguồn" : "Update Source",
    btnCancelEdit: uiLanguage === "vi" ? "Hủy sửa" : "Cancel",
    btnTesting: uiLanguage === "vi" ? "Đang xử lý..." : "Processing...",
    presetsHeader: uiLanguage === "vi" ? "Gợi ý nguồn RSS Việt Nam" : "Vietnamese RSS Suggestions",
    rssListHeader: uiLanguage === "vi" ? "Nguồn đã đăng ký" : "Subscribed Feeds",
    emptyList: uiLanguage === "vi" ? "Chưa đăng ký nguồn RSS nào." : "No registered RSS channels yet.",
    btnFetchSummary: uiLanguage === "vi" ? "Đồng bộ & Cập nhật RSS" : "Sync & Update RSS",
    btnFetchSummaryForce: uiLanguage === "vi" ? "Tải lại (Bỏ qua Cache)" : "Force Reload (Bypass Cache)",
    fetchingArticles: uiLanguage === "vi" ? "Đang đồng bộ..." : "Synchronizing news...",
    previewHeader: uiLanguage === "vi" ? "Bài viết RSS Tổng hợp" : "Aggregated RSS Feed Reader",
    invalidUrl: uiLanguage === "vi" ? "Vui lòng nhập URL hợp lệ" : "Please enter a valid URL",
    testSuccess: uiLanguage === "vi" ? "Đã liên kết nguồn RSS thành công!" : "Successfully verified RSS source!",
    updateSuccess: uiLanguage === "vi" ? "Đã cập nhật nguồn thành công!" : "Successfully updated RSS source!"
  };

  useEffect(() => {
    loadFeedsAndArticles();
  }, []);

  // Periodic Auto Refresh Strategy
  useEffect(() => {
    if (autoRefreshStrategy === "manual" || feeds.length === 0) return;
    
    let intervalMs = 5 * 60 * 1000; // default 5m
    if (autoRefreshStrategy === "15m") intervalMs = 15 * 60 * 1000;
    else if (autoRefreshStrategy === "30m") intervalMs = 30 * 60 * 1000;
    
    console.log(`[RSS Studio Auto Refresh] Starting periodic sync interval every ${autoRefreshStrategy}`);
    const timer = setInterval(() => {
      console.log(`[RSS Studio Auto Refresh] Triggering scheduled auto-sync...`);
      handleFetchArticles(feeds, false);
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [autoRefreshStrategy, feeds]);

  const loadFeedsAndArticles = async () => {
    try {
      const saved = await getRSSFeeds();
      setFeeds(saved);
      // Auto fetch articles immediately on mount if feeds exist (using server-side 5m cache)
      if (saved.length > 0) {
        handleFetchArticles(saved, false);
      }
    } catch (e) {
      console.error("Failed to load RSS feeds", e);
    }
  };

  // Quick preset loading helper
  const handleApplyPreset = (preset: typeof rssPresets[0]) => {
    setNewUrl(preset.url);
    setNewTitle(preset.title);
    setNewCategory(preset.category);
    setNewFeedType(preset.feedType);
    setEditingFeedId(null);
  };

  // Add or Update customized RSS Feed URL
  const handleSaveFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanedUrl = newUrl.trim();
    if (!cleanedUrl || !cleanedUrl.startsWith("http")) {
      setErrorMsg(t.invalidUrl);
      return;
    }

    setIsTesting(true);

    try {
      // Validate with server parser first if it is a new feed or changed URL
      const isUrlChangedOrNew = !editingFeedId || feeds.find(f => f.id === editingFeedId)?.url !== cleanedUrl;

      let finalizedTitle = newTitle.trim();

      if (isUrlChangedOrNew) {
        const testRes = await fetch(getApiUrl(`/api/parse-rss?url=${encodeURIComponent(cleanedUrl)}`));
        if (!testRes.ok) {
          let serverErrorMsg = "";
          try {
            const errData = await testRes.json();
            serverErrorMsg = errData.error;
          } catch {
            // fail safe
          }
          throw new Error(serverErrorMsg || (uiLanguage === "vi" ? "Nguồn RSS không phản hồi hoặc sai định dạng XML." : "RSS link did not respond or XML is invalid."));
        }

        const testData = await testRes.json();
        if (!finalizedTitle) {
          finalizedTitle = testData.title || "RSS Feed";
        }
      }

      if (!finalizedTitle) {
        finalizedTitle = "RSS Source";
      }

      const feed: RSSFeed = {
        id: editingFeedId || "rss-" + Date.now().toString(36),
        url: cleanedUrl,
        title: finalizedTitle,
        category: newCategory,
        feedType: newFeedType,
        priority: newPriority,
        includeKeywords: newIncludeKeywords ? newIncludeKeywords.split(",").map(k => k.trim()).filter(k => k) : undefined,
        excludeKeywords: newExcludeKeywords ? newExcludeKeywords.split(",").map(k => k.trim()).filter(k => k) : undefined,
        addedAt: editingFeedId ? (feeds.find(f => f.id === editingFeedId)?.addedAt || new Date().toLocaleString()) : new Date().toLocaleString()
      };

      await saveRSSFeed(feed);
      setSuccessMsg(editingFeedId ? t.updateSuccess : t.testSuccess);
      setNewUrl("");
      setNewTitle("");
      setNewPriority("medium");
      setNewIncludeKeywords("");
      setNewExcludeKeywords("");
      setEditingFeedId(null);
      
      // Reload feeds and fetch articles
      const updatedFeeds = await getRSSFeeds();
      setFeeds(updatedFeeds);
      handleFetchArticles(updatedFeeds, false);

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || (uiLanguage === "vi" ? "Không thể liên kết nguồn này." : "Unable to reach RSS feed."));
    } finally {
      setIsTesting(false);
    }
  };

  const handleEditClick = (feed: RSSFeed) => {
    setEditingFeedId(feed.id);
    setNewUrl(feed.url);
    setNewTitle(feed.title);
    setNewCategory(feed.category || "Thời sự");
    setNewFeedType(feed.feedType || "news");
    setNewPriority(feed.priority || "medium");
    setNewIncludeKeywords(feed.includeKeywords?.join(", ") || "");
    setNewExcludeKeywords(feed.excludeKeywords?.join(", ") || "");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleCancelEdit = () => {
    setEditingFeedId(null);
    setNewUrl("");
    setNewTitle("");
    setNewCategory("Thời sự");
    setNewFeedType("news");
    setNewPriority("medium");
    setNewIncludeKeywords("");
    setNewExcludeKeywords("");
    setErrorMsg("");
  };

  const handleOPMLExport = () => {
    try {
      const opmlText = exportToOPML(feeds);
      const blob = new Blob([opmlText], { type: "text/xml;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `commutecast_subscriptions_${new Date().toISOString().slice(0,10)}.opml`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to export OPML", e);
    }
  };

  const handleOPMLImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlText = event.target?.result as string;
        if (!xmlText) return;

        const parsedFeeds = parseOPML(xmlText);
        if (parsedFeeds.length === 0) {
          setErrorMsg(uiLanguage === "vi" ? "Tệp OPML không hợp lệ hoặc rỗng." : "Invalid or empty OPML file.");
          return;
        }

        let importedCount = 0;
        for (const pf of parsedFeeds) {
          // Check if already subscribed to prevent duplicates
          if (feeds.some(f => f.url === pf.url)) continue;

          const newFeed: RSSFeed = {
            id: "rss-" + Math.random().toString(36).slice(2, 10),
            url: pf.url,
            title: pf.title,
            category: pf.category,
            feedType: pf.feedType,
            priority: pf.priority,
            addedAt: new Date().toLocaleString()
          };

          await saveRSSFeed(newFeed);
          importedCount++;
        }

        setSuccessMsg(uiLanguage === "vi" ? `Đã nhập thành công ${importedCount} nguồn tin từ OPML!` : `Successfully imported ${importedCount} channels from OPML!`);
        
        const updatedFeeds = await getRSSFeeds();
        setFeeds(updatedFeeds);
        if (updatedFeeds.length > 0) {
          handleFetchArticles(updatedFeeds, false);
        }
      } catch (err) {
        setErrorMsg(uiLanguage === "vi" ? "Lỗi phân tích cú pháp OPML." : "OPML Parse Error.");
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRSSFeed(id);
      if (editingFeedId === id) {
        handleCancelEdit();
      }
      const updatedFeeds = await getRSSFeeds();
      setFeeds(updatedFeeds);
      if (updatedFeeds.length > 0) {
        handleFetchArticles(updatedFeeds, false);
      } else {
        setActiveArticles([]);
        setSelectedArticles([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteArticle = (article: RSSArticle) => {
    setActiveArticles(prev => prev.filter(a => !(a.link === article.link && a.title === article.title)));
    setSelectedArticles(prev => prev.filter(a => !(a.link === article.link && a.title === article.title)));
  };

  const handleClearAllArticles = () => {
    setActiveArticles([]);
    setSelectedArticles([]);
  };

  // Fetch current articles across all registered feeds
  const handleFetchArticles = async (feedList: RSSFeed[], force: boolean = false) => {
    if (feedList.length === 0) return;

    setIsFetchingArticles(true);
    setErrorMsg("");

    try {
      const articles = await fetchRSSArticles(feedList, getApiUrl, force, (updatedFeed) => {
        // Real-time statistical feedback
        setFeeds(prev => prev.map(f => f.id === updatedFeed.id ? updatedFeed : f));
      });

      setActiveArticles(articles);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch articles.");
    } finally {
      setIsFetchingArticles(false);
      setFetchProgress(null);
    }
  };

  // Manual Trigger Button
  const handleManualRefresh = (force: boolean) => {
    if (feeds.length === 0) {
      setErrorMsg(uiLanguage === "vi" ? "Vui lòng thêm ít nhất một nguồn RSS trước!" : "Please add at least one RSS feed first!");
      return;
    }
    handleFetchArticles(feeds, force);
  };

  // Toggle selection for individual articles
  const handleToggleSelectArticle = (art: RSSArticle) => {
    setSelectedArticles(prev => {
      const exists = prev.some(item => item.link === art.link && item.title === art.title);
      if (exists) {
        return prev.filter(item => !(item.link === art.link && item.title === art.title));
      } else {
        return [...prev, art];
      }
    });
  };

  const handleSelectAllArticles = (articlesToSelect: RSSArticle[]) => {
    setSelectedArticles(articlesToSelect);
  };

  const handleClearSelection = () => {
    setSelectedArticles([]);
  };

  // Helper to parse dates in various formats and check if they fall in selected ranges
  const isArticleInDateRange = (
    pubDateStr: string,
    dateType: "all" | "today" | "range",
    startDateStr?: string,
    endDateStr?: string
  ): boolean => {
    if (dateType === "all") return true;
    if (!pubDateStr) return false;

    try {
      // Standard Date parsing
      let pubDate = new Date(pubDateStr);
      
      // Handle custom or Vietnamese formats if invalid
      if (isNaN(pubDate.getTime())) {
        const ddmmyyyyMatch = pubDateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (ddmmyyyyMatch) {
          const day = parseInt(ddmmyyyyMatch[1], 10);
          const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
          const year = parseInt(ddmmyyyyMatch[3], 10);
          pubDate = new Date(year, month, day);
        } else {
          const yyyymmddMatch = pubDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (yyyymmddMatch) {
            const year = parseInt(yyyymmddMatch[1], 10);
            const month = parseInt(yyyymmddMatch[2], 10) - 1;
            const day = parseInt(yyyymmddMatch[3], 10);
            pubDate = new Date(year, month, day);
          }
        }
      }

      if (isNaN(pubDate.getTime())) {
        const today = new Date();
        const todayStr1 = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        const todayStr2 = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        if (dateType === "today") {
          return pubDateStr.includes(todayStr1) || pubDateStr.includes(todayStr2);
        }
        return true;
      }

      const startOfDay = (d: Date) => {
        const res = new Date(d);
        res.setHours(0, 0, 0, 0);
        return res;
      };

      const endOfDay = (d: Date) => {
        const res = new Date(d);
        res.setHours(23, 59, 59, 999);
        return res;
      };

      const articleTime = pubDate.getTime();

      if (dateType === "today") {
        const todayStart = startOfDay(new Date()).getTime();
        const todayEnd = endOfDay(new Date()).getTime();
        return articleTime >= todayStart && articleTime <= todayEnd;
      }

      if (dateType === "range" && startDateStr && endDateStr) {
        const startLimit = startOfDay(new Date(startDateStr)).getTime();
        const endLimit = endOfDay(new Date(endDateStr)).getTime();
        return articleTime >= startLimit && articleTime <= endLimit;
      }
    } catch (e) {
      console.warn("Date parsing helper error:", e);
    }
    return true;
  };

  // Send aggregated text of ALL articles to the main summary drafting stream
  const triggerBriefingGenerationAll = () => {
    if (activeArticles.length === 0) return;
    const rawContent = formatArticlesForPrompt(activeArticles, uiLanguage);
    onGenerateFromRSS(rawContent);
  };

  // Generate a custom BRIEF summary of selected size and timeframe
  const triggerBriefingGenerationBrief = (bypassConfirm = false) => {
    if (activeArticles.length === 0) return;

    // Filter by date type
    let filtered = activeArticles.filter(art => 
      isArticleInDateRange(art.pubDate || "", briefDateType, briefStartDate, briefEndDate)
    );

    if (filtered.length === 0) {
      setRssNotification({
        type: "warning",
        message: uiLanguage === "vi"
          ? "Không tìm thấy bài viết phù hợp. Hãy thử: Chọn 7 ngày gần đây hoặc Chọn Tất cả hoặc Giảm số lượng bài."
          : "No matching articles found. Please try: selecting the last 7 days, selecting All, or reducing the number of articles."
      });
      return;
    }

    // Sort newer first
    filtered.sort((a, b) => {
      const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return 0;
    });

    // If requested articles count is more than available, show inline confirmation
    if (filtered.length < briefCount && !bypassConfirm) {
      const availableCount = filtered.length;
      setRssNotification({
        type: "confirm",
        message: uiLanguage === "vi"
          ? `Chỉ tìm thấy ${availableCount} bài mới hôm nay. Bạn có muốn tạo bản tin với ${availableCount} bài không?`
          : `Only found ${availableCount} articles. Do you want to generate the briefing with these ${availableCount} articles?`,
        action: () => {
          setRssNotification(null);
          const limited = filtered.slice(0, briefCount);
          const rawContent = formatArticlesForPrompt(limited, uiLanguage);
          onGenerateFromRSS(rawContent);
        }
      });
      return;
    }

    // Clear any active notification if succeeded
    setRssNotification(null);

    // Take the limited count
    const limited = filtered.slice(0, briefCount);
    console.log(`[RSS Brief] Selecting top ${limited.length} articles from ${filtered.length} total filtered items for briefing.`);

    const rawContent = formatArticlesForPrompt(limited, uiLanguage);
    onGenerateFromRSS(rawContent);
  };

  const triggerBriefingGenerationSelected = () => {
    if (selectedArticles.length === 0) return;
    const rawContent = formatArticlesForPrompt(selectedArticles, uiLanguage);
    onGenerateFromRSS(rawContent);
  };

  return (
    <div className="space-y-6" id="rss-composite-module">
      {/* 1. Feed Configuration panel */}
      <Card className="flex flex-col gap-5 p-6 transition-colors" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        {/* Title & Desc */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-app-xl border flex items-center justify-center"
               style={{ backgroundColor: `${colors.interactive}1a`, color: colors.interactive, borderColor: `${colors.interactive}33`, minWidth: "44px", minHeight: "44px" }}>
            <Rss className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
              <span>{t.managerTitle}</span>
              <Badge variant="secondary" className="text-[9px] font-extrabold px-1.5 py-0.5 uppercase">
                {uiLanguage === "vi" ? "Đa Kênh" : "Multi-channel"}
              </Badge>
            </h3>
            <p className="text-[11px] mt-1 font-medium leading-relaxed" style={{ color: colors.textSecondary }}>
              {t.managerDesc}
            </p>
          </div>
        </div>

        {/* Subscription / Editing Form */}
        <form onSubmit={handleSaveFeed} className="space-y-4 p-5 border rounded-app-2xl transition-colors"
              style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div className="text-left">
            <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wide">
              {editingFeedId ? (uiLanguage === "vi" ? "Đang sửa nguồn" : "Editing Feed") : (uiLanguage === "vi" ? "Thêm nguồn mới" : "Add New Feed")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={t.inputUrlPlaceholder}
                required
                className="text-xs px-4 py-3 rounded-app-xl focus:outline-none transition-all font-medium border"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "44px" }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t.inputTitlePlaceholder}
                className="text-xs px-4 py-3 rounded-app-xl focus:outline-none transition-all font-medium border"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "44px" }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newIncludeKeywords}
                onChange={(e) => setNewIncludeKeywords(e.target.value)}
                placeholder={uiLanguage === "vi" ? "Chỉ muốn nghe về (phân cách bằng dấu phẩy)..." : "Include Keywords (comma separated)..."}
                className="text-xs px-4 py-3 rounded-app-xl focus:outline-none transition-all font-medium border"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "44px" }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newExcludeKeywords}
                onChange={(e) => setNewExcludeKeywords(e.target.value)}
                placeholder={uiLanguage === "vi" ? "Không muốn nghe về (phân cách bằng dấu phẩy)..." : "Exclude Keywords (comma separated)..."}
                className="text-xs px-4 py-3 rounded-app-xl focus:outline-none transition-all font-medium border"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "44px" }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            {/* Category and Type selectors */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "Chủ đề:" : "Topic:"}
                </span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-[11px] px-3 py-2 rounded-app-lg focus:outline-none font-semibold cursor-pointer border transition-colors"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "40px" }}
                >
                  <option value="Thời sự">{uiLanguage === "vi" ? "📰 Thời sự" : "📰 General News"}</option>
                  <option value="Công nghệ">{uiLanguage === "vi" ? "💻 Công nghệ" : "💻 Tech"}</option>
                  <option value="Kinh tế">{uiLanguage === "vi" ? "📊 Kinh tế" : "📊 Finance"}</option>
                  <option value="Sức khỏe">{uiLanguage === "vi" ? "🌱 Sức khỏe" : "🌱 Health"}</option>
                  <option value="Giáo dục">{uiLanguage === "vi" ? "🎓 Giáo dục" : "🎓 Education"}</option>
                  <option value="Giải trí">{uiLanguage === "vi" ? "🎭 Giải trí" : "🎭 Entertainment"}</option>
                </select>
              </div>

              {/* Feed Type Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "Loại:" : "Style:"}
                </span>
                <select
                  value={newFeedType}
                  onChange={(e) => setNewFeedType(e.target.value as any)}
                  className="text-[11px] px-3 py-2 rounded-app-lg focus:outline-none font-semibold cursor-pointer border transition-colors"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "40px" }}
                >
                  <option value="news">{uiLanguage === "vi" ? "📰 Tin tức" : "📰 News"}</option>
                  <option value="podcast">{uiLanguage === "vi" ? "🎙️ Podcast" : "🎙️ Podcast"}</option>
                  <option value="blog">{uiLanguage === "vi" ? "✍️ Blog" : "✍️ Blog"}</option>
                </select>
              </div>

              {/* Feed Priority Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: colors.textMuted }}>
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{uiLanguage === "vi" ? "Ưu tiên:" : "Priority:"}</span>
                </span>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="text-[11px] px-3 py-2 rounded-app-lg focus:outline-none font-semibold cursor-pointer border transition-colors"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "40px" }}
                >
                  <option value="high">🔥 {uiLanguage === "vi" ? "Cao" : "High"}</option>
                  <option value="medium">⚡ {uiLanguage === "vi" ? "Trung bình" : "Medium"}</option>
                  <option value="low">💤 {uiLanguage === "vi" ? "Thấp" : "Low"}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {editingFeedId && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCancelEdit()}
                  className="h-10 px-4 transition-all"
                  style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary, borderColor: colors.border }}
                >
                  {t.btnCancelEdit}
                </Button>
              )}

              <Button
                type="submit"
                disabled={isTesting}
                size="sm"
                className="h-10 px-5 transition-all"
                style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
              >
                {isTesting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                    <span>{t.btnTesting}</span>
                  </>
                ) : (
                  <>
                    {editingFeedId ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                    <span>{editingFeedId ? t.btnUpdate : t.btnAdd}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Errors / Success feedback */}
          {errorMsg && (
            <div className="rounded-app-xl p-3 flex gap-3 items-start text-xs font-medium border transition-colors"
                 style={{ backgroundColor: `${colors.critical}0d`, borderColor: `${colors.critical}33`, color: colors.critical }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-left">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="rounded-app-xl p-3 flex gap-3 items-start text-xs font-medium border transition-colors"
                 style={{ backgroundColor: `${colors.success}0d`, borderColor: `${colors.success}33`, color: colors.success }}>
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-left">{successMsg}</span>
            </div>
          )}
        </form>

        {/* Recommended VN Presets */}
        <div className="space-y-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: colors.textMuted }}>
            💡 {t.presetsHeader}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {rssPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-[10px] font-bold px-3.5 py-2 rounded-app-lg border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "36px" }}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Subscribed Feeds List */}
        <div className="space-y-4 border-t pt-5 text-left" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
              <BookOpen className="w-4 h-4" style={{ color: colors.interactive }} />
              <span>{t.rssListHeader} ({feeds.length})</span>
            </h4>
            
            {/* OPML import & export buttons */}
            <div className="flex items-center gap-2.5">
              <label className="px-3.5 py-2 text-[10px] font-bold border rounded-app-lg flex items-center gap-2 cursor-pointer transition-all select-none hover:bg-opacity-80 active:scale-95"
                     style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "36px" }}>
                <Upload className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
                <span>{uiLanguage === "vi" ? "Nhập OPML" : "Import OPML"}</span>
                <input
                  type="file"
                  accept=".xml,.opml"
                  onChange={handleOPMLImport}
                  className="hidden"
                />
              </label>
              
              {feeds.length > 0 && (
                <button
                  type="button"
                  onClick={handleOPMLExport}
                  className="px-3.5 py-2 text-[10px] font-bold border rounded-app-lg flex items-center gap-2 transition-all cursor-pointer hover:bg-opacity-80 active:scale-95"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "36px" }}
                  title={uiLanguage === "vi" ? "Xuất danh mục nguồn ra file OPML" : "Export active list to OPML"}
                >
                  <Download className="w-3.5 h-3.5" style={{ color: colors.success }} />
                  <span>{uiLanguage === "vi" ? "Xuất OPML" : "Export OPML"}</span>
                </button>
              )}
            </div>
          </div>

          {feeds.length === 0 ? (
            <p className="text-xs italic text-center py-8 border border-dashed rounded-app-xl transition-colors"
               style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textMuted }}>
              {t.emptyList}
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {feeds.map((feed) => {
                const health = feed.healthStatus || "healthy";
                const fetchSuccessRate = feed.fetchCount && feed.fetchCount > 0 
                  ? Math.round(((feed.successCount || 0) / feed.fetchCount) * 100) 
                  : null;

                const isEditing = editingFeedId === feed.id;

                return (
                  <div 
                    key={feed.id}
                    className={cn(
                      "p-4 rounded-app-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-all text-left"
                    )}
                    style={{ 
                      backgroundColor: isEditing ? `${colors.interactive}0d` : colors.surface, 
                      borderColor: isEditing ? colors.interactive : colors.border 
                    }}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category badge */}
                        <Badge variant="warning" className="text-[9px] font-extrabold px-1.5 py-0.5 uppercase tracking-wider">
                          {feed.category}
                        </Badge>

                        {/* Style/Type badge */}
                        {feed.feedType && (
                          <Badge variant="secondary" className="text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase">
                            {feed.feedType}
                          </Badge>
                        )}

                        {/* Priority badge */}
                        <Badge 
                          variant={feed.priority === "high" ? "danger" : feed.priority === "low" ? "secondary" : "outline"}
                          className="text-[9px] font-bold px-1.5 py-0.5 uppercase flex items-center gap-0.5"
                        >
                          {feed.priority === "high" ? "🔥 Cao" : feed.priority === "low" ? "💤 Thấp" : "⚡ TB"}
                        </Badge>

                        {/* Health indicator */}
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1.5 transition-colors"
                          )}
                          style={{
                            color: health === "healthy" ? colors.success : health === "unstable" ? colors.warning : colors.critical,
                            borderColor: health === "healthy" ? `${colors.success}33` : health === "unstable" ? `${colors.warning}33` : `${colors.critical}33`,
                            backgroundColor: health === "healthy" ? `${colors.success}0d` : health === "unstable" ? `${colors.warning}0d` : `${colors.critical}0d`
                          }}
                        >
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            health === "healthy" ? "animate-pulse" : ""
                          )} style={{
                            backgroundColor: health === "healthy" ? colors.success : health === "unstable" ? colors.warning : colors.critical
                          }} />
                          <span className="capitalize">{health === "healthy" ? (uiLanguage === "vi" ? "Khỏe" : "Healthy") : health === "unstable" ? (uiLanguage === "vi" ? "Chập chờn" : "Unstable") : (uiLanguage === "vi" ? "Lỗi" : "Error")}</span>
                        </Badge>
                      </div>

                      <h5 className="text-xs font-bold truncate" style={{ color: colors.textPrimary }}>
                        {feed.title}
                      </h5>
                      
                      <p className="text-[10px] truncate font-mono" style={{ color: colors.textMuted }}>
                        {feed.url}
                      </p>

                      {/* Speed & Sync counts stats bar */}
                      {(feed.fetchCount && feed.fetchCount > 0) ? (
                        <div className="flex items-center gap-3 pt-0.5 text-[9px] font-mono font-bold" style={{ color: colors.textMuted }}>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>{uiLanguage === "vi" ? `Tỉ lệ: ${fetchSuccessRate}% (${feed.successCount}/${feed.fetchCount})` : `Rate: ${fetchSuccessRate}% (${feed.successCount}/${feed.fetchCount})`}</span>
                          </span>
                          {feed.avgFetchDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{Math.round(feed.avgFetchDuration)}ms</span>
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(feed)}
                        className="p-2 rounded-app-lg transition-all border-0 hover:bg-opacity-80 flex items-center justify-center"
                        style={{ color: colors.textMuted, backgroundColor: colors.surfaceOverlay, minWidth: "36px", minHeight: "36px" }}
                        title="Edit feed info"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <a 
                        href={feed.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-app-lg transition-all flex items-center justify-center"
                        style={{ color: colors.textMuted, backgroundColor: colors.surfaceOverlay, minWidth: "36px", minHeight: "36px" }}
                        title="Open XML"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(feed.id)}
                        className="p-2 rounded-app-lg transition-all border-0 hover:bg-opacity-80 flex items-center justify-center"
                        style={{ color: colors.critical, backgroundColor: `${colors.critical}0d`, minWidth: "36px", minHeight: "36px" }}
                        title="Delete feed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Auto-Refresh Strategy & Manual Sync Buttons */}
        {feeds.length > 0 && (
          <div className="pt-4 border-t space-y-3" style={{ borderColor: colors.border }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-app-xl border text-[11px] transition-colors"
                 style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
              <div className="flex items-center gap-2 text-left font-bold" style={{ color: colors.textMuted }}>
                <Clock className="w-4 h-4" style={{ color: colors.interactive }} />
                <span>{uiLanguage === "vi" ? "Tự động làm mới:" : "Auto Refresh strategy:"}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {lastSyncedAt && (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-app-md border transition-colors"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }}>
                    Sync: {lastSyncedAt}
                  </span>
                )}
                
                <select
                  value={autoRefreshStrategy}
                  onChange={(e) => setAutoRefreshStrategy(e.target.value as any)}
                  className="rounded-app-md px-3 py-1.5 text-[11px] font-black cursor-pointer focus:outline-none border transition-colors"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "36px" }}
                >
                  <option value="manual">{uiLanguage === "vi" ? "⚡ Chỉ thủ công" : "⚡ Manual Only"}</option>
                  <option value="5m">{uiLanguage === "vi" ? "⏱️ Mỗi 5 phút" : "⏱️ Every 5 minutes"}</option>
                  <option value="15m">{uiLanguage === "vi" ? "⏱️ Mỗi 15 phút" : "⏱️ Every 15 minutes"}</option>
                  <option value="30m">{uiLanguage === "vi" ? "⏱️ Mỗi 30 phút" : "⏱️ Every 30 minutes"}</option>
                </select>
              </div>
            </div>

            {isFetchingArticles && fetchProgress && (
              <div className="mb-4 p-4 rounded-app-xl animate-pulse border transition-colors"
                   style={{ backgroundColor: `${colors.interactive}0d`, borderColor: `${colors.interactive}33` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.interactive }}>
                    {uiLanguage === "vi" ? "Đang đồng bộ nguồn tin..." : "Syncing feeds..."}
                  </span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: colors.interactive }}>
                    {fetchProgress.current}/{fetchProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                  <div 
                    className="h-full transition-all duration-300 ease-out"
                    style={{ backgroundColor: colors.interactive, width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] mt-2 truncate font-bold" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "Đang tải: " : "Loading: "}
                  <span className="font-black" style={{ color: colors.textPrimary }}>{fetchProgress.feedTitle}</span>
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleManualRefresh(false)}
                disabled={isFetchingArticles}
                className="flex-1"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isFetchingArticles && "animate-spin")} />
                <span>{t.btnFetchSummary}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleManualRefresh(true)}
                disabled={isFetchingArticles}
                className="flex-1"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isFetchingArticles && "animate-spin")} />
                <span>{t.btnFetchSummaryForce}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Consolidated Unified Article Reader Interface (RSSFeedList) */}
      {activeArticles.length > 0 && (
        <RSSFeedList
          articles={activeArticles}
          selectedArticles={selectedArticles}
          onToggleSelectArticle={handleToggleSelectArticle}
          onSelectAllArticles={handleSelectAllArticles}
          onClearSelection={handleClearSelection}
          onAddToDraft={onAddToDraft || (() => {})}
          onGenerateFromSelected={triggerBriefingGenerationSelected}
          uiLanguage={uiLanguage}
          isGenerating={isGenerating}
          onDeleteArticle={handleDeleteArticle}
          onClearAllArticles={handleClearAllArticles}
        />
      )}

      {/* 3. Direct Full Synthesis helper if no articles selected but articles loaded */}
      {activeArticles.length > 0 && selectedArticles.length === 0 && (
        <Card className="text-left space-y-4 animate-fade-in shadow-app-md" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.interactive }}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{uiLanguage === "vi" ? "Tự động phát thanh" : "Smart Broadcast Suite"}</span>
            </span>
          </div>
          
          <div className="space-y-2">
            <p className="text-[11px] leading-normal font-medium" style={{ color: colors.textSecondary }}>
              {uiLanguage === "vi" 
                ? `Hệ thống đã đồng bộ được ${activeArticles.length} bài viết mới từ các nguồn tin của bạn. Chọn phương thức tạo bản tin phù hợp dưới đây:` 
                : `Successfully aggregated ${activeArticles.length} active articles. Select your preferred broadcast method below:`}
            </p>
            
            {/* OPTION 1: FULL BRIEFING */}
            <div className="p-3 rounded-app-xl border space-y-2 text-left" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                {uiLanguage === "vi" ? "Lựa chọn 1: Toàn bộ nguồn tin" : "Option 1: Complete feeds"}
              </span>
              <p className="text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
                {uiLanguage === "vi"
                   ? "Tóm tắt và nghe toàn bộ tất cả các bài viết đã đồng bộ (phù hợp khi số lượng tin vừa phải)."
                   : "Summarize and generate voice for all synchronized articles (best for normal volumes)."}
              </p>
              <Button
                type="button"
                onClick={() => triggerBriefingGenerationAll()}
                disabled={isGenerating}
                className="w-full transition-all"
                style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>{uiLanguage === "vi" ? "Tạo bản tin toàn bộ nguồn tin RSS" : "Generate Broadcast from All RSS Feeds"}</span>
              </Button>
            </div>

            {/* OPTION 2: LATEST BRIEF BRIEFING (CUSTOM FEEDS) */}
            <div className="p-3 rounded-app-xl border space-y-3 text-left" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.success }}>
                {uiLanguage === "vi" ? "Lựa chọn 2: Bản tin vắn tắt mới nhất (Khuyên Dùng)" : "Option 2: Latest Short Briefing (Recommended)"}
              </span>
              <p className="text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
                {uiLanguage === "vi"
                  ? "Chỉ tóm tắt số lượng tin tức mới nhất theo cấu hình lọc bên dưới để tránh quá tải TTS và ngốn hạn ngạch."
                  : "Filter and summarize only a fixed number of recent articles to stay within TTS rate limits."}
              </p>

              {/* Controls inside option 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                <div className="space-y-1">
                  <label className="font-medium text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    {uiLanguage === "vi" ? "Số lượng tin tối đa:" : "Max articles:"}
                  </label>
                  <select
                    value={briefCount}
                    onChange={(e) => setBriefCount(Number(e.target.value))}
                    className="w-full rounded-app-lg px-2 py-1.5 text-xs focus:outline-none cursor-pointer font-bold border transition-colors"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "36px" }}
                  >
                    <option value={3}>3 {uiLanguage === "vi" ? "bài viết mới" : "news items"}</option>
                    <option value={5}>5 {uiLanguage === "vi" ? "bài viết mới" : "news items"}</option>
                    <option value={10}>10 {uiLanguage === "vi" ? "bài viết mới" : "news items"}</option>
                    <option value={15}>15 {uiLanguage === "vi" ? "bài viết mới" : "news items"}</option>
                    <option value={20}>20 {uiLanguage === "vi" ? "bài viết mới" : "news items"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    {uiLanguage === "vi" ? "Lọc thời gian:" : "Timeframe:"}
                  </label>
                  <select
                    value={briefDateType}
                    onChange={(e) => setBriefDateType(e.target.value as any)}
                    className="w-full rounded-app-lg px-2 py-1.5 text-xs focus:outline-none cursor-pointer font-bold border transition-colors"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "36px" }}
                  >
                    <option value="all">{uiLanguage === "vi" ? "Tất cả các tin" : "All articles"}</option>
                    <option value="today">{uiLanguage === "vi" ? "Hôm nay" : "Today"}</option>
                    <option value="range">{uiLanguage === "vi" ? "Chọn khoảng ngày..." : "Date range..."}</option>
                  </select>
                </div>
              </div>

              {/* Date pickers */}
              {briefDateType === "range" && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t" style={{ borderColor: colors.border }}>
                  <div className="space-y-1 text-left">
                    <label className="font-medium text-[9px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                      {uiLanguage === "vi" ? "Từ ngày:" : "From:"}
                    </label>
                    <input
                      type="date"
                      value={briefStartDate}
                      onChange={(e) => setBriefStartDate(e.target.value)}
                      className="w-full rounded-app-lg px-2 py-1 text-xs focus:outline-none border transition-colors"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "32px" }}
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="font-medium text-[9px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                      {uiLanguage === "vi" ? "Đến ngày:" : "To:"}
                    </label>
                    <input
                      type="date"
                      value={briefEndDate}
                      onChange={(e) => setBriefEndDate(e.target.value)}
                      className="w-full rounded-app-lg px-2 py-1 text-xs focus:outline-none border transition-colors"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, minHeight: "32px" }}
                    />
                  </div>
                </div>
              )}

              {/* Inline warning or confirmation banner */}
              {rssNotification && (
                <div className={cn(
                  "p-3.5 rounded-app-xl border flex flex-col gap-2.5 text-xs transition-colors"
                )}
                style={{
                  backgroundColor: rssNotification.type === 'confirm' ? `${colors.interactive}0d` : `${colors.warning}0d`,
                  borderColor: rssNotification.type === 'confirm' ? `${colors.interactive}33` : `${colors.warning}33`,
                  color: rssNotification.type === 'confirm' ? colors.interactive : colors.warning
                }}>
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-medium leading-relaxed flex-1" style={{ color: colors.textPrimary }}>{rssNotification.message}</p>
                  </div>
                  {rssNotification.type === 'confirm' ? (
                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRssNotification(null)}
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      >
                        {uiLanguage === "vi" ? "Huỷ" : "Cancel"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (rssNotification.action) {
                            rssNotification.action();
                          }
                        }}
                        style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
                      >
                        {uiLanguage === "vi" ? "Tạo" : "Create"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-0.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRssNotification(null)}
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      >
                        {uiLanguage === "vi" ? "Đóng" : "Dismiss"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="button"
                onClick={() => triggerBriefingGenerationBrief(false)}
                disabled={isGenerating}
                className="w-full transition-all"
                style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>{uiLanguage === "vi" ? "Tạo bản tin vắn tắt mới nhất từ nguồn tin RSS" : "Generate Custom Brief from RSS"}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
