import { browserClient, isSupabaseConfigured } from './client';
import type { DbFeedback } from './types';

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  category: string;
  createdAt: string;
}

export function mapDbFeedback(row: DbFeedback): Feedback {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function fetchFeedbacks(): Promise<Feedback[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = browserClient();
  const { data, error } = await client
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedbacks:', error);
    return [];
  }

  return (data as DbFeedback[]).map(mapDbFeedback);
}

export async function submitFeedback(feedback: {
  rating: number;
  comment: string;
  category: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Feedback was not sent to database.');
    return true; // Graceful fallback
  }

  const client = browserClient();
  const { error } = await client.from('feedbacks').insert({
    rating: feedback.rating,
    comment: feedback.comment,
    category: feedback.category,
  });

  if (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }

  return true;
}

export async function deleteFeedback(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const client = browserClient();
  const { error } = await client.from('feedbacks').delete().eq('id', id);

  if (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }

  return true;
}
