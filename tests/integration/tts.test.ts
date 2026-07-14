// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Target the real development server
const app = 'http://127.0.0.1:3000';

describe('TTS Enterprise Integration Lifecycle', () => {
  const testPayload = {
    text: "Chào buổi sáng CommuteCast, đây là bản tin thử nghiệm tích hợp.",
    voice: "vi-HN",
    tone: "conversational"
  };

  it('Step 1: Generate initial TTS audio', async () => {
    const res = await request(app)
      .post('/api/tts')
      .send(testPayload);
    
    expect(res.status).toBe(200);
    expect(res.body.base64Audio).toBeDefined();
    // Accept either fresh or cached for the first run
    expect(['hybrid-smart-tts', 'cache']).toContain(res.body.engine);
    console.log(`[Test] Step 1 PASS: Audio returned via ${res.body.engine}.`);
  }, 30000);

  it('Step 2: Check cache status and verify file persistence', async () => {
    const res = await request(app).get('/api/tts/cache-status');
    expect(res.status).toBe(200);
    expect(res.body.fileCount).toBeGreaterThan(0);
    console.log(`[Test] Step 2 PASS: Cache contains ${res.body.fileCount} files.`);
  });

  it('Step 3: Clear cache and verify total purge', async () => {
    const clearRes = await request(app).post('/api/tts/clear-cache');
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.success).toBe(true);

    const statusRes = await request(app).get('/api/tts/cache-status');
    expect(statusRes.body.fileCount).toBe(0);
    console.log('[Test] Step 3 PASS: Cache successfully purged.');
  });

  it('Step 4: Re-generate and verify CACHE MISS (Fresh Synthesis)', async () => {
    const res = await request(app)
      .post('/api/tts')
      .send(testPayload);
    
    expect(res.status).toBe(200);
    // After clearing, this MUST be a fresh synthesis
    expect(res.body.engine).toBe('hybrid-smart-tts');
    
    const statusRes = await request(app).get('/api/tts/cache-status');
    expect(statusRes.body.fileCount).toBeGreaterThan(0);
    console.log('[Test] Step 4 PASS: Verified cache miss and fresh synthesis after purge.');
  }, 30000);
});
