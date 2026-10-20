// ============================================================
// Vidyaaraa — Core TypeScript Types
// ============================================================

export interface University {
  id: string;
  name: string;
  slug: string;
  shortName: string;
}

export interface Branch {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  shortName: string;
}

export interface Semester {
  id: number;
  label: string;
}

export interface Subject {
  id: string;
  universityId: string;
  branchId: string;
  semester: number;
  code: string;
  name: string;
  credits: number;
}

export type ResourceType =
  | 'notes'
  | 'question-paper'
  | 'lab-manual'
  | 'important-questions'
  | 'syllabus'
  | 'reference';

export interface Folder {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  icon?: string;
  status: 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Resource {
  id: string;
  folderId?: string | null;
  subjectId: string;
  subjectName: string;
  branchId: string;
  semester: number;
  universityId: string;
  type: ResourceType;
  title: string;
  description: string;
  url: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  isDemo: boolean;
  uploadedAt: string;
}

export type ExamType = 'CIE' | 'SEE' | 'Model' | 'Practice';

export interface PYQ {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  branchId: string;
  semester: number;
  universityId: string;
  year: number;
  examType: ExamType;
  url: string;
  isDemo: boolean;
}

// ---- Calculator Types ----

export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F';

export const GRADE_POINTS: Record<GradeLetter, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
};

export interface SGPASubjectEntry {
  id: string;
  subjectName: string;
  credits: number;
  grade: GradeLetter;
}

export interface SemesterGPA {
  id: string;
  semester: number;
  sgpa: number;
}

// ---- Study Planner Types ----

export interface StudySubject {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hoursNeeded: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  durationHours: number;
  day: string;
  date: string;
  completed: boolean;
  focusTopics?: string;
}

export interface StudyPlan {
  id: string;
  examDate: string;
  dailyHours: number;
  subjects: StudySubject[];
  schedule: StudySession[];
  createdAt: string;
  aiStrategy?: string;
  tips?: string[];
  targetGoal?: string;
}

// ---- Quiz Types ----

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizConfig {
  subjectId: string;
  subjectName: string;
  unit: string;
  difficulty: QuizDifficulty;
  count: number;
}

export interface QuizResult {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

// ---- Placement Types ----

export interface PlacementCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  resources: PlacementResource[];
}

export interface PlacementResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'roadmap' | 'practice' | 'interview' | 'link';
}

// ---- Search ----

export interface SearchResult {
  id: string;
  title: string;
  type: 'resource' | 'pyq' | 'tool' | 'subject' | 'placement';
  href: string;
  meta?: string;
}
