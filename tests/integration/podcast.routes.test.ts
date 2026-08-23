// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Connect to the real local server
const app = 'http://127.0.0.1:3000';

describe('Podcast Routes Integration (Safety Net)', () => {
  const testBriefId = `test-brief-${Date.now()}`;
  
  // A small valid MP3 header (ID3 tag) to pass isMp3Buffer check
  const mockMp3Base64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZTU4LjkxLjEwMAAAAAAAAAAAAAAA';

  it('should publish a new podcast episode successfully', async () => {
    const publishRes = await request(app)
      .post('/api/podcast/publish')
      .send({
        briefId: testBriefId,
        briefing: {
          audioChunks: [mockMp3Base64],
          timestamp: new Date().toISOString(),
          payload: {
            title: 'Test Integration Episode',
            introduction: 'This is a test introduction for the integration safety net.'
          }
        }
      });
      
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.success).toBe(true);
    expect(publishRes.body.audioUrl).toBeDefined();
    // It should either be a supabase URL or a local URL
    expect(publishRes.body.audioUrl).toMatch(/supabase\.co|podcast-audio|local-podcasts/);
  }, 20000);

  it('should verify the episode exists in the episodes list', async () => {
    const episodesRes = await request(app)
      .get('/api/podcast/episodes')
      .query({ refresh: 'true' });
      
    expect(episodesRes.status).toBe(200);
    expect(Array.isArray(episodesRes.body)).toBe(true);
    
    const episode = episodesRes.body.find((ep: any) => ep.id === testBriefId);
    expect(episode).toBeDefined();
    expect(episode.title).toBe('Test Integration Episode');
  }, 30000);

  it('should verify the episode is present in the RSS feed', async () => {
    const feedRes = await request(app)
      .get('/api/podcast/feed');
      
    expect(feedRes.status).toBe(200);
    expect(feedRes.header['content-type']).toContain('application/xml');
    
    const xmlContent = feedRes.text;
    expect(xmlContent).toContain('<title>Test Integration Episode</title>');
  }, 30000);

  it('should cleanup the test episode', async () => {
    const deleteRes = await request(app)
      .delete(`/api/podcast/episodes/${testBriefId}`);
      
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    
    // Verify it's gone
    const episodesRes = await request(app)
      .get('/api/podcast/episodes')
      .query({ refresh: 'true' });
    
    const episode = episodesRes.body.find((ep: any) => ep.id === testBriefId);
    expect(episode).toBeUndefined();
  }, 30000);
});
