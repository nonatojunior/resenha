import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void savedCallback.current();
      }, intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void savedCallback.current();
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, intervalMs]);
}
