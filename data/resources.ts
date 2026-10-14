import type { Resource } from '@/types';

// All predefined static notes have been removed.
// Only notes uploaded through the Admin Panel (stored in Supabase) are displayed.
export const resources: Resource[] = [];

export function filterResources({
  universityId,
  branchId,
  semester,
  subjectId,
  type,
}: {
  universityId?: string;
  branchId?: string;
  semester?: number;
  subjectId?: string;
  type?: string;
}): Resource[] {
  return resources.filter((r) => {
    if (universityId && r.universityId !== universityId) return false;
    if (branchId && r.branchId !== branchId) return false;
    if (semester && r.semester !== semester) return false;
    if (subjectId && r.subjectId !== subjectId) return false;
    if (type && r.type !== type) return false;
    return true;
  });
}
