import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createTabSync } from '../utils/tabSync';
import { FakeBroadcastChannel } from './support/fakeBroadcastChannel';

const getSettings = vi.fn();
vi.mock('../../api/adminApis', () => ({ GetAdminSettings: () => getSettings() }));

import { DEFAULT_IDLE_MINUTES, idleMinutesFrom, useAdminIdleLogout, useIdleLogout } from '../admin/hooks/useAdminIdleLogout';

const MINUTE = 60_000;
const newSync = () =>
  createTabSync({ app: 'affinityecho', isSignedIn: () => true, logOutLocally: () => {} });

describe('admin idle sign-out', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    localStorage.clear();
    getSettings.mockReset();
  });

  afterEach(() => {
    FakeBroadcastChannel.reset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('signs out after the timeout with no activity in any tab', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(10 * MINUTE, onIdle, { sync: newSync() }));
    act(() => vi.advanceTimersByTime(10 * MINUTE - 1));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('stays signed in while another admin tab is in use', () => {
    const onIdle = vi.fn();
    const busyTab = newSync();
    renderHook(() => useIdleLogout(10 * MINUTE, onIdle, { sync: newSync() }));
    act(() => vi.advanceTimersByTime(8 * MINUTE));
    busyTab.shareActivity(Date.now());
    act(() => vi.advanceTimersByTime(8 * MINUTE));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2 * MINUTE));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('counts activity another tab stored while this tab was asleep', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(10 * MINUTE, onIdle, { sync: newSync() }));
    act(() => vi.advanceTimersByTime(9 * MINUTE));
    localStorage.setItem('affinityecho-last-activity', String(Date.now()));
    act(() => vi.advanceTimersByTime(MINUTE));
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('resets on activity in this tab', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(10 * MINUTE, onIdle, { sync: newSync() }));
    act(() => vi.advanceTimersByTime(9 * MINUTE));
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    act(() => vi.advanceTimersByTime(9 * MINUTE));
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('holds the session open during keep-alive work and keeps other tabs alive', () => {
    const onIdle = vi.fn();
    const otherOnIdle = vi.fn();
    let busy = true;
    renderHook(() => useIdleLogout(10 * MINUTE, onIdle, { sync: newSync(), isKeepAlive: () => busy }));
    renderHook(() => useIdleLogout(10 * MINUTE, otherOnIdle, { sync: newSync() }));
    act(() => vi.advanceTimersByTime(30 * MINUTE));
    expect(onIdle).not.toHaveBeenCalled();
    expect(otherOnIdle).not.toHaveBeenCalled();
    busy = false;
    act(() => vi.advanceTimersByTime(15 * MINUTE));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('does not count opening a tab as activity for other tabs', () => {
    const listener = new FakeBroadcastChannel('affinityecho-auth');
    const got: unknown[] = [];
    listener.addEventListener('message', (event) => got.push(event.data));
    renderHook(() => useIdleLogout(10 * MINUTE, vi.fn(), { sync: newSync() }));
    expect(got).toEqual([]);
    expect(localStorage.getItem('affinityecho-last-activity')).toBeNull();
  });

  it('keeps the idle time already used when the setting arrives', () => {
    const onIdle = vi.fn();
    const sync = newSync();
    const { rerender } = renderHook(({ ms }) => useIdleLogout(ms, onIdle, { sync }), {
      initialProps: { ms: 60 * MINUTE },
    });
    act(() => vi.advanceTimersByTime(12 * MINUTE));
    rerender({ ms: 15 * MINUTE });
    act(() => vi.advanceTimersByTime(3 * MINUTE));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('reads the timeout from the admin settings', async () => {
    getSettings.mockResolvedValue({ security: { session_timeout_minutes: 15 } });
    const onIdle = vi.fn();
    renderHook(() => useAdminIdleLogout(onIdle));
    await act(async () => {
      await Promise.resolve();
    });
    act(() => vi.advanceTimersByTime(15 * MINUTE));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('uses the default when the settings cannot be read', async () => {
    getSettings.mockRejectedValue(new Error('down'));
    const onIdle = vi.fn();
    renderHook(() => useAdminIdleLogout(onIdle));
    await act(async () => {
      await Promise.resolve();
    });
    act(() => vi.advanceTimersByTime((DEFAULT_IDLE_MINUTES - 1) * MINUTE));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(MINUTE));
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('keeps the setting between 5 minutes and a day', () => {
    expect(idleMinutesFrom(1)).toBe(5);
    expect(idleMinutesFrom(100_000)).toBe(24 * 60);
    expect(idleMinutesFrom('30')).toBe(30);
    expect(idleMinutesFrom(undefined)).toBe(DEFAULT_IDLE_MINUTES);
    expect(idleMinutesFrom(-3)).toBe(DEFAULT_IDLE_MINUTES);
  });
});
