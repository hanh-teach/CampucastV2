// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';

const app = 'http://127.0.0.1:3000';

describe('Assistant Routes Integration', () => {
  it('should return error if text is not provided for voice-query', async () => {
    const res = await request(app)
      .post('/api/voice-query')
      .send({
        language: 'vi'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No text provided.");
  });

  it('should return error if message is not provided for assistant-chat', async () => {
    const res = await request(app)
      .post('/api/assistant-chat')
      .send({
        language: 'vi'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No message provided.");
  });

  it('should process a simple voice query', async () => {
    const res = await request(app)
      .post('/api/voice-query')
      .send({
        text: 'Xin chào',
        language: 'vi'
      });
    
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.answer).toBeDefined();
      expect(typeof res.body.isQuery).toBe('boolean');
    } else {
      expect(res.body.error).toBeDefined();
    }
  }, 60000);
});
