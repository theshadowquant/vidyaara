import { browserClient, isSupabaseConfigured } from './client';
import type { Folder } from '@/types';
import { slugify } from '@/lib/notesExplorer/vfs';

const LOCAL_STORAGE_FOLDERS_KEY = 'vidyaaraa_dynamic_folders';

function getLocalFolders(): Folder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFolders(folders: Folder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    // ignore
  }
}

export function mapDbFolderToFolder(row: any): Folder {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || slugify(row.name),
    description: row.description || '',
    parentId: row.parent_id || null,
    sortOrder: row.sort_order ?? 0,
    icon: row.icon || 'folder',
    status: row.status || 'active',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch all folders (active by default, or all if includeArchived is true)
 */
export async function fetchFolders(includeArchived = false): Promise<Folder[]> {
  if (!isSupabaseConfigured()) {
    let list = getLocalFolders();
    if (!includeArchived) {
      list = list.filter((f) => f.status !== 'archived');
    }
    return list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  const client = browserClient();
  let query = client.from('folders').select('*').order('sort_order', { ascending: true });

  if (!includeArchived) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching folders from Supabase, falling back to local:', error);
    let list = getLocalFolders();
    if (!includeArchived) {
      list = list.filter((f) => f.status !== 'archived');
    }
    return list;
  }

  const folders = (data as any[]).map(mapDbFolderToFolder);
  // Keep local backup synchronized
  saveLocalFolders(folders);
  return folders;
}

/**
 * Create a new folder under a parent (or at root if parentId is null)
 */
export async function createFolder(params: {
  name: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
}): Promise<Folder> {
  const newId = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const slug = slugify(params.name) || newId;
  const now = new Date().toISOString();

  const newFolder: Folder = {
    id: newId,
    name: params.name.trim(),
    slug,
    description: params.description?.trim() || '',
    parentId: params.parentId || null,
    sortOrder: params.sortOrder ?? 0,
    icon: params.icon || 'folder',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  if (!isSupabaseConfigured()) {
    const list = getLocalFolders();
    saveLocalFolders([...list, newFolder]);
    return newFolder;
  }

  const client = browserClient();
  const insertPayload = {
    id: newId,
    name: newFolder.name,
    slug: newFolder.slug,
    description: newFolder.description,
    parent_id: newFolder.parentId,
    sort_order: newFolder.sortOrder,
    icon: newFolder.icon,
    status: 'active' as const,
  };

  const { data, error } = await client
    .from('folders')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating folder in Supabase, saving to local fallback:', error);
    const list = getLocalFolders();
    saveLocalFolders([...list, newFolder]);
    return newFolder;
  }

  const created = mapDbFolderToFolder(data);
  const list = getLocalFolders();
  saveLocalFolders([...list, created]);
  return created;
}

/**
 * Update folder details (rename, description, icon, sort order)
 */
export async function updateFolder(
  id: string,
  updates: Partial<Folder>
): Promise<Folder | null> {
  const now = new Date().toISOString();
  const list = getLocalFolders();
  const existing = list.find((f) => f.id === id);

  const updatedFolder: Folder = {
    ...(existing || {
      id,
      name: '',
      slug: '',
      status: 'active',
    }),
    ...updates,
    updatedAt: now,
  };

  if (updates.name) {
    updatedFolder.slug = slugify(updates.name);
  }

  // Update local
  saveLocalFolders(list.map((f) => (f.id === id ? updatedFolder : f)));

  if (!isSupabaseConfigured()) {
    return updatedFolder;
  }

  const client = browserClient();
  const payload: any = { updated_at: now };
  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
    payload.slug = slugify(updates.name);
  }
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await client
    .from('folders')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating folder in Supabase:', error);
    return updatedFolder;
  }

  return mapDbFolderToFolder(data);
}

/**
 * Check whether a target folder is a descendant of the folder being moved.
 * Prevents circular folder hierarchy loops.
 */
export function isDescendantFolder(
  allFolders: Folder[],
  folderId: string,
  targetParentId: string | null
): boolean {
  if (!targetParentId) return false;
  if (folderId === targetParentId) return true;

  let current = allFolders.find((f) => f.id === targetParentId);
  while (current && current.parentId) {
    if (current.parentId === folderId) {
      return true;
    }
    current = allFolders.find((f) => f.id === current?.parentId);
  }

  return false;
}

/**
 * Move folder into another parent (with cycle prevention check)
 */
export async function moveFolder(
  id: string,
  newParentId: string | null
): Promise<{ success: boolean; error?: string }> {
  if (id === newParentId) {
    return { success: false, error: 'Cannot move a folder into itself.' };
  }

  const allFolders = await fetchFolders(true);
  if (isDescendantFolder(allFolders, id, newParentId)) {
    return {
      success: false,
      error: 'Cannot move a folder into one of its subfolders.',
    };
  }

  const now = new Date().toISOString();

  // Local update
  saveLocalFolders(
    allFolders.map((f) =>
      f.id === id ? { ...f, parentId: newParentId, updatedAt: now } : f
    )
  );

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const client = browserClient();
  const { error } = await client
    .from('folders')
    .update({ parent_id: newParentId, updated_at: now })
    .eq('id', id);

  if (error) {
    console.error('Error moving folder in Supabase:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Archive a folder (soft-delete, hides from public view)
 */
export async function archiveFolder(id: string): Promise<boolean> {
  const res = await updateFolder(id, { status: 'archived' });
  return !!res;
}

/**
 * Restore an archived folder
 */
export async function restoreFolder(id: string): Promise<boolean> {
  const res = await updateFolder(id, { status: 'active' });
  return !!res;
}

/**
 * Delete a folder (optionally deleting all recursive descendants and unlinking resources)
 */
export async function deleteFolder(
  id: string,
  recursive = true
): Promise<{ success: boolean; error?: string }> {
  const allFolders = await fetchFolders(true);

  // Find all recursive descendants if recursive is enabled
  const getDescendants = (parentId: string): string[] => {
    const children = allFolders.filter((f) => f.parentId === parentId);
    let ids = children.map((c) => c.id);
    for (const child of children) {
      ids = [...ids, ...getDescendants(child.id)];
    }
    return ids;
  };

  const idsToDelete = recursive ? [id, ...getDescendants(id)] : [id];

  // Local storage update
  saveLocalFolders(allFolders.filter((f) => !idsToDelete.includes(f.id)));

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const client = browserClient();
  const { error } = await client.from('folders').delete().in('id', idsToDelete);

  if (error) {
    console.error('Error deleting folder in Supabase:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
