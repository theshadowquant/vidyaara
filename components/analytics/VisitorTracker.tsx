'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid tracking admin page as visitor count
    if (pathname && pathname.startsWith('/admin')) {
      return;
    }

    if (lastTrackedPath.current === pathname) {
      return;
    }
    lastTrackedPath.current = pathname;

    // Send tracking beacon/fetch
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pageview',
        path: pathname,
      }),
    }).catch(() => {
      // Non-critical, ignore network issues
    });
  }, [pathname]);

  return null;
}
