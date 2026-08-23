/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/App';
import { UserPreferencesProvider } from '../../src/components/UserPreferencesProvider';
import { ThemeProvider } from '../../src/components/ThemeProvider';
import { AdaptiveProvider } from '../../src/layouts/AdaptiveContext';

// Mock matchMedia for AdaptiveProvider
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Real Briefing Flow A (UI -> useBriefingGeneration)', () => {
  let globalFetchMock: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock fetch for the API calls
    globalFetchMock = vi.fn((url: string, options: any) => {
      if (url.includes('/api/db-config')) {
        return Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve({
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-key'
          }),
          text: () => Promise.resolve(JSON.stringify({
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-key'
          }))
        });
      }
      if (url.includes('/api/summarize')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'summary-123',
            title: 'Test Briefing Title',
            introduction: 'Xin chào quý thính giả đến với CommuteCast Enterprise.',
            briefingDate: new Date().toISOString(),
            chapters: [
              {
                topic: 'Tin tức công nghệ',
                scriptText: 'Hôm nay chúng ta có tin tức về trí tuệ nhân tạo.'
              }
            ],
            conclusion: 'Cảm ơn quý thính giả đã lắng nghe.'
          })
        });
      }
      if (url.includes('/api/tts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            audioChunks: ['base64audio'],
            durationMs: 2000,
            phonemeMarks: []
          }),
          text: () => Promise.resolve(""),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        });
      }
      if (url.includes('/api/generate-news')) {
         return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                newsContent: 'Generated test news'
            })
         });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      });
    });
    global.fetch = globalFetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should run handleGenerateBriefing and process the state correctly', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn().mockReturnValue(true);

    render(
      <UserPreferencesProvider>
        <ThemeProvider>
          <AdaptiveProvider>
            <MemoryRouter>
              <App />
            </MemoryRouter>
          </AdaptiveProvider>
        </ThemeProvider>
      </UserPreferencesProvider>
    );

// Switch to Mission Tab
    const missionTabBtn = await screen.findByText(/Studio Nhiệm vụ/i);
    fireEvent.click(missionTabBtn);

    // Wait for the textarea to appear
    const textarea = await screen.findByPlaceholderText(/Dán nội dung tin tức/i);
    
    // Needs 50 chars to enable the button
    fireEvent.change(textarea, { target: { value: 'This is a long test content that exceeds the fifty character limit for generating a briefing so the button will be enabled.' } });

    const nextBtn = await screen.findByText(/Tiếp theo/i);
    fireEvent.click(nextBtn);

    // After clicking Next, it should call fetch for /api/summarize
    await waitFor(() => {
        expect(globalFetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/summarize'), expect.any(Object));
    }, { timeout: 4000 });

    // Transition from Stage 2 (Draft Editor) to Stage 3 (Voice Selector)
    const nextBtnStage2 = await screen.findByText(/Tiếp theo/i);
    fireEvent.click(nextBtnStage2);

    // Then click Thực thi sản xuất (now visible on Stage 3)
    const execBtn = await screen.findByText(/Thực thi sản xuất/i);
    fireEvent.click(execBtn);

    // It should also call /api/tts
    await waitFor(() => {
        expect(globalFetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/tts'), expect.any(Object));
    }, { timeout: 4000 });
  });
});