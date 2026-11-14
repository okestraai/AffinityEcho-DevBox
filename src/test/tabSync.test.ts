import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVITY_SHARE_INTERVAL_MS, createTabSync } from '../utils/tabSync';
import { FakeBroadcastChannel } from './support/fakeBroadcastChannel';

function tab(app = 'affinityecho', state = { signedIn: true, keepAlive: false }) {
  const logOutLocally = vi.fn(() => {
    state.signedIn = false;
  });
  const sync = createTabSync({
    app,
    isSignedIn: () => state.signedIn,
    logOutLocally,
    isKeepAlive: () => state.keepAlive,
  });
  sync.installLogoutSync();
  return { sync, logOutLocally, state };
}

describe('tab sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    localStorage.clear();
  });

  afterEach(() => {
    FakeBroadcastChannel.reset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('signs out every other tab when one tab signs out', () => {
    const a = tab();
    const b = tab();
    const c = tab();
    a.sync.broadcastLogout();
    expect(b.logOutLocally).toHaveBeenCalledTimes(1);
    expect(c.logOutLocally).toHaveBeenCalledTimes(1);
    expect(a.logOutLocally).not.toHaveBeenCalled();
  });

  it('ignores another app on the same origin', () => {
    const admin = tab('affinityecho');
    const other = tab('another-app');
    admin.sync.broadcastLogout();
    expect(other.logOutLocally).not.toHaveBeenCalled();
  });

  it('does nothing in a tab that is already signed out', () => {
    const a = tab();
    const b = tab('affinityecho', { signedIn: false, keepAlive: false });
    a.sync.broadcastLogout();
    expect(b.logOutLocally).not.toHaveBeenCalled();
  });

  it('lets a keep-alive tab ignore an idle sign-out but not a real one', () => {
    const a = tab();
    const b = tab('affinityecho', { signedIn: true, keepAlive: true });
    a.sync.broadcastLogout({ reason: 'idle' });
    expect(b.logOutLocally).not.toHaveBeenCalled();
    a.sync.broadcastLogout();
    expect(b.logOutLocally).toHaveBeenCalledTimes(1);
  });

  it('shares activity with other tabs and stores it', () => {
    const a = tab();
    const b = tab();
    const seen = vi.fn();
    b.sync.onActivityElsewhere(seen);
    a.sync.shareActivity(Date.now());
    expect(seen).toHaveBeenCalledWith(Date.now());
    expect(b.sync.lastSharedActivity()).toBe(Date.now());
  });

  it('sends at most once per window and sends the latest time when the window ends', () => {
    const a = tab();
    const b = tab();
    const seen = vi.fn();
    b.sync.onActivityElsewhere(seen);
    a.sync.shareActivity(Date.now());
    vi.advanceTimersByTime(3_000);
    a.sync.shareActivity(Date.now());
    vi.advanceTimersByTime(3_000);
    const latest = Date.now();
    a.sync.shareActivity(latest);
    expect(seen).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(ACTIVITY_SHARE_INTERVAL_MS);
    expect(seen).toHaveBeenCalledTimes(2);
    expect(seen).toHaveBeenLastCalledWith(latest);
  });

  it('drops pending activity when the session ends', () => {
    const a = tab();
    const b = tab();
    const seen = vi.fn();
    b.sync.onActivityElsewhere(seen);
    a.sync.shareActivity(Date.now());
    vi.advanceTimersByTime(1_000);
    a.sync.shareActivity(Date.now());
    a.sync.broadcastLogout();
    vi.advanceTimersByTime(ACTIVITY_SHARE_INTERVAL_MS);
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('ignores stored times in the future or that are not numbers', () => {
    const a = tab();
    localStorage.setItem('affinityecho-last-activity', String(Date.now() + 60_000));
    expect(a.sync.lastSharedActivity()).toBe(0);
    localStorage.setItem('affinityecho-last-activity', 'soon');
    expect(a.sync.lastSharedActivity()).toBe(0);
  });

  it('keeps working on its own when the browser has no BroadcastChannel', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const a = tab();
    expect(() => a.sync.broadcastLogout()).not.toThrow();
    expect(() => a.sync.shareActivity()).not.toThrow();
    expect(a.sync.onActivityElsewhere(() => {})).toBeTypeOf('function');
  });

  it('sends only the message type and time, never sign-in data', () => {
    const a = tab();
    const listener = new FakeBroadcastChannel('affinityecho-auth');
    const got: unknown[] = [];
    listener.addEventListener('message', (event) => got.push(event.data));
    a.sync.shareActivity(Date.now());
    a.sync.broadcastLogout({ reason: 'idle' });
    expect(got).toEqual([{ type: 'activity', at: Date.now() }, { type: 'logout', reason: 'idle' }]);
  });
});
