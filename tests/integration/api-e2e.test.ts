// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Connect to the real local server
const app = 'http://127.0.0.1:3000';

describe('End-to-End API Flow (No Mocks)', () => {
  it('should parse RSS, summarize, and generate TTS successfully', async () => {
    // 1. Parse RSS
    const rssRes = await request(app)
      .get('/api/parse-rss')
      .query({ url: 'https://vnexpress.net/rss/tin-mo-nhat.rss' });
      
    expect(rssRes.status).toBe(200);
    expect(rssRes.body.title).toBeDefined();
    expect(rssRes.body.articles).toBeInstanceOf(Array);
    expect(rssRes.body.articles.length).toBeGreaterThan(0);
    
    // Step output
    const articles = rssRes.body.articles.slice(0, 1);
    
    // Construct summarize input exactly like real client
    const formattedContent = articles.map((art: any, i: number) => `Article #${i+1}: ${art.title}\n${art.description}`).join('\n\n');
    
    // 2. Summarize
    const summarizeRes = await request(app)
      .post('/api/summarize')
      .send({
        content: formattedContent,
        preferences: {
          language: 'vi',
          targetDuration: 'short',
          tone: 'conversational',
          focus: 'general overview',
          commuteType: 'driving',
          customInstructions: 'Make it very short for testing. Sẽ có intro, 1 chapter và 1 conclusion.',
          aiMode: 'rewrite'
        }
      });
      
    expect(summarizeRes.status).toBe(200);
    expect(summarizeRes.body.title).toBeDefined();
    expect(summarizeRes.body.introduction).toBeDefined();
    expect(summarizeRes.body.chapters).toBeInstanceOf(Array);
    
    // Use the intro from summarize output as input for TTS
    const scriptText = summarizeRes.body.introduction || 'Đây là bản tin thử nghiệm.';
    
    // 3. TTS
    const ttsRes = await request(app)
      .post('/api/tts')
      .send({
        text: scriptText.slice(0, 50),
        voice: 'vi-VN-Wavenet-A',
        tone: 'conversational',
        emotion: 'neutral'
      });
      
    expect(ttsRes.status).toBe(200);
    expect(ttsRes.body.base64Audio).toBeDefined();
    expect(ttsRes.body.base64Audio.length).toBeGreaterThan(0);
  }, 30000);

  it('should return correct Vietnamese quota error message (429) for summarize', async () => {
    const resVi = await request(app)
      .post('/api/summarize')
      .send({
        content: "Test article",
        preferences: {
          language: 'vi',
          customInstructions: 'MOCK_QUOTA_ERROR'
        }
      });
      
    expect(resVi.status).toBe(500); 
    expect(resVi.body.error).toBeDefined();
    expect(resVi.body.error).toContain('Hệ thống đang quá tải');
    expect(resVi.body.error).toContain('Vui lòng thử lại');
  }, 10000);
  
  it('should return correct English quota error message (429) for summarize', async () => {
    const resEn = await request(app)
      .post('/api/summarize')
      .send({
        content: "Test article",
        preferences: {
          language: 'en',
          customInstructions: 'MOCK_QUOTA_ERROR'
        }
      });
      
    expect(resEn.status).toBe(500);
    expect(resEn.body.error).toBeDefined();
    expect(resEn.body.error).toContain('System is overloaded');
    expect(resEn.body.error).toContain('Please try again');
  }, 10000);
});
