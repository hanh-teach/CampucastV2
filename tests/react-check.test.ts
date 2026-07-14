/**
 * @vitest-environment jsdom
 */
import { it, expect } from 'vitest';
import * as React from 'react';

it('React should have act', () => {
  console.log('React version in test (jsdom):', React.version);
  console.log('React.act:', typeof (React as any).act);
  expect(typeof (React as any).act).toBe('function');
});
