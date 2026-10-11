import { browserClient, isSupabaseConfigured } from './client';

export interface ResourceAccessLog {
  id: string;
  studentName: string;
  usn: string;
  resourceId?: string | null;
  resourceTitle: string;
  resourceType: string;
  branchId?: string | null;
  semester?: number | null;
  accessedAt: string;
}

export interface VisitorStatsResponse {
  totalVisits: number;
  uniqueStudents: number;
  logsCount: number;
  logs: ResourceAccessLog[];
  tableExists: boolean;
}

const LOCAL_STORAGE_KEY = 'vidyaaraa_access_logs_fallback';
export const STUDENT_STORAGE_KEY = 'vidyaaraa_student_info';

export interface StoredStudentInfo {
  name: string;
  usn: string;
}

function getLocalLogs(): ResourceAccessLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLog(log: ResourceAccessLog) {
  if (typeof window === 'undefined') return;
  try {
    const logs = getLocalLogs();
    logs.unshift(log);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // Ignore
  }
}

/**
 * Returns saved student details if they have already verified once.
 */
export function getStoredStudentInfo(): StoredStudentInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string' && typeof parsed.usn === 'string') {
      const name = parsed.name.trim();
      const usn = parsed.usn.trim().toUpperCase();
      if (name.length > 0 && usn.length > 0) {
        return { name, usn };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Store student details in localStorage so they never get prompted again.
 */
export function setStoredStudentInfo(name: string, usn: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STUDENT_STORAGE_KEY,
      JSON.stringify({
        name: name.trim(),
        usn: usn.trim().toUpperCase(),
      })
    );
  } catch {
    // ignore
  }
}

/**
 * Record a student access event (Name + USN + Resource info)
 */
export async function recordResourceAccess(data: {
  studentName: string;
  usn: string;
  resourceId?: string | null;
  resourceTitle: string;
  resourceType?: string;
  branchId?: string | null;
  semester?: number | null;
}): Promise<ResourceAccessLog | null> {
  const cleanName = data.studentName.trim();
  const cleanUsn = data.usn.trim().toUpperCase();

  const newLog: ResourceAccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    studentName: cleanName,
    usn: cleanUsn,
    resourceId: data.resourceId || null,
    resourceTitle: data.resourceTitle.trim(),
    resourceType: data.resourceType || 'notes',
    branchId: data.branchId || null,
    semester: data.semester ? Number(data.semester) : null,
    accessedAt: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  saveLocalLog(newLog);

  // Send to API route
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'resource_access',
        studentName: cleanName,
        usn: cleanUsn,
        resourceTitle: data.resourceTitle,
        action: data.resourceType === 'question-paper' ? 'Downloaded PYQ' : 'Viewed Notes',
        branch: data.branchId,
        semester: data.semester,
      }),
    });
  } catch (apiErr) {
    console.warn('Could not post access log to /api/analytics/track:', apiErr);
  }

  // Also try direct browser client to visitor_logs if Supabase configured
  if (isSupabaseConfigured()) {
    try {
      const client = browserClient();
      await client.from('visitor_logs').insert({
        id: newLog.id,
        name: cleanName,
        usn: cleanUsn,
        action: newLog.resourceType === 'question-paper' ? 'Downloaded PYQ' : 'Viewed Notes',
        details: data.resourceTitle.trim(),
        branch: data.branchId || null,
        sem: data.semester ? String(data.semester) : null,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Handled by API route fallback
    }
  }

  return newLog;
}

/**
 * Fetch visitor statistics & all access logs for the Admin Panel
 */
export async function fetchVisitorStats(): Promise<VisitorStatsResponse> {
  try {
    const res = await fetch('/api/analytics/stats', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        const formattedLogs: ResourceAccessLog[] = (json.logs || []).map((l: any) => ({
          id: l.id || `log-${Math.random()}`,
          studentName: l.name || l.studentName || 'Student',
          usn: l.usn || 'N/A',
          resourceTitle: l.details || l.resourceTitle || 'Resource',
          resourceType: l.action || 'notes',
          branchId: l.branch || l.branchId || null,
          semester: l.sem ? Number(l.sem) : null,
          accessedAt: l.createdAt
            ? new Date(l.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : new Date().toLocaleDateString('en-IN'),
        }));

        return {
          totalVisits: Number(json.totalVisits) || 0,
          uniqueStudents: Number(json.uniqueStudents) || 0,
          logsCount: formattedLogs.length,
          logs: formattedLogs,
          tableExists: Boolean(json.tableExists),
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching /api/analytics/stats:', err);
  }

  // Fallback to local logs
  const local = getLocalLogs();
  return {
    totalVisits: local.length,
    uniqueStudents: new Set(local.map((l) => l.usn)).size,
    logsCount: local.length,
    logs: local,
    tableExists: false,
  };
}

/**
 * Fetch all access logs for the Admin Panel
 */
export async function fetchResourceAccessLogs(): Promise<ResourceAccessLog[]> {
  const stats = await fetchVisitorStats();
  return stats.logs;
}

/**
 * Update total visitors count manually from Admin Panel
 */
export async function updateVisitorCount(count: number): Promise<boolean> {
  try {
    const res = await fetch('/api/analytics/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalVisits: count }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete a specific access log
 */
export async function deleteResourceAccessLog(id: string): Promise<boolean> {
  // Remove from local storage
  if (typeof window !== 'undefined') {
    try {
      const logs = getLocalLogs().filter((l) => l.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignore
    }
  }

  try {
    const res = await fetch(`/api/analytics/stats?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
