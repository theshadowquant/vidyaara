import { browserClient, isSupabaseConfigured } from './client';
import type { DbResource } from './types';
import type { Resource } from '@/types';
import { resources as STATIC_RESOURCES } from '@/data/resources';

const LOCAL_STORAGE_RESOURCES_KEY = 'vidyaaraa_dynamic_resources';
const RESOURCE_SELECT_FIELDS =
  'id, folder_id, subject_id, subject_name, branch_id, semester, university_id, type, title, description, url, file_name, file_size_bytes, mime_type, is_demo, uploaded_at';

// In-Memory High-Speed Cache & Promise Deduplicator
let memoryResourcesCache: Resource[] | null = null;
let memoryCacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds
let inFlightResourcesPromise: Promise<Resource[]> | null = null;

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

/**
 * Synchronous cache lookup for instantaneous page rendering (0ms delay).
 */
export function getCachedResources(): Resource[] {
  if (memoryResourcesCache && memoryResourcesCache.length > 0) {
    return memoryResourcesCache;
  }
  const local = getLocalResources();
  if (local.length > 0) {
    return local;
  }
  return STATIC_RESOURCES;
}

export function invalidateResourcesCache() {
  memoryResourcesCache = null;
  memoryCacheTimestamp = 0;
}

export async function fetchResources(filters?: ResourceFilters, forceRefresh = false): Promise<Resource[]> {
  const isFiltered = !!(
    filters?.folderId !== undefined ||
    (filters?.branchId && filters.branchId !== 'all') ||
    (filters?.semester && filters.semester !== 0) ||
    (filters?.type && filters.type !== 'all') ||
    (filters?.search && filters.search.trim())
  );

  // Return fresh in-memory cache instantly for unfiltered requests
  if (!forceRefresh && !isFiltered && memoryResourcesCache && Date.now() - memoryCacheTimestamp < CACHE_TTL_MS) {
    return memoryResourcesCache;
  }

  // Deduplicate concurrent in-flight requests
  if (!isFiltered && inFlightResourcesPromise) {
    return inFlightResourcesPromise;
  }

  const fetchPromise = (async () => {
    try {
      if (!isSupabaseConfigured()) {
        let result = [...STATIC_RESOURCES, ...getLocalResources()];
        if (filters?.folderId !== undefined) {
          result = result.filter((r) => (filters.folderId === null ? !r.folderId : r.folderId === filters.folderId));
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
      let query = client.from('resources').select(RESOURCE_SELECT_FIELDS).order('uploaded_at', { ascending: false });

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
        return [...STATIC_RESOURCES, ...getLocalResources()];
      }

      const dbResources = (data as any[]).map(mapDbResourceToResource);
      const localResources = getLocalResources();

      // Merge any local resources not yet present in DB so nothing disappears on reload
      const dbIds = new Set(dbResources.map((r) => r.id));
      const localOnly = localResources.filter((r) => !dbIds.has(r.id));
      const combined = [...dbResources, ...localOnly];

      // Update in-memory cache if unfiltered
      if (!isFiltered) {
        memoryResourcesCache = combined;
        memoryCacheTimestamp = Date.now();
      }

      let result = combined;
      if (filters?.folderId !== undefined) {
        if (filters.folderId === null) {
          result = result.filter((r) => !r.folderId);
        } else {
          result = result.filter((r) => r.folderId === filters.folderId);
        }
      }

      return result;
    } finally {
      if (!isFiltered) {
        inFlightResourcesPromise = null;
      }
    }
  })();

  if (!isFiltered) {
    inFlightResourcesPromise = fetchPromise;
  }

  return fetchPromise;
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
    memoryResourcesCache = [newRes, ...(memoryResourcesCache || current)];
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
    .select(RESOURCE_SELECT_FIELDS)
    .single();

  if (error) {
    console.error('Error creating resource in Supabase:', error);
    const fallbackRes: Resource = {
      ...resource,
      id: newId,
      uploadedAt,
    };
    saveLocalResources([fallbackRes, ...getLocalResources()]);
    memoryResourcesCache = [fallbackRes, ...(memoryResourcesCache || [])];
    return fallbackRes;
  }

  const created = mapDbResourceToResource(data);
  saveLocalResources([created, ...getLocalResources().filter((r) => r.id !== created.id)]);
  memoryResourcesCache = [created, ...(memoryResourcesCache || []).filter((r) => r.id !== created.id)];
  return created;
}

export async function updateResource(id: string, updates: Partial<Resource>): Promise<boolean> {
  const list = getLocalResources();
  const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveLocalResources(updated);
  if (memoryResourcesCache) {
    memoryResourcesCache = memoryResourcesCache.map((r) => (r.id === id ? { ...r, ...updates } : r));
  }

  if (!isSupabaseConfigured()) {
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
  saveLocalResources(getLocalResources().filter((r) => r.id !== id));
  if (memoryResourcesCache) {
    memoryResourcesCache = memoryResourcesCache.filter((r) => r.id !== id);
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  const client = browserClient();
  const { error } = await client.from('resources').delete().eq('id', id);

  if (error) {
    console.error('Error deleting resource from Supabase:', error);
    return false;
  }

  return true;
}
