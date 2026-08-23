/**
 * @vitest-environment jsdom
 */
/**
 * useSync Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useSync } from '../src/hooks/useSync';
import * as syncService from '../src/services/syncService';
import * as React from 'react';

// Centralized mock for supabaseClient
vi.mock('../src/services/supabaseClient', () => ({
  getSupabaseClientAsync: vi.fn().mockResolvedValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: 'test@example.com' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    }
  }),
}));

vi.mock('../src/services/syncService', () => ({
  performFullSyncAsync: vi.fn().mockResolvedValue(true),
  processSyncQueueAsync: vi.fn().mockResolvedValue(true),
  isOnline: vi.fn().mockReturnValue(true),
  abortSync: vi.fn().mockReturnValue(true),
  getSyncQueue: vi.fn().mockResolvedValue([]),
}));

describe('useSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to online
    (syncService.isOnline as any).mockReturnValue(true);
  });

  it('should initialize with correct default state', async () => {
    const { result } = await renderHook(() => useSync());
    
    // It starts with loading=true and unauthenticated
    expect(result.current.syncStatus).toBe('unauthenticated');
    expect(result.current.loading).toBe(true);
  });

  it('should handle offline status when triggerSync is called', async () => {
    (syncService.isOnline as any).mockReturnValue(false);
    const { result } = await renderHook(() => useSync());
    
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(result.current.syncStatus).toBe('offline');
  });

  it('should set synced status when sync succeeds', async () => {
    (syncService.performFullSyncAsync as any).mockResolvedValue(true);
    const { result } = await renderHook(() => useSync());
    
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(result.current.syncStatus).toBe('synced');
    expect(syncService.performFullSyncAsync).toHaveBeenCalled();
  });

  it('should handle sync errors gracefully', async () => {
    (syncService.performFullSyncAsync as any).mockRejectedValue(new Error('Sync failed'));
    const { result } = await renderHook(() => useSync());
    
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(result.current.syncStatus).toBe('error');
  });

  it('should update queue length correctly', async () => {
    const mockQueue = [{ id: 1 }, { id: 2 }];
    (syncService.getSyncQueue as any).mockResolvedValue(mockQueue);
    
    const { result } = await renderHook(() => useSync());
    
    await act(async () => {
      await result.current.updateQueueLength();
    });

    expect(result.current.queueLength).toBe(2);
  });

  it('should transition to syncing state during sync', async () => {
    let resolveSync: (val: boolean) => void;
    const syncPromise = new Promise<boolean>((resolve) => {
      resolveSync = resolve;
    });
    
    (syncService.performFullSyncAsync as any).mockReturnValue(syncPromise);
    const { result } = await renderHook(() => useSync());
    
    let triggerPromise: Promise<any>;
    await act(async () => {
      triggerPromise = result.current.triggerSync();
    });

    expect(result.current.syncStatus).toBe('syncing');

    await act(async () => {
      resolveSync!(true);
      await triggerPromise!;
    });

    expect(result.current.syncStatus).toBe('synced');
  });

  it('should allow retrying after an error', async () => {
    (syncService.performFullSyncAsync as any)
      .mockRejectedValueOnce(new Error('First fail'))
      .mockResolvedValueOnce(true);
      
    const { result } = await renderHook(() => useSync());
    
    // First attempt
    await act(async () => {
      await result.current.triggerSync();
    });
    expect(result.current.syncStatus).toBe('error');

    // Retry attempt
    await act(async () => {
      await result.current.triggerSync();
    });
    expect(result.current.syncStatus).toBe('synced');
  });

  it('should handle manual abort when syncing', async () => {
    vi.stubGlobal('alert', vi.fn());

    const { result } = await renderHook(() => useSync());
    
    await act(async () => {
      result.current.abortSync();
    });
    expect(global.alert).toHaveBeenCalled();
  });
});

