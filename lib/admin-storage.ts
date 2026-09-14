import { Resource } from '@/types';
import { resources as defaultResources } from '@/data/resources';

export interface AdminNoteRequest {
  id: string;
  subject: string;
  branch: string;
  sem: string;
  status: 'Available' | 'Under Review' | 'In Progress';
  createdAt?: string;
}

export interface AdminFeedback {
  id: string;
  rating: number;
  comment: string;
  category: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  RESOURCES: 'vidyaaraa_custom_resources',
  REQUESTS: 'vidyaaraa_note_requests',
  FEEDBACK: 'vidyaaraa_feedbacks',
  AUTH: 'vidyaaraa_admin_auth',
};

export const DEFAULT_ADMIN_PASSCODE = 'vidyaaraa2026';

export const INITIAL_REQUESTS: AdminNoteRequest[] = [
  { id: 'req-1', subject: 'Graph Theory & Combinatorics', branch: 'CSE', sem: '4th Sem', status: 'Available', createdAt: '2026-09-10' },
  { id: 'req-2', subject: 'Digital Signal Processing', branch: 'ECE', sem: '5th Sem', status: 'In Progress', createdAt: '2026-09-11' },
  { id: 'req-3', subject: 'Automata Theory & Computability', branch: 'ISE', sem: '5th Sem', status: 'Under Review', createdAt: '2026-09-12' },
  { id: 'req-4', subject: 'Fluid Mechanics Lab Manual', branch: 'ME', sem: '3rd Sem', status: 'Available', createdAt: '2026-09-13' },
];

export const INITIAL_FEEDBACKS: AdminFeedback[] = [
  {
    id: 'fb-1',
    rating: 5,
    comment: 'The VTU 2022 scheme notes and PYQs saved my 4th sem internals! Love the new Vidyaaraa AI assistant.',
    category: 'General Feedback',
    createdAt: '2026-09-12 14:30',
  },
  {
    id: 'fb-2',
    rating: 5,
    comment: 'SGPA calculator is spot on with credits. Can you add 6th sem AIML elective notes?',
    category: 'Content Request',
    createdAt: '2026-09-13 09:15',
  },
  {
    id: 'fb-3',
    rating: 4,
    comment: 'Quick UI, dark mode looks amazing. Please add more model question papers for ISE.',
    category: 'Feature Suggestion',
    createdAt: '2026-09-13 18:45',
  },
];

// Resources
export function getStoredResources(): Resource[] {
  if (typeof window === 'undefined') return defaultResources;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    if (!raw) return defaultResources;
    const custom = JSON.parse(raw);
    return [...custom, ...defaultResources];
  } catch {
    return defaultResources;
  }
}

export function saveCustomResource(resource: Resource): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    const custom: Resource[] = raw ? JSON.parse(raw) : [];
    custom.unshift(resource);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(custom));
  } catch (e) {
    console.error('Failed to save custom resource', e);
  }
}

export function deleteCustomResource(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    if (!raw) return;
    const custom: Resource[] = JSON.parse(raw);
    const filtered = custom.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete custom resource', e);
  }
}

// Note Requests
export function getStoredRequests(): AdminNoteRequest[] {
  if (typeof window === 'undefined') return INITIAL_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUESTS;
  }
}

export function saveNoteRequest(req: Omit<AdminNoteRequest, 'id' | 'createdAt'>): AdminNoteRequest {
  const newReq: AdminNoteRequest = {
    id: 'req-' + Date.now(),
    ...req,
    createdAt: new Date().toISOString().split('T')[0],
  };
  if (typeof window !== 'undefined') {
    try {
      const current = getStoredRequests();
      const updated = [newReq, ...current];
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save note request', e);
    }
  }
  return newReq;
}

export function updateNoteRequestStatus(id: string, status: AdminNoteRequest['status']): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredRequests();
    const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update request status', e);
  }
}

export function deleteNoteRequest(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredRequests();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete request', e);
  }
}

// Feedback
export function getStoredFeedback(): AdminFeedback[] {
  if (typeof window === 'undefined') return INITIAL_FEEDBACKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(INITIAL_FEEDBACKS));
      return INITIAL_FEEDBACKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FEEDBACKS;
  }
}

export function saveFeedback(rating: number, comment: string, category: string): AdminFeedback {
  const item: AdminFeedback = {
    id: 'fb-' + Date.now(),
    rating,
    comment,
    category,
    createdAt: new Date().toLocaleString(),
  };
  if (typeof window !== 'undefined') {
    try {
      const current = getStoredFeedback();
      const updated = [item, ...current];
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save feedback', e);
    }
  }
  return item;
}

export function deleteFeedback(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredFeedback();
    const updated = current.filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete feedback', e);
  }
}

// Authentication
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(val: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (val) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  } catch (e) {
    console.error('Failed to update admin auth', e);
  }
}
