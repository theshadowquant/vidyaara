import { browserClient, isSupabaseConfigured } from './client';
import type { DbResource } from './types';
import type { Resource } from '@/types';
import { resources as STATIC_RESOURCES } from '@/data/resources';

const LOCAL_STORAGE_RESOURCES_KEY = 'vidyaaraa_dynamic_resources';

function getLocalResources(): Resource[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESOURCES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalResources(items: Resource[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_RESOURCES_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function mapDbResourceToResource(row: any): Resource {
  return {
    id: row.id,
    folderId: row.folder_id || null,
    subjectId: row.subject_id || '',
    subjectName: row.subject_name || '',
    branchId: row.branch_id || 'general',
    semester: row.semester || 1,
    universityId: row.university_id || 'vtu',
    type: row.type || 'notes',
    title: row.title || 'Untitled Resource',
    description: row.description || '',
    url: row.url || '',
    fileName: row.file_name || undefined,
    fileSizeBytes: row.file_size_bytes || undefined,
    mimeType: row.mime_type || undefined,
    isDemo: row.is_demo ?? false,
    uploadedAt: row.uploaded_at || new Date().toISOString(),
  };
}

export interface ResourceFilters {
  branchId?: string;
  semester?: number;
  type?: string;
  search?: string;
  folderId?: string | null;
}

export async function fetchResources(filters?: ResourceFilters): Promise<Resource[]> {
  if (!isSupabaseConfigured()) {
    let result = [...STATIC_RESOURCES, ...getLocalResources()];
    if (filters?.folderId !== undefined) {
      result = result.filter((r) => r.folderId === filters.folderId);
    }
    if (filters?.branchId && filters.branchId !== 'all') {
      result = result.filter((r) => r.branchId === filters.branchId);
    }
    if (filters?.semester && filters.semester !== 0) {
      result = result.filter((r) => r.semester === filters.semester);
    }
    if (filters?.type && filters.type !== 'all') {
      result = result.filter((r) => r.type === filters.type);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subjectName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return result;
  }

  const client = browserClient();
  let query = client.from('resources').select('*').order('uploaded_at', { ascending: false });

  if (filters?.folderId !== undefined) {
    if (filters.folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', filters.folderId);
    }
  }
  if (filters?.branchId && filters.branchId !== 'all') {
    query = query.eq('branch_id', filters.branchId);
  }
  if (filters?.semester && filters.semester !== 0) {
    query = query.eq('semester', filters.semester);
  }
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type as any);
  }
  if (filters?.search && filters.search.trim()) {
    query = query.or(
      `title.ilike.%${filters.search}%,subject_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching resources from Supabase:', error);
    // fallback to local/static
    return [...STATIC_RESOURCES, ...getLocalResources()];
  }

  const dbResources = (data as any[]).map(mapDbResourceToResource);
  const localResources = getLocalResources();

  // Merge any local resources not yet present in DB so nothing disappears on reload
  const dbIds = new Set(dbResources.map((r) => r.id));
  const localOnly = localResources.filter((r) => !dbIds.has(r.id));
  const combined = [...dbResources, ...localOnly];

  let result = combined;
  if (filters?.folderId !== undefined) {
    if (filters.folderId === null) {
      result = result.filter((r) => !r.folderId);
    } else {
      result = result.filter((r) => r.folderId === filters.folderId);
    }
  }

  return result;
}

export async function createResource(resource: Omit<Resource, 'id' | 'uploadedAt'>): Promise<Resource | null> {
  const newId = `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const uploadedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, persisting resource to localStorage');
    const newRes: Resource = {
      ...resource,
      id: newId,
      uploadedAt,
    };
    const current = getLocalResources();
    saveLocalResources([newRes, ...current]);
    return newRes;
  }

  const client = browserClient();
  const safeBranch = resource.branchId && resource.branchId !== 'general' ? resource.branchId : 'other';
  const insertPayload: any = {
    folder_id: resource.folderId || null,
    subject_id: null,
    subject_name: resource.subjectName || 'General',
    branch_id: safeBranch,
    semester: resource.semester || 1,
    university_id: resource.universityId || 'vtu',
    type: resource.type || 'notes',
    title: resource.title,
    description: resource.description || '',
    url: resource.url,
    file_name: resource.fileName || null,
    file_size_bytes: resource.fileSizeBytes || null,
    mime_type: resource.mimeType || null,
    is_demo: resource.isDemo || false,
  };

  const { data, error } = await client
    .from('resources')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating resource in Supabase:', error);
    // Fallback save to local storage
    const fallbackRes: Resource = {
      ...resource,
      id: newId,
      uploadedAt,
    };
    saveLocalResources([fallbackRes, ...getLocalResources()]);
    return fallbackRes;
  }

  const created = mapDbResourceToResource(data);
  saveLocalResources([created, ...getLocalResources().filter((r) => r.id !== created.id)]);
  return created;
}

export async function updateResource(id: string, updates: Partial<Resource>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const list = getLocalResources();
    const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveLocalResources(updated);
    return true;
  }

  const client = browserClient();
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.url !== undefined) payload.url = updates.url;
  if (updates.folderId !== undefined) payload.folder_id = updates.folderId;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.subjectName !== undefined) payload.subject_name = updates.subjectName;

  const { error } = await client.from('resources').update(payload).eq('id', id);
  if (error) {
    console.error('Error updating resource in Supabase:', error);
    return false;
  }
  return true;
}

export async function moveResource(id: string, targetFolderId: string | null): Promise<boolean> {
  return updateResource(id, { folderId: targetFolderId });
}

export async function deleteResource(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const list = getLocalResources();
    saveLocalResources(list.filter((r) => r.id !== id));
    return true;
  }

  const client = browserClient();
  const { error } = await client.from('resources').delete().eq('id', id);

  if (error) {
    console.error('Error deleting resource from Supabase:', error);
    // Also remove from local fallback if present
    saveLocalResources(getLocalResources().filter((r) => r.id !== id));
    return false;
  }

  return true;
}
