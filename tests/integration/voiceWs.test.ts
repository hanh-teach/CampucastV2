// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import WebSocket from 'ws';

const serverUrl = 'http://127.0.0.1:3000';
const wsServerUrl = 'ws://127.0.0.1:3000';

describe('Voice WebSocket Connection Authorization', () => {
  it('should deny upgrade when connecting without any token (401 Unauthorized)', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${wsServerUrl}/ws/voice`, {
        handshakeTimeout: 5000,
      });

      ws.on('unexpected-response', (req, res) => {
        try {
          expect(res.statusCode).toBe(401);
          ws.close();
          resolve();
        } catch (e) {
          ws.close();
          reject(e);
        }
      });

      ws.on('open', () => {
        ws.close();
        reject(new Error('WebSocket connected without a valid token!'));
      });

      ws.on('error', () => {
        // Silent error callback
      });
    });
  });

  it('should deny upgrade when connecting with an invalid/forged token (401 Unauthorized)', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${wsServerUrl}/ws/voice?token=forgedtokenabc123`, {
        handshakeTimeout: 5000,
      });

      ws.on('unexpected-response', (req, res) => {
        try {
          expect(res.statusCode).toBe(401);
          ws.close();
          resolve();
        } catch (e) {
          ws.close();
          reject(e);
        }
      });

      ws.on('open', () => {
        ws.close();
        reject(new Error('WebSocket connected with a forged token!'));
      });

      ws.on('error', () => {
        // Silent error callback
      });
    });
  });

  it('should successfully authorize and upgrade when a valid token is provided', async () => {
    // 1. Generate a valid token first via POST /api/voice-token
    const tokenRes = await request(serverUrl)
      .post('/api/voice-token')
      .send();

    expect(tokenRes.status).toBe(200);
    const token = tokenRes.body.token;
    expect(token).toBeDefined();

    // 2. Try to connect to WebSocket with the valid token
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${wsServerUrl}/ws/voice?token=${token}`, {
        handshakeTimeout: 5000,
      });

      ws.on('open', () => {
        // Successfully connected! Handshake succeeded!
        ws.close();
        resolve();
      });

      ws.on('unexpected-response', (req, res) => {
        ws.close();
        reject(new Error(`WebSocket connection failed with status code: ${res.statusCode}`));
      });

      ws.on('error', (err) => {
        ws.close();
        reject(err);
      });
    });
  });
});
