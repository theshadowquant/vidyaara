import { browserClient, isSupabaseConfigured } from './client';
import type { DbNoteRequest, NoteRequestStatus } from './types';

export interface NoteRequest {
  id: string;
  subject: string;
  branch: string;
  semester: string;
  status: NoteRequestStatus;
  createdAt: string;
}

export function mapDbNoteRequest(row: DbNoteRequest): NoteRequest {
  return {
    id: row.id,
    subject: row.subject,
    branch: row.branch,
    semester: row.semester,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchNoteRequests(): Promise<NoteRequest[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = browserClient();
  const { data, error } = await client
    .from('note_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching note requests:', error);
    return [];
  }

  return (data as DbNoteRequest[]).map(mapDbNoteRequest);
}

export async function submitNoteRequest(request: {
  subject: string;
  branch: string;
  semester: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Note request was not sent to database.');
    return true; // Graceful mock fallback
  }

  const client = browserClient();
  const { error } = await client.from('note_requests').insert({
    subject: request.subject,
    branch: request.branch,
    semester: request.semester,
    status: 'Under Review',
  });

  if (error) {
    console.error('Error submitting note request:', error);
    throw error;
  }

  return true;
}

export async function updateNoteRequestStatus(
  id: string,
  status: NoteRequestStatus
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const client = browserClient();
  const { error } = await client
    .from('note_requests')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating note request status:', error);
    throw error;
  }

  return true;
}

export async function deleteNoteRequest(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const client = browserClient();
  const { error } = await client.from('note_requests').delete().eq('id', id);

  if (error) {
    console.error('Error deleting note request:', error);
    throw error;
  }

  return true;
}
