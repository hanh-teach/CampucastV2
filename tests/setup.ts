import { vi } from 'vitest';
import * as React from 'react';
import { act as esmAct } from 'react';

// Mutate the CommonJS react module to use the native React 19 ESM act
try {
  const commonJSReact = require('react');
  if (typeof commonJSReact.act !== 'function') {
    commonJSReact.act = esmAct || ((cb: any) => cb());
  }
} catch (e) {
  // Fallback if require is not available in some environment
}

// Ensure IS_REACT_ACT_ENVIRONMENT is set
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Inject React into global scope
(globalThis as any).React = React;

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Inject React into global scope

// Mock global fetch for tests
global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
  json: () => Promise.resolve([]),
  ok: true,
  status: 200,
  headers: { get: () => "application/json" }
}));
