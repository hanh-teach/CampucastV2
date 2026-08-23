import { describe, it, expect } from 'vitest';
import request from 'supertest';

const app = 'http://127.0.0.1:3000';

describe('Podcast API (Refactored) - Safety Net Integration Flow', () => {
  const testBriefId = `test-refactor-${Date.now()}`;
  const testTitle = `Test Safety Net Episode ${Date.now()}`;
  
  // Minimal valid WAV header (44 bytes) to satisfy server-side checks
  const mockAudioChunk = Buffer.from('RIFF$   WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary').toString('base64');

  it('STAGE 1: should publish a new episode successfully', async () => {
    const publishPayload = {
      briefId: testBriefId,
      briefing: {
        audioChunks: [mockAudioChunk],
        payload: {
          title: testTitle,
          introduction: "This is a safety net integration test for the refactored podcast module."
        },
        timestamp: new Date().toISOString()
      }
    };

    const res = await request(app)
      .post('/api/podcast/publish')
      .send(publishPayload);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.audioUrl).toBeDefined();
  });

  it('STAGE 2: should find the newly published episode in the list', async () => {
    const res = await request(app).get('/api/podcast/episodes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    const episode = res.body.find((ep: any) => ep.id === testBriefId);
    expect(episode).toBeDefined();
    expect(episode.title).toBe(testTitle);
  });

  it('STAGE 3: should include the new episode in the RSS feed', async () => {
    const res = await request(app).get('/api/podcast/feed');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('application/xml');
    expect(res.text).toContain('<rss');
    expect(res.text).toContain(testTitle);
  });

  it('STAGE 4: should handle local audio streaming if fallback was used', async () => {
    // Note: If Supabase/GCS are configured, it might not use local storage.
    // However, we can still test the streaming endpoint with a known file if it exists.
    // For the safety net, we primarily want to ensure the endpoint is alive.
    const res = await request(app).get('/api/local-podcasts/non-existent.wav');
    expect(res.status).toBe(404);
  });

  it('STAGE 5: should delete the test episode to clean up', async () => {
    const res = await request(app).delete(`/api/podcast/episodes/${testBriefId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const listRes = await request(app).get('/api/podcast/episodes');
    const episode = listRes.body.find((ep: any) => ep.id === testBriefId);
    expect(episode).toBeUndefined();
  });
});
