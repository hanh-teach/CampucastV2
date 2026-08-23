// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';

const app = 'http://127.0.0.1:3000';

describe('TTS Routes Integration', () => {
  it('should return cache status', async () => {
    const res = await request(app).get('/api/tts/cache-status');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBeDefined();
  }, 30000);

  it('should clear cache', async () => {
    const res = await request(app).post('/api/tts/clear-cache');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  }, 30000);

  it('should generate TTS audio', async () => {
    const res = await request(app)
      .post('/api/tts')
      .send({
        text: 'Test TTS extraction',
        voice: 'en-US',
        tone: 'normal'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.base64Audio).toBeDefined();
    expect(res.body.engine).toBeDefined();
  }, 30000);

  it('should run test-tts endpoint', async () => {
    const res = await request(app)
      .post('/api/test-tts')
      .send({
        text: 'Hello test',
        voice: 'en-US'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.base64Audio).toBeDefined();
  }, 30000);
});
