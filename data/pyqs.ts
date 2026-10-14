import type { PYQ } from '@/types';

// All predefined static PYQs have been removed.
// Only question papers uploaded through the Admin Panel (stored in Supabase) are displayed.
export const pyqs: PYQ[] = [];

export function filterPYQs({
  universityId,
  branchId,
  semester,
  subjectId,
  examType,
  year,
}: {
  universityId?: string;
  branchId?: string;
  semester?: number;
  subjectId?: string;
  examType?: string;
  year?: number;
}): PYQ[] {
  return pyqs.filter((p) => {
    if (universityId && p.universityId !== universityId) return false;
    if (branchId && p.branchId !== branchId) return false;
    if (semester && p.semester !== semester) return false;
    if (subjectId && p.subjectId !== subjectId) return false;
    if (examType && p.examType !== examType) return false;
    if (year && p.year !== year) return false;
    return true;
  });
}
