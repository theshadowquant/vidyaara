import { browserClient, isSupabaseConfigured } from './client';
import type { DbPYQ } from './types';
import type { PYQ } from '@/types';
import { pyqs as STATIC_PYQS } from '@/data/pyqs';

export function mapDbPYQToPYQ(row: DbPYQ): PYQ {
  return {
    id: row.id,
    subjectId: row.subject_id || '',
    subjectName: row.subject_name,
    subjectCode: row.subject_code || '',
    branchId: row.branch_id,
    semester: row.semester,
    universityId: row.university_id,
    year: row.year,
    examType: row.exam_type,
    url: row.url,
    isDemo: row.is_demo,
  };
}

export interface PYQFilters {
  branchId?: string;
  semester?: number;
  year?: number;
  examType?: string;
  search?: string;
}

export async function fetchPYQs(filters?: PYQFilters): Promise<PYQ[]> {
  if (!isSupabaseConfigured()) {
    let result = [...STATIC_PYQS];
    if (filters?.branchId && filters.branchId !== 'all') {
      result = result.filter((p) => p.branchId === filters.branchId);
    }
    if (filters?.semester && filters.semester !== 0) {
      result = result.filter((p) => p.semester === filters.semester);
    }
    if (filters?.year && filters.year !== 0) {
      result = result.filter((p) => p.year === filters.year);
    }
    if (filters?.examType && filters.examType !== 'all') {
      result = result.filter((p) => p.examType === filters.examType);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.subjectName.toLowerCase().includes(q) ||
          p.subjectCode.toLowerCase().includes(q)
      );
    }
    return result;
  }

  const client = browserClient();
  let query = client.from('pyqs').select('*').order('year', { ascending: false });

  if (filters?.branchId && filters.branchId !== 'all') {
    query = query.eq('branch_id', filters.branchId);
  }
  if (filters?.semester && filters.semester !== 0) {
    query = query.eq('semester', filters.semester);
  }
  if (filters?.year && filters.year !== 0) {
    query = query.eq('year', filters.year);
  }
  if (filters?.examType && filters.examType !== 'all') {
    query = query.eq('exam_type', filters.examType as any);
  }
  if (filters?.search && filters.search.trim()) {
    query = query.or(
      `subject_name.ilike.%${filters.search}%,subject_code.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching PYQs from Supabase:', error);
    return STATIC_PYQS;
  }

  return (data as DbPYQ[]).map(mapDbPYQToPYQ);
}

export async function createPYQ(pyq: Omit<PYQ, 'id'>): Promise<PYQ | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot persist PYQ');
    return null;
  }

  const client = browserClient();
  const { data, error } = await client
    .from('pyqs')
    .insert({
      subject_id: pyq.subjectId && pyq.subjectId.trim() !== '' ? pyq.subjectId.trim() : null,
      subject_name: pyq.subjectName,
      subject_code: pyq.subjectCode,
      branch_id: pyq.branchId,
      semester: pyq.semester,
      university_id: pyq.universityId || 'vtu',
      year: pyq.year,
      exam_type: pyq.examType,
      url: pyq.url,
      is_demo: pyq.isDemo || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating PYQ:', error);
    throw error;
  }

  return mapDbPYQToPYQ(data as DbPYQ);
}

export async function deletePYQ(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot delete PYQ');
    return false;
  }

  const client = browserClient();
  const { error } = await client.from('pyqs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting PYQ:', error);
    throw error;
  }

  return true;
}
