import type { SearchResult } from '@/types';
import { resources } from './resources';
import { pyqs } from './pyqs';
import { subjects } from './universities';

const toolResults: SearchResult[] = [
  { id: 'tool-sgpa', title: 'SGPA Calculator', type: 'tool', href: 'https://biet-sgpa-auto.vercel.app/', meta: 'Calculate semester GPA' },
  { id: 'tool-cgpa', title: 'CGPA Calculator', type: 'tool', href: 'https://biet-sgpa-auto.vercel.app/', meta: 'Calculate cumulative GPA' },
  { id: 'tool-pct', title: 'Percentage Calculator', type: 'tool', href: 'https://biet-sgpa-auto.vercel.app/', meta: 'Convert CGPA to percentage' },
  { id: 'tool-req', title: 'Required SGPA Calculator', type: 'tool', href: 'https://biet-sgpa-auto.vercel.app/', meta: 'Find SGPA needed to reach target CGPA' },
  { id: 'tool-planner', title: 'Study Planner', type: 'tool', href: '/planner', meta: 'Generate a personalised study schedule' },
  { id: 'tool-quiz', title: 'AI Quiz', type: 'tool', href: '/quiz', meta: 'Test your knowledge with subject quizzes' },
];

export const allSearchResults: SearchResult[] = [
  ...toolResults,
  ...subjects.map((s) => ({
    id: `subject-${s.id}`,
    title: s.name,
    type: 'subject' as const,
    href: `/resources?branch=${s.branchId}&semester=${s.semester}`,
    meta: `${s.code} · Sem ${s.semester}`,
  })),
  ...resources.map((r) => ({
    id: `res-${r.id}`,
    title: r.title,
    type: 'resource' as const,
    href: `/resources?semester=${r.semester}&branch=${r.branchId}`,
    meta: `${r.subjectName} · Sem ${r.semester}`,
  })),
  ...pyqs.map((p) => ({
    id: `pyq-${p.id}`,
    title: `${p.subjectName} — ${p.year} ${p.examType}`,
    type: 'pyq' as const,
    href: `/pyqs?semester=${p.semester}&branch=${p.branchId}`,
    meta: `${p.subjectCode} · ${p.year}`,
  })),
];

export function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return allSearchResults
    .filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.meta ?? '').toLowerCase().includes(q)
    )
    .slice(0, 10);
}
