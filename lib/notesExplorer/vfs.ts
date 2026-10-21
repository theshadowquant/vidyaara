import type { Resource, Folder } from '@/types';
import { branches, semesters, formatBranchName } from '@/data/universities';

export interface ExplorerNode {
  id: string;
  name: string;
  slug: string;
  type: 'folder' | 'file';
  category: 'root' | 'branch' | 'semester' | 'subject' | 'type' | 'custom';
  resourceCount: number;
  resource?: Resource;
  folderId?: string;
  path: string[];
  children: ExplorerNode[];
}

export interface BreadcrumbItem {
  label: string;
  path: string[];
}

export interface SearchResultItem {
  resource: Resource;
  matchedField: 'title' | 'subject' | 'branch' | 'description' | 'type';
  folderPath: string[];
  branchName: string;
}

/**
 * Creates a URL-safe slug from any name or identifier.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds the Virtual Folder Tree.
 * If dynamicFolders are provided by the administrator, builds the exact custom tree.
 * Otherwise, falls back to the structured stream/semester layout.
 */
export function buildVirtualFolderTree(
  resources: Resource[],
  dynamicFolders: Folder[] = []
): ExplorerNode {
  const rootNode: ExplorerNode = {
    id: 'root',
    name: 'Academic Library',
    slug: 'root',
    type: 'folder',
    category: 'root',
    resourceCount: resources.length,
    path: [],
    children: [],
  };

  const activeFolders = dynamicFolders.filter((f) => f.status !== 'archived');

  // If administrator has created dynamic folders, build tree directly from database folders
  if (activeFolders.length > 0) {
    const folderNodeMap = new Map<string, ExplorerNode>();

    // 1. Create nodes for all dynamic folders
    for (const f of activeFolders) {
      folderNodeMap.set(f.id, {
        id: f.id,
        name: f.name,
        slug: f.slug || slugify(f.name) || f.id,
        type: 'folder',
        category: 'custom',
        resourceCount: 0,
        folderId: f.id,
        path: [], // will be computed once tree is linked
        children: [],
      });
    }

    // 2. Attach subfolders to their parents, or to rootNode if parentId is null or missing
    for (const f of activeFolders) {
      const node = folderNodeMap.get(f.id)!;
      if (f.parentId && folderNodeMap.has(f.parentId)) {
        folderNodeMap.get(f.parentId)!.children.push(node);
      } else {
        rootNode.children.push(node);
      }
    }

    // 3. Attach resources to their assigned folder, or directly to root if unassigned/at root
    for (const r of resources) {
      if (r.folderId && folderNodeMap.has(r.folderId)) {
        const targetFolder = folderNodeMap.get(r.folderId)!;
        const fileSlug = slugify(r.title) || r.id;
        targetFolder.children.push({
          id: r.id,
          name: r.title,
          slug: fileSlug,
          type: 'file',
          category: 'type',
          resourceCount: 1,
          resource: r,
          path: [],
          children: [],
        });
      } else {
        // Files uploaded to root or unassigned are directly accessible in root view
        const fileSlug = slugify(r.title) || r.id;
        rootNode.children.push({
          id: r.id,
          name: r.title,
          slug: fileSlug,
          type: 'file',
          category: 'type',
          resourceCount: 1,
          resource: r,
          path: [fileSlug],
          children: [],
        });
      }
    }

    // 5. Recursively compute paths and accurate resource counts
    function populatePathsAndCounts(node: ExplorerNode, parentPath: string[]): number {
      const currentPath = node.id === 'root' ? [] : [...parentPath, node.slug];
      node.path = currentPath;

      let totalCount = 0;
      for (const child of node.children) {
        if (child.type === 'file') {
          child.path = [...currentPath, child.slug];
          totalCount += 1;
        } else {
          totalCount += populatePathsAndCounts(child, currentPath);
        }
      }
      node.resourceCount = totalCount;
      return totalCount;
    }

    populatePathsAndCounts(rootNode, []);
    return rootNode;
  }

  // Fallback: Default Stream -> Semester -> Subject layout when no dynamic folders are configured yet
  const branchMap = new Map<string, Resource[]>();
  for (const r of resources) {
    const bId = r.branchId || 'common';
    if (!branchMap.has(bId)) {
      branchMap.set(bId, []);
    }
    branchMap.get(bId)!.push(r);
  }

  const allBranchIds = new Set<string>([
    ...branches.map((b) => b.id),
    ...Array.from(branchMap.keys()),
  ]);

  for (const branchId of allBranchIds) {
    const branchResources = branchMap.get(branchId) || [];
    const branchMeta = branches.find((b) => b.id === branchId);
    const branchName = branchMeta ? branchMeta.name : formatBranchName(branchId);
    const branchSlug = branchMeta ? branchMeta.slug || branchId : branchId;

    const branchPath = [branchSlug];
    const branchNode: ExplorerNode = {
      id: `branch-${branchId}`,
      name: branchName,
      slug: branchSlug,
      type: 'folder',
      category: 'branch',
      resourceCount: branchResources.length,
      path: branchPath,
      children: [],
    };

    const semMap = new Map<number, Resource[]>();
    for (const r of branchResources) {
      const semNum = r.semester || 1;
      if (!semMap.has(semNum)) {
        semMap.set(semNum, []);
      }
      semMap.get(semNum)!.push(r);
    }

    const semNumbers = Array.from(semMap.keys()).sort((a, b) => a - b);
    const displaySems = semNumbers.length > 0 ? semNumbers : [1, 2, 3, 4, 5, 6, 7, 8];

    for (const semNum of displaySems) {
      const semResources = semMap.get(semNum) || [];
      const semSlug = `sem-${semNum}`;
      const semPath = [...branchPath, semSlug];
      const semMeta = semesters.find((s) => s.id === semNum);
      const semName = semMeta ? semMeta.label : `Semester ${semNum}`;

      const semNode: ExplorerNode = {
        id: `sem-${branchId}-${semNum}`,
        name: semName,
        slug: semSlug,
        type: 'folder',
        category: 'semester',
        resourceCount: semResources.length,
        path: semPath,
        children: [],
      };

      const subjectMap = new Map<string, Resource[]>();
      for (const r of semResources) {
        const subName = (r.subjectName && r.subjectName.trim()) || 'General Modules';
        if (!subjectMap.has(subName)) {
          subjectMap.set(subName, []);
        }
        subjectMap.get(subName)!.push(r);
      }

      for (const [subjName, subjResources] of subjectMap.entries()) {
        const subjSlug = slugify(subjName);
        const subjPath = [...semPath, subjSlug];

        const subjNode: ExplorerNode = {
          id: `subj-${branchId}-${semNum}-${subjSlug}`,
          name: subjName,
          slug: subjSlug,
          type: 'folder',
          category: 'subject',
          resourceCount: subjResources.length,
          path: subjPath,
          children: [],
        };

        for (const res of subjResources) {
          const fileSlug = slugify(res.title) || res.id;
          subjNode.children.push({
            id: res.id,
            name: res.title,
            slug: fileSlug,
            type: 'file',
            category: 'type',
            resourceCount: 1,
            resource: res,
            path: [...subjPath, fileSlug],
            children: [],
          });
        }

        semNode.children.push(subjNode);
      }

      branchNode.children.push(semNode);
    }

    rootNode.children.push(branchNode);
  }

  return rootNode;
}

/**
 * Traverses the virtual tree by URL path segments.
 */
export function getNodeByPath(
  root: ExplorerNode,
  pathSegments: string[]
): ExplorerNode | null {
  if (!pathSegments || pathSegments.length === 0) {
    return root;
  }

  let current: ExplorerNode = root;

  for (const segment of pathSegments) {
    const cleanSegment = segment.trim().toLowerCase();
    const nextNode = current.children.find(
      (child) => child.slug.toLowerCase() === cleanSegment || child.id === cleanSegment
    );

    if (!nextNode) {
      return null;
    }
    current = nextNode;
  }

  return current;
}

/**
 * Builds breadcrumbs trail for current active path.
 */
export function buildBreadcrumbTrail(
  root: ExplorerNode,
  pathSegments: string[]
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [{ label: 'All Resources', path: [] }];

  if (!pathSegments || pathSegments.length === 0) {
    return trail;
  }

  let current = root;
  const accumPath: string[] = [];

  for (const segment of pathSegments) {
    const nextNode = current.children.find(
      (c) => c.slug.toLowerCase() === segment.toLowerCase() || c.id === segment
    );
    accumPath.push(segment);

    if (nextNode) {
      trail.push({
        label: nextNode.name,
        path: [...accumPath],
      });
      current = nextNode;
    } else {
      trail.push({
        label: segment,
        path: [...accumPath],
      });
    }
  }

  return trail;
}

/**
 * Performs fast full-text client search across all loaded resources.
 */
export function searchResourcesCatalog(
  resources: Resource[],
  query: string
): SearchResultItem[] {
  if (!query || !query.trim()) return [];

  const q = query.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  for (const r of resources) {
    const titleMatch = r.title.toLowerCase().includes(q);
    const subjMatch = (r.subjectName || '').toLowerCase().includes(q);
    const descMatch = (r.description || '').toLowerCase().includes(q);
    const typeMatch = (r.type || '').toLowerCase().includes(q);
    const branchMeta = branches.find((b) => b.id === r.branchId);
    const branchName = branchMeta ? branchMeta.name : formatBranchName(r.branchId);
    const branchMatch = branchName.toLowerCase().includes(q);

    if (titleMatch || subjMatch || descMatch || typeMatch || branchMatch) {
      const branchSlug = branchMeta ? branchMeta.slug || r.branchId : r.branchId;
      const semSlug = `sem-${r.semester || 1}`;
      const subjSlug = slugify(r.subjectName || 'general');

      results.push({
        resource: r,
        matchedField: titleMatch
          ? 'title'
          : subjMatch
          ? 'subject'
          : branchMatch
          ? 'branch'
          : descMatch
          ? 'description'
          : 'type',
        folderPath: [branchSlug, semSlug, subjSlug],
        branchName,
      });
    }
  }

  return results;
}
