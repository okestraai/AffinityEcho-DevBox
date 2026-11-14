// Keeps sign-out and the admin idle clock in step across every open tab of this app.

export const ACTIVITY_SHARE_INTERVAL_MS = 10_000;

type LogoutReason = 'idle';

interface TabSyncOptions {
  app: string;
  isSignedIn: () => boolean;
  logOutLocally: (reason?: LogoutReason) => void;
  isKeepAlive?: () => boolean;
}

export interface TabSync {
  broadcastLogout: (options?: { reason?: LogoutReason }) => void;
  installLogoutSync: () => void;
  shareActivity: (at?: number) => void;
  lastSharedActivity: () => number;
  onActivityElsewhere: (fn: (at: number) => void) => () => void;
}

export function createTabSync({ app, isSignedIn, logOutLocally, isKeepAlive = () => false }: TabSyncOptions): TabSync {
  const channelName = `${app}-auth`;
  const activityKey = `${app}-last-activity`;

  let channel: BroadcastChannel | null = null;
  let listening = false;
  let lastShared = 0;
  let pendingAt = 0;
  let trailingTimer: ReturnType<typeof setTimeout> | null = null;

  // Old browsers have no BroadcastChannel, and the constructor can throw where it's blocked.
  const getChannel = (): BroadcastChannel | null => {
    if (channel) return channel;
    if (typeof BroadcastChannel === 'undefined') return null;
    try {
      channel = new BroadcastChannel(channelName);
    } catch {
      channel = null;
    }
    return channel;
  };

  const post = (data: { type: 'logout'; reason?: LogoutReason } | { type: 'activity'; at: number }) => {
    try {
      getChannel()?.postMessage(data);
    } catch {
      // Closed or unavailable: the tab carries on alone.
    }
  };

  const broadcastLogout = ({ reason }: { reason?: LogoutReason } = {}) => {
    if (trailingTimer) clearTimeout(trailingTimer);
    trailingTimer = null;
    pendingAt = 0;
    post(reason ? { type: 'logout', reason } : { type: 'logout' });
  };

  const onLogoutMessage = (reason: unknown) => {
    // A tab doing must-not-stop work ignores another tab's idle sign-out, but not a real one.
    if (reason === 'idle' && isKeepAlive()) return;
    if (!isSignedIn()) return;
    logOutLocally(reason === 'idle' ? 'idle' : undefined);
  };

  const installLogoutSync = () => {
    if (listening) return;
    const ch = getChannel();
    if (!ch) return;
    listening = true;
    ch.addEventListener('message', (event: MessageEvent) => {
      if (event?.data?.type === 'logout') onLogoutMessage(event.data.reason);
    });
  };

  const sendActivity = (at: number) => {
    lastShared = Date.now();
    pendingAt = 0;
    try {
      localStorage.setItem(activityKey, String(at));
    } catch {
      // No storage: the message still reaches tabs that are awake.
    }
    post({ type: 'activity', at });
  };

  // At most one message per window, and the latest time in the window is sent when it ends.
  const shareActivity = (at: number = Date.now()) => {
    const now = Date.now();
    if (now >= lastShared && now - lastShared < ACTIVITY_SHARE_INTERVAL_MS) {
      pendingAt = Math.max(pendingAt, at);
      if (!trailingTimer) {
        trailingTimer = setTimeout(() => {
          trailingTimer = null;
          if (pendingAt) sendActivity(pendingAt);
        }, lastShared + ACTIVITY_SHARE_INTERVAL_MS - now);
      }
      return;
    }
    sendActivity(at);
  };

  const lastSharedActivity = (): number => {
    try {
      const at = Number(localStorage.getItem(activityKey));
      return Number.isFinite(at) && at > 0 && at <= Date.now() ? at : 0;
    } catch {
      return 0;
    }
  };

  const onActivityElsewhere = (fn: (at: number) => void) => {
    const ch = getChannel();
    if (!ch) return () => {};
    const handler = (event: MessageEvent) => {
      if (event?.data?.type === 'activity') fn(event.data.at);
    };
    ch.addEventListener('message', handler);
    return () => {
      try {
        ch.removeEventListener('message', handler);
      } catch {
        // Closed.
      }
    };
  };

  return { broadcastLogout, installLogoutSync, shareActivity, lastSharedActivity, onActivityElsewhere };
}

// The sign-in is one set of cookies for the whole app, so one channel serves every tab.
// No tab ignores an idle sign-out here: the idle tab has already cleared the shared cookies.
const handlers: { isSignedIn: () => boolean; logOutLocally: (reason?: LogoutReason) => void } = {
  isSignedIn: () => false,
  logOutLocally: () => {},
};

export const sessionSync = createTabSync({
  app: 'affinityecho',
  isSignedIn: () => handlers.isSignedIn(),
  logOutLocally: (reason) => handlers.logOutLocally(reason),
});

export function registerSession(next: Partial<typeof handlers>): void {
  Object.assign(handlers, next);
}
