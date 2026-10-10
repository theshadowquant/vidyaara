import { browserClient, isSupabaseConfigured } from './client';
import type { DbResource } from './types';
import type { Resource } from '@/types';
import { resources as STATIC_RESOURCES } from '@/data/resources';

export function mapDbResourceToResource(row: DbResource): Resource {
  return {
    id: row.id,
    subjectId: row.subject_id || '',
    subjectName: row.subject_name,
    branchId: row.branch_id,
    semester: row.semester,
    universityId: row.university_id,
    type: row.type,
    title: row.title,
    description: row.description || '',
    url: row.url,
    isDemo: row.is_demo,
    uploadedAt: row.uploaded_at,
  };
}

export interface ResourceFilters {
  branchId?: string;
  semester?: number;
  type?: string;
  search?: string;
}

export async function fetchResources(filters?: ResourceFilters): Promise<Resource[]> {
  if (!isSupabaseConfigured()) {
    let result = [...STATIC_RESOURCES];
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
    // Use ilike or textSearch if available
    query = query.or(
      `title.ilike.%${filters.search}%,subject_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching resources from Supabase:', error);
    // fallback to static
    return STATIC_RESOURCES;
  }

  return (data as DbResource[]).map(mapDbResourceToResource);
}

export async function createResource(resource: Omit<Resource, 'id' | 'uploadedAt'>): Promise<Resource | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot persist resource');
    return null;
  }

  const client = browserClient();
  const { data, error } = await client
    .from('resources')
    .insert({
      subject_id: resource.subjectId || null,
      subject_name: resource.subjectName,
      branch_id: resource.branchId,
      semester: resource.semester,
      university_id: resource.universityId || 'vtu',
      type: resource.type,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      is_demo: resource.isDemo || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resource:', error);
    throw error;
  }

  return mapDbResourceToResource(data as DbResource);
}

export async function deleteResource(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot delete resource');
    return false;
  }

  const client = browserClient();
  const { error } = await client.from('resources').delete().eq('id', id);

  if (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }

  return true;
}
