'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchResources } from '@/lib/db/resources';
import type { Resource } from '@/types';
import {
  buildVirtualFolderTree,
  getNodeByPath,
  buildBreadcrumbTrail,
  ExplorerNode,
} from '@/lib/notesExplorer/vfs';
import { ExplorerHeader } from './ExplorerHeader';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { FileListItem } from './FileListItem';
import { DocPreviewModal } from './DocPreviewModal';
import { SearchOverlay } from './SearchOverlay';
import { EmptyFolderState } from './EmptyFolderState';

export function NotesExplorerContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchOpen, setSearchOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  // Parse path from URL query (?path=cse-allied/sem-4/dbms)
  const currentPathString = searchParams.get('path') || '';
  const currentPathSegments = useMemo(() => {
    return currentPathString
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [currentPathString]);

  // Load resources from Supabase
  useEffect(() => {
    let mounted = true;
    fetchResources()
      .then((data) => {
        if (mounted) {
          setAllResources(data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load notes resources from database:', err);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Read saved view mode from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('vidyaaraa_notes_view');
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  // Keyboard shortcut '/' opens search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build tree from real database resources
  const vfsRoot = useMemo(() => {
    return buildVirtualFolderTree(allResources);
  }, [allResources]);

  // Resolve current node
  const currentNode = useMemo(() => {
    const node = getNodeByPath(vfsRoot, currentPathSegments);
    return node || vfsRoot;
  }, [vfsRoot, currentPathSegments]);

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbTrail(vfsRoot, currentPathSegments);
  }, [vfsRoot, currentPathSegments]);

  // Navigation handlers
  const handleNavigate = useCallback(
    (newPath: string[]) => {
      const pathParam = newPath.join('/');
      const params = new URLSearchParams(searchParams.toString());
      if (pathParam) {
        params.set('path', pathParam);
      } else {
        params.delete('path');
      }
      router.push(`/resources?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleNavigateUp = useCallback(() => {
    if (currentPathSegments.length === 0) return;
    const parentPath = currentPathSegments.slice(0, -1);
    handleNavigate(parentPath);
  }, [currentPathSegments, handleNavigate]);

  const handleToggleViewMode = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vidyaaraa_notes_view', mode);
    }
  }, []);

  // Separate child folders and child files
  const childFolders = useMemo(() => {
    return currentNode.children.filter((c) => c.type === 'folder');
  }, [currentNode]);

  const childFiles = useMemo(() => {
    return currentNode.children.filter((c) => c.type === 'file');
  }, [currentNode]);

  const handleSelectFromSearch = useCallback(
    (resource: Resource, folderPath: string[]) => {
      handleNavigate(folderPath);
      setPreviewResource(resource);
    },
    [handleNavigate]
  );

  return (
    <div className="space-y-6">
      {/* Explorer Controls & Breadcrumbs */}
      <ExplorerHeader
        breadcrumbs={breadcrumbs}
        onNavigate={handleNavigate}
        onNavigateUp={handleNavigateUp}
        onOpenSearch={() => setSearchOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        itemCount={currentNode.children.length}
      />

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-[var(--bd)]" />
              <div className="h-4 bg-[var(--bd)] rounded w-3/4" />
              <div className="h-3 bg-[var(--bd)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : currentNode.children.length === 0 ? (
        /* Empty Folder State */
        <EmptyFolderState
          folderName={currentNode.name}
          onNavigateUp={handleNavigateUp}
        />
      ) : (
        <div className="space-y-6">
          {/* Folders Section (if any) */}
          {childFolders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
                  Folders ({childFolders.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {childFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    node={folder}
                    onOpen={handleNavigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files / Study Notes Section (if any) */}
          {childFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
                  Study Materials ({childFiles.length})
                </h3>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {childFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      resource={file.resource!}
                      onPreview={(res) => setPreviewResource(res)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {childFiles.map((file) => (
                    <FileListItem
                      key={file.id}
                      resource={file.resource!}
                      onPreview={(res) => setPreviewResource(res)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* In-App Document Preview Modal */}
      <DocPreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />

      {/* Global Quick Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        resources={allResources}
        onSelectResource={handleSelectFromSearch}
      />
    </div>
  );
}
