/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveRSSFeed, getRSSFeeds } from '../src/services/storageService';
import { fetchRSSArticles } from '../src/services/rssService';
import { RSSFeed } from '../src/types';

// Let's mock storageService since it uses IndexedDB
vi.mock('../src/services/storageService', () => {
  let mockFeeds: RSSFeed[] = [];
  return {
    saveRSSFeed: vi.fn(async (feed: RSSFeed) => {
      mockFeeds.push(feed);
      return Promise.resolve();
    }),
    getRSSFeeds: vi.fn(async () => {
      return Promise.resolve(mockFeeds);
    }),
    deleteRSSFeed: vi.fn(async (id: string) => {
      mockFeeds = mockFeeds.filter(f => f.id !== id);
      return Promise.resolve();
    })
  };
});

vi.mock('../src/services/telemetryService', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

describe('Assets Tab RSS Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('should reflect an added RSS feed in the collection and feed into fetchRSSArticles', async () => {
    // 1. Simulate adding a custom RSS source from the Assets Tab view
    const newFeed: RSSFeed = {
      id: 'test-assets-feed',
      url: 'https://vietnamnet.vn/rss/tin-noi-bat.rss',
      title: 'VietnamNet Hot News',
      category: 'Thời sự',
      priority: 'high',
      feedType: 'news',
      addedAt: new Date().toISOString()
    };

    // Save the new feed
    await saveRSSFeed(newFeed);
    expect(saveRSSFeed).toHaveBeenCalledWith(newFeed);

    // 2. Retrieve all feeds to verify it exists
    const feeds = await getRSSFeeds();
    expect(feeds).toContainEqual(newFeed);

    // 3. Mock the server proxy response for this specific feed URL
    const mockArticles = [
      { title: 'AI Automation in Vietnam', content: 'Details about AI progress.', link: 'https://vietnamnet.vn/ai-automation' }
    ];
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ articles: mockArticles, title: 'VietnamNet Hot News' }),
    });

    const getApiUrl = (p: string) => `https://api.com${p}`;

    // 4. Run fetchRSSArticles on the feeds returned by storage
    const articles = await fetchRSSArticles(feeds, getApiUrl);

    // Check that the request hit the proxy endpoint with our saved feed URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('https://vietnamnet.vn/rss/tin-noi-bat.rss'))
    );

    // Verify that the articles were parsed and returned correctly
    expect(articles.length).toBe(1);
    expect(articles[0].title).toBe('AI Automation in Vietnam');
    expect(articles[0].feedTitle).toBe('VietnamNet Hot News');
  });
});
