import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

type RealtimeOptions = {
  events?: string[];
  intervalMs?: number;
  enabled?: boolean;
};

export default function useRealtimeRefresh(
  refreshFn: () => void | Promise<void>,
  options: RealtimeOptions = {}
) {
  const { events = [], intervalMs = 30000, enabled = true } = options;
  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    const runRefresh = () => {
      if (!isMounted) return;
      Promise.resolve(refreshRef.current()).catch((error) => {
        console.error('Realtime refresh error:', error);
      });
    };

    events.forEach((event) => socketService.on(event, runRefresh));

    let timer: ReturnType<typeof setInterval> | null = null;
    if (intervalMs && intervalMs > 0) {
      timer = setInterval(runRefresh, intervalMs);
    }

    return () => {
      isMounted = false;
      events.forEach((event) => socketService.off(event, runRefresh));
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [enabled, intervalMs, events.join('|')]);
}
