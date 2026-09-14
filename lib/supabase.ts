import { Resource } from '@/types';
import { resources as defaultResources } from '@/data/resources';
import {
  AdminNoteRequest,
  AdminFeedback,
  getStoredResources,
  saveCustomResource,
  deleteCustomResource,
  getStoredRequests,
  saveNoteRequest as localSaveNoteRequest,
  updateNoteRequestStatus as localUpdateNoteRequestStatus,
  deleteNoteRequest as localDeleteNoteRequest,
  getStoredFeedback,
  saveFeedback as localSaveFeedback,
  deleteFeedback as localDeleteFeedback,
  getDeletedResourceIds,
} from './admin-storage';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
};

// Generic Supabase REST Fetch Helper
async function supabaseFetch<T>(
  table: string,
  options: {
    method?: string;
    body?: any;
    query?: string;
  } = {}
): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}${options.query ? `?${options.query}` : ''}`;
    const headers: Record<string, string> = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      console.warn(`Supabase ${table} error:`, res.status, await res.text());
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`Supabase ${table} fetch exception:`, err);
    return null;
  }
}

// ---------------- RESOURCES ----------------
export async function fetchAllResources(): Promise<Resource[]> {
  const deleted = getDeletedResourceIds();
  if (isSupabaseConfigured()) {
    const data = await supabaseFetch<Resource[]>('resources', {
      query: 'select=*&order=uploadedAt.desc',
    });
    if (data) {
      const combined = [...data, ...defaultResources];
      return combined.filter((r) => !deleted.includes(r.id));
    }
  }
  return getStoredResources();
}

export async function addResource(res: Resource): Promise<void> {
  saveCustomResource(res); // Local mirror
  if (isSupabaseConfigured()) {
    await supabaseFetch('resources', {
      method: 'POST',
      body: res,
    });
  }
}

export async function removeResource(id: string): Promise<void> {
  deleteCustomResource(id); // Local mirror
  if (isSupabaseConfigured()) {
    await supabaseFetch('resources', {
      method: 'DELETE',
      query: `id=eq.${id}`,
    });
  }
}

// ---------------- NOTE REQUESTS ----------------
export async function fetchAllRequests(): Promise<AdminNoteRequest[]> {
  if (isSupabaseConfigured()) {
    const data = await supabaseFetch<AdminNoteRequest[]>('note_requests', {
      query: 'select=*&order=createdAt.desc',
    });
    if (data && data.length > 0) {
      return data;
    }
  }
  return getStoredRequests();
}

export async function addNoteRequest(
  req: Omit<AdminNoteRequest, 'id' | 'createdAt'>
): Promise<AdminNoteRequest> {
  const localItem = localSaveNoteRequest(req);
  if (isSupabaseConfigured()) {
    await supabaseFetch('note_requests', {
      method: 'POST',
      body: localItem,
    });
  }
  return localItem;
}

export async function updateRequestStatus(
  id: string,
  status: AdminNoteRequest['status']
): Promise<void> {
  localUpdateNoteRequestStatus(id, status);
  if (isSupabaseConfigured()) {
    await supabaseFetch('note_requests', {
      method: 'PATCH',
      query: `id=eq.${id}`,
      body: { status },
    });
  }
}

export async function removeNoteRequest(id: string): Promise<void> {
  localDeleteNoteRequest(id);
  if (isSupabaseConfigured()) {
    await supabaseFetch('note_requests', {
      method: 'DELETE',
      query: `id=eq.${id}`,
    });
  }
}

// ---------------- FEEDBACK ----------------
export async function fetchAllFeedback(): Promise<AdminFeedback[]> {
  if (isSupabaseConfigured()) {
    const data = await supabaseFetch<AdminFeedback[]>('feedbacks', {
      query: 'select=*&order=createdAt.desc',
    });
    if (data && data.length > 0) {
      return data;
    }
  }
  return getStoredFeedback();
}

export async function addFeedback(
  rating: number,
  comment: string,
  category: string
): Promise<AdminFeedback> {
  const localItem = localSaveFeedback(rating, comment, category);
  if (isSupabaseConfigured()) {
    await supabaseFetch('feedbacks', {
      method: 'POST',
      body: localItem,
    });
  }
  return localItem;
}

export async function removeFeedback(id: string): Promise<void> {
  localDeleteFeedback(id);
  if (isSupabaseConfigured()) {
    await supabaseFetch('feedbacks', {
      method: 'DELETE',
      query: `id=eq.${id}`,
    });
  }
}
