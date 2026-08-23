// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';

const app = 'http://127.0.0.1:3000';

describe('News Routes Integration (Safety Net)', () => {
  it('should parse a real RSS feed (VnExpress)', async () => {
    const vnExpressUrl = 'https://vnexpress.net/rss/tin-moi-nhat.rss';
    const res = await request(app)
      .get('/api/parse-rss')
      .query({ url: vnExpressUrl });
    
    expect(res.status).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articles.length).toBeGreaterThan(0);
    
    // Check article structure
    const firstArticle = res.body.articles[0];
    expect(firstArticle.title).toBeDefined();
    expect(firstArticle.link).toBeDefined();
    expect(firstArticle.content).toBeDefined();
  }, 30000);

  it('should generate news using AI (Gemini/Groq)', async () => {
    const res = await request(app)
      .post('/api/generate-news')
      .send({
        category: 'Công nghệ',
        language: 'vi',
        aiMode: 'Professional'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.newsText).toBeDefined();
    expect(typeof res.body.newsText).toBe('string');
    expect(res.body.newsText.length).toBeGreaterThan(100);
  }, 60000);

  it('should handle invalid RSS URLs gracefully', async () => {
    const invalidUrl = 'https://this-is-not-a-real-url-at-all.com/rss.xml';
    const res = await request(app)
      .get('/api/parse-rss')
      .query({ url: invalidUrl });
    
    // The server should return 200 with AI synthesized content or 500 with error
    // In our implementation, it tries AI fallback.
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.error || res.body.articles).toBeDefined();
    } else {
      expect(res.body.error).toBeDefined();
    }
  }, 60000);
});
