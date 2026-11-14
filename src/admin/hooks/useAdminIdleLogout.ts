import { useEffect, useRef, useState } from 'react';
import { GetAdminSettings } from '../../../api/adminApis';
import { sessionSync, type TabSync } from '../../utils/tabSync';

export const DEFAULT_IDLE_MINUTES = 60;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

// The admin setting in minutes, kept between 5 minutes and a day; anything else falls back to the default.
export function idleMinutesFrom(value: unknown): number {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_IDLE_MINUTES;
  return Math.min(Math.max(Math.round(minutes), 5), 24 * 60);
}

// Signs the admin out once no admin tab has had activity for the timeout.
export function useIdleLogout(
  timeoutMs: number,
  onIdle: () => void,
  { sync = sessionSync, isKeepAlive = () => false }: { sync?: TabSync; isKeepAlive?: () => boolean } = {},
): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  const keepAliveRef = useRef(isKeepAlive);
  keepAliveRef.current = isKeepAlive;

  useEffect(() => {
    let lastLocal = Date.now();
    let done = false;

    const schedule = (ms: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(check, Math.max(0, ms));
    };

    function check() {
      if (done) return;
      if (keepAliveRef.current()) {
        schedule(timeoutMs);
        return;
      }
      const remaining = Math.max(lastLocal, sync.lastSharedActivity()) + timeoutMs - Date.now();
      if (remaining > 0) {
        schedule(remaining);
        return;
      }
      done = true;
      onIdleRef.current();
    }

    const onActivity = () => {
      lastLocal = Date.now();
      sync.shareActivity(lastLocal);
      schedule(timeoutMs);
    };

    const stop = sync.onActivityElsewhere(() => schedule(timeoutMs));
    const heartbeat = setInterval(() => {
      if (keepAliveRef.current()) sync.shareActivity();
    }, Math.min(timeoutMs / 3, 60_000));

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    sync.shareActivity(lastLocal);
    schedule(timeoutMs);

    return () => {
      done = true;
      if (timer.current) clearTimeout(timer.current);
      clearInterval(heartbeat);
      stop();
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [timeoutMs, sync]);
}

// The admin pages' idle sign-out, using the session timeout from the admin settings.
export function useAdminIdleLogout(onIdle: () => void): void {
  const [minutes, setMinutes] = useState(DEFAULT_IDLE_MINUTES);

  useEffect(() => {
    let active = true;
    GetAdminSettings()
      .then((data) => {
        if (active) setMinutes(idleMinutesFrom(data?.security?.session_timeout_minutes));
      })
      .catch(() => {
        // Keep the default when the settings can't be read.
      });
    return () => {
      active = false;
    };
  }, []);

  useIdleLogout(minutes * 60_000, onIdle);
}
