'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getStoredStudentInfo } from '@/lib/db/access-logs';

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

    const student = getStoredStudentInfo();

    // Send tracking beacon/fetch
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pageview',
        path: pathname,
        studentName: student?.name || null,
        usn: student?.usn || null,
        email: student?.email || null,
      }),
    }).catch(() => {
      // Non-critical, ignore network issues
    });
  }, [pathname]);

  return null;
}
