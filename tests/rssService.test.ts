/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  detectCategoryFromKeywords, 
  calculateJaccardSimilarity, 
  detectAndMarkDuplicates, 
  fetchRSSArticles,
  containsExcludedKeywords,
  filterArticlesByUserKeywords,
  isArticleFresh
} from '../src/services/rssService';

// Mock dependencies
vi.mock('../src/services/storageService', () => ({
  saveRSSFeed: vi.fn().mockResolvedValue(true),
}));

vi.mock('../src/services/telemetryService', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

describe('rssService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });
    vi.stubGlobal('navigator', { onLine: true });
  });

  describe('detectCategoryFromKeywords', () => {
    it('should detect technology category', () => {
      expect(detectCategoryFromKeywords('Smartphone mới', 'Sử dụng công nghệ AI')).toBe('Công nghệ');
    });

    it('should detect education category', () => {
      expect(detectCategoryFromKeywords('Tuyển sinh đại học', 'Giáo dục đào tạo')).toBe('Giáo dục');
    });

    it('should default to News (Thời sự)', () => {
      expect(detectCategoryFromKeywords('Bình minh', 'Nắng ấm')).toBe('Thời sự');
    });
  });

  describe('calculateJaccardSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateJaccardSimilarity('Hello world', 'Hello world')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(calculateJaccardSimilarity('Apple', 'Banana')).toBe(0);
    });

    it('should handle similarity correctly', () => {
      // str1: "today is a sunny day" -> {today, is, sunny, day} (size 4)
      // str2: "today is a rainy day" -> {today, is, rainy, day} (size 4)
      // Intersection: {today, is, day} = 3
      // Union: {today, is, sunny, rainy, day} = 5
      // Jaccard: 3/5 = 0.6
      expect(calculateJaccardSimilarity('Today is a sunny day', 'Today is a rainy day')).toBe(0.6);
    });
  });

  describe('containsExcludedKeywords', () => {
    it('should return true for sponsored content', () => {
      expect(containsExcludedKeywords('Sponsored post', 'Buy this now')).toBe(true);
    });

    it('should return false for regular content', () => {
      expect(containsExcludedKeywords('Breaking news', 'Something happened')).toBe(false);
    });
  });

  describe('filterArticlesByUserKeywords', () => {
    const articles = [
      { title: 'Tech news', content: 'AI is great' } as any,
      { title: 'Sports news', content: 'Football is fun' } as any,
      { title: 'Politics', content: 'Election is coming' } as any,
    ];

    it('should filter by include keywords', () => {
      const result = filterArticlesByUserKeywords(articles, ['Tech'], []);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Tech news');
    });

    it('should filter by exclude keywords', () => {
      const result = filterArticlesByUserKeywords(articles, [], ['Politics']);
      expect(result.length).toBe(2);
      expect(result.find(a => a.title === 'Politics')).toBeUndefined();
    });

    it('should handle both', () => {
      const result = filterArticlesByUserKeywords(articles, ['Tech', 'Sports'], ['Football']);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Tech news');
    });
  });

  describe('isArticleFresh', () => {
    it('should return true for fresh article', () => {
      const art = { pubDate: new Date().toISOString() } as any;
      expect(isArticleFresh(art, 24)).toBe(true);
    });

    it('should return false for old article', () => {
      const oldDate = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
      const art = { pubDate: oldDate } as any;
      expect(isArticleFresh(art, 24)).toBe(false);
    });
  });

  describe('detectAndMarkDuplicates', () => {
    it('should mark duplicates with high similarity', () => {
      const articles = [
        { id: '1', title: 'Breaking News: AI takes over the world', pubDate: '2023-01-01T10:00:00Z', link: 'link1', feedPriority: 'high' } as any,
        { id: '2', title: 'Breaking News: AI takes over the world', pubDate: '2023-01-01T11:00:00Z', link: 'link2', feedPriority: 'low' } as any,
      ];
      const result = detectAndMarkDuplicates(articles);
      expect(result[0].isDuplicate).toBe(false);
      expect(result[1].isDuplicate).toBe(true);
    });
    
    it('should not mark as duplicate if time window is > 24 hours', () => {
        const articles = [
          { id: '1', title: 'Same Title', pubDate: '2023-01-01T10:00:00Z', link: 'link1', feedPriority: 'high' } as any,
          { id: '2', title: 'Same Title', pubDate: '2023-01-03T10:00:00Z', link: 'link2', feedPriority: 'high' } as any,
        ];
        const result = detectAndMarkDuplicates(articles);
        expect(result[0].isDuplicate).toBe(false);
        expect(result[1].isDuplicate).toBe(false);
      });
  });

  describe('fetchRSSArticles', () => {
    const feeds = [{ id: 'f1', url: 'https://example.com/rss', title: 'Feed 1', priority: 'medium' }] as any;
    const getApiUrl = (p: string) => `https://api.com${p}`;

    it('should fetch articles successfully', async () => {
      localStorage.clear();
      const mockArticles = [{ title: 'Art 1', content: 'Content 1', link: 'l1' }];
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ articles: mockArticles, title: 'Mock Feed' }),
      });

      const result = await fetchRSSArticles(feeds, getApiUrl);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Art 1');
      expect(result[0].feedTitle).toBe('Mock Feed');
    });

    it('should handle network error gracefully', async () => {
      localStorage.clear();
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await fetchRSSArticles(feeds, getApiUrl);
      expect(result).toEqual([]);
    });

    it('should handle non-JSON response', async () => {
      localStorage.clear();
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await fetchRSSArticles(feeds, getApiUrl);
      expect(result).toEqual([]);
    });

    it('should handle HTTP error', async () => {
        localStorage.clear();
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });
  
        const result = await fetchRSSArticles(feeds, getApiUrl);
        expect(result).toEqual([]);
      });
  });
});
