import { useEffect, useRef, useState } from 'react';

/**
 * Tracks remaining session time. Each successful API call returns
 * sessionRemainingMs from the server — call setRemaining() with that value
 * to keep the local clock aligned.
 *
 * Calls onExpire() exactly once when the timer hits zero.
 */
export function useSessionTimer(initialMs = 0, onExpire) {
  const [remainingMs, setRemainingMs] = useState(initialMs);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredFiredRef = useRef(false);

  useEffect(() => {
    if (remainingMs <= 0) return;
    expiredFiredRef.current = false;
    const t = setInterval(() => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next === 0 && !expiredFiredRef.current) {
          expiredFiredRef.current = true;
          onExpireRef.current?.();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remainingMs > 0]);

  return [remainingMs, setRemainingMs];
}
