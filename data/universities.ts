import type { University, Branch, Subject, Semester } from '@/types';

export const universities: University[] = [
  {
    id: 'vtu',
    name: 'Visvesvaraya Technological University',
    slug: 'vtu',
    shortName: 'VTU',
  },
];

// Unified & grouped branches list for student filters & admin tagging
export const branches: Branch[] = [
  {
    id: 'cse-allied',
    universityId: 'vtu',
    name: 'CSE, ISE & Allied Branches (All Computer Science Streams)',
    slug: 'cse-allied',
    shortName: 'CSE & Allied',
  },
  {
    id: 'cse',
    universityId: 'vtu',
    name: 'Computer Science & Engineering',
    slug: 'cse',
    shortName: 'CSE',
  },
  {
    id: 'ise',
    universityId: 'vtu',
    name: 'Information Science & Engineering',
    slug: 'ise',
    shortName: 'ISE',
  },
  {
    id: 'cse-aiml',
    universityId: 'vtu',
    name: 'CSE (Artificial Intelligence & Machine Learning)',
    slug: 'cse-aiml',
    shortName: 'CSE-AIML',
  },
  {
    id: 'cse-ds',
    universityId: 'vtu',
    name: 'CSE (Data Science)',
    slug: 'cse-ds',
    shortName: 'CSE-DS',
  },
  {
    id: 'cse-cy',
    universityId: 'vtu',
    name: 'CSE (Cyber Security)',
    slug: 'cse-cy',
    shortName: 'CSE-CY',
  },
  {
    id: 'ece',
    universityId: 'vtu',
    name: 'Electronics & Communication Engineering',
    slug: 'ece',
    shortName: 'ECE',
  },
  {
    id: 'eee',
    universityId: 'vtu',
    name: 'Electrical & Electronics Engineering',
    slug: 'eee',
    shortName: 'EEE',
  },
  {
    id: 'me',
    universityId: 'vtu',
    name: 'Mechanical Engineering',
    slug: 'me',
    shortName: 'ME',
  },
  {
    id: 'cv',
    universityId: 'vtu',
    name: 'Civil Engineering',
    slug: 'cv',
    shortName: 'CV',
  },
  {
    id: 'bt',
    universityId: 'vtu',
    name: 'Biotechnology',
    slug: 'bt',
    shortName: 'BT',
  },
  {
    id: 'ae',
    universityId: 'vtu',
    name: 'Aeronautical Engineering',
    slug: 'ae',
    shortName: 'AE',
  },
  {
    id: 'mca',
    universityId: 'vtu',
    name: 'Master of Computer Applications (MCA)',
    slug: 'mca',
    shortName: 'MCA',
  },
  {
    id: 'mba',
    universityId: 'vtu',
    name: 'Master of Business Administration (MBA)',
    slug: 'mba',
    shortName: 'MBA',
  },
  {
    id: 'other',
    universityId: 'vtu',
    name: 'Other VTU Engineering Branches',
    slug: 'other',
    shortName: 'Other Branches',
  },
];

// List of all CSE and Allied branch slugs
export const CSE_ALLIED_BRANCH_IDS = [
  'cse',
  'ise',
  'cse-ds',
  'cse-aiml',
  'cse-cy',
  'cse-allied',
];

/**
 * Checks if a resource/paper branch matches the selected filter branch.
 * If filtering by CSE & Allied (or CSE/ISE/DS/AIML/CY), it automatically matches any CSE, ISE, or Allied branch notes.
 */
export function isBranchMatch(itemBranchId: string, filterBranchId: string): boolean {
  if (!filterBranchId || filterBranchId === 'all') return true;
  
  const cleanItem = (itemBranchId || '').toLowerCase().trim();
  const cleanFilter = (filterBranchId || '').toLowerCase().trim();

  if (cleanItem === cleanFilter) return true;

  const itemBranches = cleanItem.split(',').map((s) => s.trim());
  if (itemBranches.includes(cleanFilter)) return true;

  const isFilterCSE = CSE_ALLIED_BRANCH_IDS.includes(cleanFilter);
  const isItemCSE = itemBranches.some((b) => CSE_ALLIED_BRANCH_IDS.includes(b));

  if (isFilterCSE && isItemCSE) {
    return true;
  }

  return false;
}

export function formatBranchName(branchId: string): string {
  if (!branchId) return 'VTU';
  const clean = branchId.toLowerCase().trim();
  if (clean === 'cse-allied') return 'CSE, ISE & Allied';
  const b = branches.find((item) => item.id.toLowerCase() === clean);
  return b ? b.shortName : branchId.toUpperCase();
}

export const semesters: Semester[] = [
  { id: 1, label: 'Semester 1' },
  { id: 2, label: 'Semester 2' },
  { id: 3, label: 'Semester 3' },
  { id: 4, label: 'Semester 4' },
  { id: 5, label: 'Semester 5' },
  { id: 6, label: 'Semester 6' },
  { id: 7, label: 'Semester 7' },
  { id: 8, label: 'Semester 8' },
];

export const subjects: Subject[] = [
  // Semester 1
  { id: 'cse-s1-maths1', universityId: 'vtu', branchId: 'cse-allied', semester: 1, code: '21MAT11', name: 'Calculus & Linear Algebra', credits: 4 },
  { id: 'cse-s1-phy', universityId: 'vtu', branchId: 'cse-allied', semester: 1, code: '21PHY12', name: 'Engineering Physics', credits: 4 },
  { id: 'cse-s1-bep', universityId: 'vtu', branchId: 'cse-allied', semester: 1, code: '21ELN14', name: 'Basic Electronics', credits: 3 },
  { id: 'cse-s1-cprog', universityId: 'vtu', branchId: 'cse-allied', semester: 1, code: '21CPP14', name: 'C Programming', credits: 3 },

  // Semester 2
  { id: 'cse-s2-maths2', universityId: 'vtu', branchId: 'cse-allied', semester: 2, code: '21MAT21', name: 'Advanced Calculus & Numerical Methods', credits: 4 },
  { id: 'cse-s2-chem', universityId: 'vtu', branchId: 'cse-allied', semester: 2, code: '21CHE22', name: 'Engineering Chemistry', credits: 4 },
  { id: 'cse-s2-bme', universityId: 'vtu', branchId: 'cse-allied', semester: 2, code: '21ME25', name: 'Basic Mechanical Engineering', credits: 3 },

  // Semester 3
  { id: 'cse-s3-ds', universityId: 'vtu', branchId: 'cse-allied', semester: 3, code: '21CS32', name: 'Data Structures', credits: 4 },
  { id: 'cse-s3-dm', universityId: 'vtu', branchId: 'cse-allied', semester: 3, code: '21CS31', name: 'Discrete Mathematics', credits: 3 },
  { id: 'cse-s3-dsa', universityId: 'vtu', branchId: 'cse-allied', semester: 3, code: '21CS33', name: 'Data Structures & Applications', credits: 3 },
  { id: 'cse-s3-math3', universityId: 'vtu', branchId: 'cse-allied', semester: 3, code: '21MAT31', name: 'Transform Calculus & Statistics', credits: 4 },

  // Semester 4
  { id: 'cse-s4-dbms', universityId: 'vtu', branchId: 'cse-allied', semester: 4, code: '21CS42', name: 'Database Management Systems', credits: 4 },
  { id: 'cse-s4-ada', universityId: 'vtu', branchId: 'cse-allied', semester: 4, code: '21CS43', name: 'Analysis & Design of Algorithms', credits: 4 },
  { id: 'cse-s4-java', universityId: 'vtu', branchId: 'cse-allied', semester: 4, code: '21CS44', name: 'Object Oriented Programming with Java', credits: 4 },
  { id: 'cse-s4-flat', universityId: 'vtu', branchId: 'cse-allied', semester: 4, code: '21CS41', name: 'Automata Theory & Computability (ACT / FLAT)', credits: 3 },

  // Semester 5
  { id: 'cse-s5-cn', universityId: 'vtu', branchId: 'cse-allied', semester: 5, code: '21CS51', name: 'Computer Networks', credits: 4 },
  { id: 'cse-s5-os', universityId: 'vtu', branchId: 'cse-allied', semester: 5, code: '21CS52', name: 'Operating Systems', credits: 4 },
  { id: 'cse-s5-se', universityId: 'vtu', branchId: 'cse-allied', semester: 5, code: '21CS53', name: 'Software Engineering & Project Management', credits: 3 },
  { id: 'cse-s5-wt', universityId: 'vtu', branchId: 'cse-allied', semester: 5, code: '21CS55', name: 'Web Technologies', credits: 3 },

  // Semester 6
  { id: 'cse-s6-cdp', universityId: 'vtu', branchId: 'cse-allied', semester: 6, code: '21CS61', name: 'Compiler Design', credits: 4 },
  { id: 'cse-s6-ml', universityId: 'vtu', branchId: 'cse-allied', semester: 6, code: '21CS62', name: 'Machine Learning', credits: 4 },
  { id: 'cse-s6-cgv', universityId: 'vtu', branchId: 'cse-allied', semester: 6, code: '21CS63', name: 'Computer Graphics & Visualization', credits: 3 },
  { id: 'cse-s6-cns', universityId: 'vtu', branchId: 'cse-allied', semester: 6, code: '21CS64', name: 'Cryptography & Network Security', credits: 3 },

  // Semester 7
  { id: 'cse-s7-ai', universityId: 'vtu', branchId: 'cse-allied', semester: 7, code: '21CS71', name: 'Artificial Intelligence', credits: 4 },
  { id: 'cse-s7-dc', universityId: 'vtu', branchId: 'cse-allied', semester: 7, code: '21CS72', name: 'Distributed Computing', credits: 3 },

  // Semester 8
  { id: 'cse-s8-project', universityId: 'vtu', branchId: 'cse-allied', semester: 8, code: '21CSP8', name: 'Project Work', credits: 16 },
];

export function getSubjectsByBranchAndSem(branchId: string, semester: number): Subject[] {
  return subjects.filter((s) => isBranchMatch(s.branchId, branchId) && s.semester === semester);
}

export function getBranchesByUniversity(universityId: string): Branch[] {
  return branches.filter((b) => b.universityId === universityId);
}
