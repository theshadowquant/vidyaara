import { browserClient, isSupabaseConfigured } from './client';
import type { DbResourceAccessLog } from './types';

export interface ResourceAccessLog {
  id: string;
  studentName: string;
  usn: string;
  resourceId?: string | null;
  resourceTitle: string;
  resourceType: string; // 'notes' | 'pyq' | 'lab-manual' | etc.
  branchId?: string | null;
  semester?: number | null;
  accessedAt: string;
}

const LOCAL_STORAGE_KEY = 'vidyaaraa_access_logs_fallback';

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
    // keep latest 100 in local buffer
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // Ignore storage quota
  }
}

export function mapDbAccessLogToLog(row: DbResourceAccessLog): ResourceAccessLog {
  return {
    id: row.id,
    studentName: row.student_name,
    usn: row.usn,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    resourceType: row.resource_type || 'notes',
    branchId: row.branch_id,
    semester: row.semester,
    accessedAt: new Date(row.accessed_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
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
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

  // Always save to local fallback buffer
  saveLocalLog(newLog);

  if (!isSupabaseConfigured()) {
    return newLog;
  }

  try {
    const client = browserClient();
    const { data: dbData, error } = await client
      .from('resource_access_logs')
      .insert({
        student_name: cleanName,
        usn: cleanUsn,
        resource_id: data.resourceId || null,
        resource_title: data.resourceTitle.trim(),
        resource_type: data.resourceType || 'notes',
        branch_id: data.branchId || null,
        semester: data.semester ? Number(data.semester) : null,
      })
      .select()
      .single();

    if (error) {
      console.warn('Could not persist access log to Supabase (using local buffer):', error.message);
      return newLog;
    }

    return mapDbAccessLogToLog(dbData as DbResourceAccessLog);
  } catch (err: any) {
    console.warn('Network error recording access log:', err?.message || err);
    return newLog;
  }
}

/**
 * Fetch all access logs for the Admin Panel
 */
export async function fetchResourceAccessLogs(): Promise<ResourceAccessLog[]> {
  const localLogs = getLocalLogs();

  if (!isSupabaseConfigured()) {
    return localLogs;
  }

  try {
    const client = browserClient();
    const { data, error } = await client
      .from('resource_access_logs')
      .select('*')
      .order('accessed_at', { ascending: false });

    if (error) {
      console.warn('Error fetching access logs from Supabase:', error.message);
      return localLogs;
    }

    const dbLogs = (data as DbResourceAccessLog[]).map(mapDbAccessLogToLog);

    // Merge any unique local logs that might not yet be in db
    const existingIds = new Set(dbLogs.map((l) => l.id));
    const merged = [...dbLogs];
    for (const l of localLogs) {
      if (!existingIds.has(l.id)) {
        merged.push(l);
      }
    }

    return merged;
  } catch (err: any) {
    console.warn('Error fetching access logs:', err?.message || err);
    return localLogs;
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

  if (!isSupabaseConfigured() || id.startsWith('local-')) {
    return true;
  }

  try {
    const client = browserClient();
    const { error } = await client.from('resource_access_logs').delete().eq('id', id);
    if (error) {
      console.error('Error deleting access log:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
