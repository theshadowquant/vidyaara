'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Folder as FolderIcon,
  FolderPlus,
  Upload,
  UploadCloud,
  FileText,
  Trash2,
  Edit3,
  Move,
  Archive,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  LayoutGrid,
  List,
  ArrowLeft,
  FileUp,
  FolderArchive,
  RotateCcw,
} from 'lucide-react';
import type { Folder, Resource, ResourceType } from '@/types';
import {
  fetchFolders,
  createFolder,
  updateFolder,
  moveFolder,
  deleteFolder,
  archiveFolder,
  restoreFolder,
} from '@/lib/db/folders';
import {
  fetchResources,
  createResource,
  deleteResource,
  moveResource,
  updateResource,
} from '@/lib/db/resources';
import { formatGoogleDriveUrl } from '@/lib/utils';
import { DocPreviewModal } from '@/components/notesExplorer/DocPreviewModal';

interface PendingUploadItem {
  id: string;
  name: string;
  size: number;
  type: ResourceType;
  file?: File;
  url?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  relativePath?: string;
}

export function AdminFileManager() {
  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'explorer' | 'all' | 'archived'>('explorer');

  // Modals & Drawers
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('folder');

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [moveFolderTarget, setMoveFolderTarget] = useState<Folder | null>(null);
  const [moveFileTarget, setMoveFileTarget] = useState<Resource | null>(null);
  const [selectedDestinationFolderId, setSelectedDestinationFolderId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<Folder | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'link' | 'files' | 'directory'>('link');
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualType, setManualType] = useState<ResourceType>('notes');
  const [manualDesc, setManualDesc] = useState('');
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);

  // File Preview Modal
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [foldersData, resourcesData] = await Promise.all([
        fetchFolders(true), // include archived
        fetchResources(),
      ]);
      setFolders(foldersData || []);
      setResources(resourcesData || []);
    } catch (err) {
      console.error('Failed to load admin file manager data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current folder object
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const trail: { id: string | null; name: string }[] = [{ id: null, name: 'Root Library' }];
    if (!currentFolderId) return trail;

    const path: { id: string | null; name: string }[] = [];
    let curr: Folder | undefined = folders.find((f) => f.id === currentFolderId);
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) : undefined;
    }
    return [...trail, ...path];
  }, [folders, currentFolderId]);

  // Active items in current folder
  const currentSubFolders = useMemo(() => {
    return folders.filter((f) => {
      if (f.status === 'archived') return false;
      return currentFolderId ? f.parentId === currentFolderId : !f.parentId;
    });
  }, [folders, currentFolderId]);

  const currentFiles = useMemo(() => {
    return resources.filter((r) => {
      return currentFolderId ? r.folderId === currentFolderId : !r.folderId;
    });
  }, [resources, currentFolderId]);

  const archivedFolders = useMemo(() => {
    return folders.filter((f) => f.status === 'archived');
  }, [folders]);

  // Folder helper count
  const getFolderChildCounts = (folderId: string) => {
    const subFolderCount = folders.filter((f) => f.parentId === folderId && f.status !== 'archived').length;
    const fileCount = resources.filter((r) => r.folderId === folderId).length;
    return { subFolderCount, fileCount };
  };

  // CREATE FOLDER
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const created = await createFolder({
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        parentId: currentFolderId,
        icon: newFolderIcon,
      });

      setFolders((prev) => [...prev, created]);
      setNewFolderName('');
      setNewFolderDesc('');
      setShowCreateFolderModal(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // RENAME FOLDER
  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;

    try {
      const updated = await updateFolder(renameTarget.id, {
        name: renameValue.trim(),
      });
      if (updated) {
        setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
      setRenameTarget(null);
      setRenameValue('');
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  };

  // MOVE FOLDER
  const handleMoveFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveFolderTarget) return;

    setMoveError(null);
    const result = await moveFolder(moveFolderTarget.id, selectedDestinationFolderId);

    if (!result.success) {
      setMoveError(result.error || 'Failed to move folder');
      return;
    }

    setFolders((prev) =>
      prev.map((f) =>
        f.id === moveFolderTarget.id
          ? { ...f, parentId: selectedDestinationFolderId }
          : f
      )
    );
    setMoveFolderTarget(null);
  };

  // MOVE FILE
  const handleMoveFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveFileTarget) return;

    const success = await moveResource(moveFileTarget.id, selectedDestinationFolderId);
    if (success) {
      setResources((prev) =>
        prev.map((r) =>
          r.id === moveFileTarget.id
            ? { ...r, folderId: selectedDestinationFolderId }
            : r
        )
      );
      setMoveFileTarget(null);
    }
  };

  // DELETE FOLDER
  const handleDeleteFolderConfirm = async () => {
    if (!deleteConfirmFolder) return;

    const result = await deleteFolder(deleteConfirmFolder.id, true);
    if (result.success) {
      setFolders((prev) => prev.filter((f) => f.id !== deleteConfirmFolder.id));
      if (currentFolderId === deleteConfirmFolder.id) {
        setCurrentFolderId(deleteConfirmFolder.parentId || null);
      }
      setDeleteConfirmFolder(null);
      loadData();
    }
  };

  // ARCHIVE & RESTORE
  const handleArchiveFolder = async (id: string) => {
    const success = await archiveFolder(id);
    if (success) {
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'archived' } : f))
      );
    }
  };

  const handleRestoreFolder = async (id: string) => {
    const success = await restoreFolder(id);
    if (success) {
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'active' } : f))
      );
    }
  };

  // DELETE RESOURCE
  const handleDeleteFile = async (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      const ok = await deleteResource(id);
      if (ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    }
  };

  // FILE SELECTION HANDLERS
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: PendingUploadItem[] = files.map((file) => ({
      id: `up_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: 'notes',
      file,
      status: 'pending',
    }));

    setPendingUploads((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDirectorySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: PendingUploadItem[] = files.map((file) => ({
      id: `up_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: 'notes',
      file,
      relativePath: (file as any).webkitRelativePath || file.name,
      status: 'pending',
    }));

    setPendingUploads((prev) => [...prev, ...newItems]);
    if (dirInputRef.current) dirInputRef.current.value = '';
  };

  // UPLOAD PROCESSOR
  const handleProcessUploads = async () => {
    if (uploadMode === 'link') {
      if (!manualTitle.trim() || !manualUrl.trim()) return;

      setIsProcessingUploads(true);
      try {
        const formattedUrl = formatGoogleDriveUrl(manualUrl.trim());
        const created = await createResource({
          title: manualTitle.trim(),
          url: formattedUrl,
          type: manualType,
          description: manualDesc.trim(),
          folderId: currentFolderId,
          subjectId: '',
          subjectName: currentFolder?.name || 'General',
          branchId: 'other',
          semester: 1,
          universityId: 'vtu',
          isDemo: false,
        });

        if (created) {
          setResources((prev) => [created, ...prev]);
          setManualTitle('');
          setManualUrl('');
          setManualDesc('');
          setShowUploadModal(false);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsProcessingUploads(false);
      }
      return;
    }

    // Direct files or directory uploads
    if (pendingUploads.length === 0) return;

    setIsProcessingUploads(true);

    // Track created folders for directory upload paths
    const createdDirectoryFolders = new Map<string, string>(); // pathString -> folderId

    for (let i = 0; i < pendingUploads.length; i++) {
      const item = pendingUploads[i];
      setPendingUploads((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'uploading' } : p))
      );

      try {
        let targetFolderForFile = currentFolderId;

        // If it's a directory upload with relativePath, create subfolder hierarchy
        if (item.relativePath && item.relativePath.includes('/')) {
          const parts = item.relativePath.split('/');
          parts.pop(); // remove file name

          let parentId = currentFolderId;
          let accumulatedPath = '';

          for (const segment of parts) {
            accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

            if (createdDirectoryFolders.has(accumulatedPath)) {
              parentId = createdDirectoryFolders.get(accumulatedPath)!;
            } else {
              // Check if folder already exists in state
              const existingFolder = folders.find(
                (f) => f.name.toLowerCase() === segment.toLowerCase() && f.parentId === parentId
              );

              if (existingFolder) {
                parentId = existingFolder.id;
                createdDirectoryFolders.set(accumulatedPath, existingFolder.id);
              } else {
                // Create new folder
                const newF = await createFolder({
                  name: segment,
                  parentId,
                  icon: 'folder',
                });
                parentId = newF.id;
                createdDirectoryFolders.set(accumulatedPath, newF.id);
                setFolders((prev) => [...prev, newF]);
              }
            }
          }
          targetFolderForFile = parentId;
        }

        // Upload file or create resource record
        const fileCleanTitle = item.name.replace(/\.[^/.]+$/, '');
        // Create persistent data URL for files up to 5MB, or fallback to blob url
        let persistentFileUrl = item.url || '#';
        if (item.file) {
          if (item.file.size <= 5 * 1024 * 1024) {
            persistentFileUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(URL.createObjectURL(item.file!));
              reader.readAsDataURL(item.file!);
            });
          } else {
            persistentFileUrl = URL.createObjectURL(item.file);
          }
        }

        const created = await createResource({
          title: fileCleanTitle,
          url: persistentFileUrl,
          type: item.type,
          description: `Uploaded document: ${item.name}`,
          folderId: targetFolderForFile,
          subjectId: '',
          subjectName: currentFolder?.name || 'General Modules',
          branchId: 'other',
          semester: 1,
          universityId: 'vtu',
          fileName: item.name,
          fileSizeBytes: item.size,
          mimeType: item.file?.type || 'application/pdf',
          isDemo: false,
        });

        if (created) {
          setResources((prev) => [created, ...prev]);
        }

        setPendingUploads((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'success' } : p))
        );
      } catch (err: any) {
        setPendingUploads((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'error', errorMessage: err?.message || 'Upload failed' } : p
          )
        );
      }
    }

    setIsProcessingUploads(false);
    setTimeout(() => {
      setShowUploadModal(false);
      setPendingUploads([]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Subtabs: Folder Explorer | All Resources Table | Archived Folders */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bd)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('explorer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'explorer'
                ? 'bg-[var(--accent)] text-[#0F1729] shadow-sm'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
          >
            <FolderIcon size={14} />
            <span>Folder Explorer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'all'
                ? 'bg-[var(--accent)] text-[#0F1729] shadow-sm'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
          >
            <List size={14} />
            <span>All Resources ({resources.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('archived')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'archived'
                ? 'bg-[var(--accent)] text-[#0F1729] shadow-sm'
                : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
          >
            <FolderArchive size={14} />
            <span>Archived ({archivedFolders.length})</span>
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn btn-ghost btn-sm p-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text-1)] flex items-center gap-1"
          title="Refresh library from database"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. FOLDER EXPLORER VIEW (GOOGLE DRIVE-STYLE)            */}
      {/* ======================================================== */}
      {activeSubTab === 'explorer' && (
        <div className="space-y-5">
          {/* Action Toolbar */}
          <div className="card p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-raised)] border border-[var(--bd)]">
            {/* Search within Explorer */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-3 text-[var(--text-3)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files & folders here..."
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(true)}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
              >
                <FolderPlus size={14} className="text-[var(--accent)]" />
                <span>New Folder</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadMode('link');
                  setShowUploadModal(true);
                }}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              >
                <Upload size={14} />
                <span>Upload to Folder</span>
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] ml-auto md:ml-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-[var(--accent)] text-slate-950 font-bold'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'list'
                      ? 'bg-[var(--accent)] text-slate-950 font-bold'
                      : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                  }`}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Breadcrumb Trail Bar */}
          <nav
            aria-label="Admin Folder Breadcrumbs"
            className="flex items-center flex-wrap gap-1 text-xs text-[var(--text-2)] px-1 py-1"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.id || 'root'} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight size={13} className="text-[var(--text-3)] opacity-60" />}
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    disabled={isLast}
                    className={`px-2 py-1 rounded-lg transition ${
                      isLast
                        ? 'font-bold text-[var(--text-1)] bg-[var(--bg-overlay)] cursor-default'
                        : 'text-[var(--text-2)] hover:text-[var(--accent)] hover:bg-[var(--bg-overlay)] cursor-pointer'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Main Area: Folders + Files */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-4 space-y-2 bg-[var(--bg-raised)]">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bd)]" />
                  <div className="h-4 bg-[var(--bd)] rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : currentSubFolders.length === 0 && currentFiles.length === 0 ? (
            /* Empty State */
            <div className="card p-12 text-center max-w-md mx-auto space-y-4 border border-dashed border-[var(--bd)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--bd)] flex items-center justify-center mx-auto text-[var(--text-3)]">
                <FolderIcon size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-1)]">This folder is empty</h4>
                <p className="text-xs text-[var(--text-2)]">
                  Create a subfolder or upload notes/study materials into this directory.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(true)}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  <FolderPlus size={13} />
                  <span>Create Subfolder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('link');
                    setShowUploadModal(true);
                  }}
                  className="btn btn-primary btn-sm text-xs"
                >
                  <Upload size={13} />
                  <span>Upload Files</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SUBFOLDERS SECTION */}
              {currentSubFolders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] px-1">
                    Folders ({currentSubFolders.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {currentSubFolders.map((folder) => {
                      const counts = getFolderChildCounts(folder.id);
                      return (
                        <div
                          key={folder.id}
                          className="group card p-3.5 hover:border-[var(--accent)] transition-all bg-[var(--bg-raised)] shadow-sm flex flex-col justify-between relative"
                        >
                          {/* Folder Card Header & Open Click */}
                          <div
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="cursor-pointer space-y-2.5 flex-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <FolderIcon size={19} />
                              </div>

                              <span className="text-[10px] font-mono text-[var(--text-3)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-full border border-[var(--bd)]">
                                {counts.subFolderCount} dirs · {counts.fileCount} files
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                                {folder.name}
                              </h4>
                              {folder.description && (
                                <p className="text-[11px] text-[var(--text-3)] line-clamp-1 mt-0.5">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions Bar */}
                          <div className="pt-2.5 border-t border-[var(--bd-subtle)] mt-3 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => setCurrentFolderId(folder.id)}
                              className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5"
                            >
                              <span>Open</span>
                              <ChevronRight size={12} />
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setRenameTarget(folder);
                                  setRenameValue(folder.name);
                                }}
                                className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-overlay)]"
                                title="Rename folder"
                              >
                                <Edit3 size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMoveFolderTarget(folder);
                                  setSelectedDestinationFolderId(folder.parentId || null);
                                  setMoveError(null);
                                }}
                                className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-overlay)]"
                                title="Move folder"
                              >
                                <Move size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleArchiveFolder(folder.id)}
                                className="p-1 rounded text-[var(--text-3)] hover:text-amber-400 hover:bg-amber-500/10"
                                title="Archive folder"
                              >
                                <Archive size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmFolder(folder)}
                                className="p-1 rounded text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10"
                                title="Delete folder"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FILES SECTION */}
              {currentFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] px-1">
                    Files ({currentFiles.length})
                  </h3>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {currentFiles.map((file) => (
                        <div
                          key={file.id}
                          className="card p-4 hover:border-[var(--accent)] transition-all bg-[var(--bg-raised)] shadow-sm flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                <FileText size={16} />
                              </div>

                              <span className="badge badge-cyan text-[9px] uppercase font-bold">
                                {file.type}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-[var(--text-1)] line-clamp-1">
                                {file.title}
                              </h4>
                              {file.description && (
                                <p className="text-[11px] text-[var(--text-3)] line-clamp-2 mt-0.5">
                                  {file.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-[var(--bd-subtle)] mt-3 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => setPreviewResource(file)}
                              className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>Preview</span>
                            </button>

                            <div className="flex items-center gap-1">
                              {file.url && file.url !== '#' && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text-1)]"
                                  title="Open original link"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setMoveFileTarget(file);
                                  setSelectedDestinationFolderId(file.folderId || null);
                                }}
                                className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-overlay)]"
                                title="Move file to another folder"
                              >
                                <Move size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-1 rounded text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10"
                                title="Delete file"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Table View */
                    <div className="card overflow-hidden border-[var(--bd)] bg-[var(--bg-raised)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--bg-overlay)] border-b border-[var(--bd)] text-[var(--text-3)] uppercase text-[10px] font-bold">
                            <tr>
                              <th className="py-2.5 px-3">Title</th>
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3">Uploaded</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--bd)]">
                            {currentFiles.map((file) => (
                              <tr key={file.id} className="hover:bg-[var(--bg-overlay)]/40 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-[var(--text-1)]">
                                  {file.title}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="badge badge-cyan text-[9px] uppercase font-mono">
                                    {file.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[var(--text-3)] font-mono text-[11px]">
                                  {file.uploadedAt ? file.uploadedAt.slice(0, 10) : 'Recent'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewResource(file)}
                                      className="p-1 text-[var(--text-3)] hover:text-[var(--accent)]"
                                      title="Preview"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMoveFileTarget(file);
                                        setSelectedDestinationFolderId(file.folderId || null);
                                      }}
                                      className="p-1 text-[var(--text-3)] hover:text-[var(--text-1)]"
                                      title="Move"
                                    >
                                      <Move size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFile(file.id)}
                                      className="p-1 text-red-400 hover:text-red-300"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ALL RESOURCES FLAT TABLE VIEW                         */}
      {/* ======================================================== */}
      {activeSubTab === 'all' && (
        <div className="card border-[var(--bd)] bg-[var(--bg-raised)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-overlay)] border-b border-[var(--bd)] text-[var(--text-3)] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Folder Path</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bd)]">
                {resources.map((res) => {
                  const assignedFolder = folders.find((f) => f.id === res.folderId);
                  return (
                    <tr key={res.id} className="hover:bg-[var(--bg-overlay)]/40 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[var(--text-1)] line-clamp-1">{res.title}</div>
                        <div className="text-[11px] text-[var(--text-3)] line-clamp-1">{res.description}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="badge badge-cyan text-[10px] font-mono">
                          {assignedFolder ? assignedFolder.name : 'Root / Legacy'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-overlay)] border border-[var(--bd)] text-[var(--text-2)] capitalize font-mono">
                          {res.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--text-3)] font-mono text-[11px]">
                        {res.uploadedAt ? res.uploadedAt.slice(0, 10) : 'Recent'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewResource(res)}
                            className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)]"
                            title="Preview Note"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setMoveFileTarget(res);
                              setSelectedDestinationFolderId(res.folderId || null);
                            }}
                            className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)]"
                            title="Move to Folder"
                          >
                            <Move size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(res.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete Resource"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ARCHIVED FOLDERS VIEW                                 */}
      {/* ======================================================== */}
      {activeSubTab === 'archived' && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-2)]">
            Archived folders are hidden from the public student view. You can restore them anytime.
          </p>

          {archivedFolders.length === 0 ? (
            <div className="card p-8 text-center text-xs text-[var(--text-3)]">
              No archived folders.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {archivedFolders.map((f) => (
                <div
                  key={f.id}
                  className="card p-4 border-[var(--bd)] bg-[var(--bg-raised)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-1)] truncate">{f.name}</p>
                    <p className="text-[10px] text-[var(--text-3)]">Archived folder</p>
                  </div>

                  <button
                    onClick={() => handleRestoreFolder(f.id)}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE FOLDER                                     */}
      {/* ======================================================== */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                <FolderPlus size={16} className="text-[var(--accent)]" />
                <span>Create New Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] text-[var(--text-3)] block mb-1">
                  Parent Location: <strong className="text-[var(--text-1)]">{currentFolder?.name || 'Root Library'}</strong>
                </span>
              </div>

              <div>
                <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Year, Artificial Intelligence, Unit 1..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Semester 4 Core Engineering subjects"
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm text-xs font-semibold">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RENAME FOLDER                                     */}
      {/* ======================================================== */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-sm w-full p-5 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-1)]">Rename Folder</h3>
            <form onSubmit={handleRenameFolder} className="space-y-3 text-xs">
              <input
                type="text"
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm text-xs font-semibold">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MOVE FOLDER / FILE                                */}
      {/* ======================================================== */}
      {(moveFolderTarget || moveFileTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
              <Move size={16} className="text-[var(--accent)]" />
              <span>
                Move {moveFolderTarget ? `Folder: ${moveFolderTarget.name}` : `File: ${moveFileTarget?.title}`}
              </span>
            </h3>

            {moveError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{moveError}</span>
              </div>
            )}

            <form
              onSubmit={moveFolderTarget ? handleMoveFolderSubmit : handleMoveFileSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                  Select Destination Folder
                </label>
                <select
                  value={selectedDestinationFolderId || ''}
                  onChange={(e) => setSelectedDestinationFolderId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none"
                >
                  <option value="">📁 Root Library (Top Level)</option>
                  {folders
                    .filter((f) => {
                      if (f.status === 'archived') return false;
                      if (moveFolderTarget && f.id === moveFolderTarget.id) return false;
                      return true;
                    })
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--bd)]">
                <button
                  type="button"
                  onClick={() => {
                    setMoveFolderTarget(null);
                    setMoveFileTarget(null);
                    setMoveError(null);
                  }}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm text-xs font-semibold">
                  Move Here
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE FOLDER CONFIRMATION                        */}
      {/* ======================================================== */}
      {deleteConfirmFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Trash2 size={18} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                Delete &ldquo;{deleteConfirmFolder.name}&rdquo;?
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                This will permanently delete this folder, its subfolders, and associated files. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--bd)]">
              <button
                type="button"
                onClick={() => setDeleteConfirmFolder(null)}
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFolderConfirm}
                className="btn btn-primary bg-red-600 hover:bg-red-500 text-white btn-sm text-xs font-semibold border-0"
              >
                Delete Folder &amp; Contents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: UPLOAD FILES / DIRECTORY / GOOGLE DRIVE LINK     */}
      {/* ======================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="card max-w-xl w-full p-6 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[var(--bd)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                  <UploadCloud size={16} className="text-[var(--accent)]" />
                  <span>Upload to Folder</span>
                </h3>
                <span className="text-[10px] text-[var(--text-3)] font-mono">
                  Destination: {currentFolder ? `📁 ${currentFolder.name}` : '📁 Root Library'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setPendingUploads([]);
                }}
                className="text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Upload Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs">
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  uploadMode === 'link'
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}
              >
                Google Drive Link
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('files')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  uploadMode === 'files'
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}
              >
                Direct File(s)
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('directory')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  uploadMode === 'directory'
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
                }`}
              >
                Folder Upload
              </button>
            </div>

            {/* 1. GOOGLE DRIVE LINK MODE */}
            {uploadMode === 'link' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 1 Operating Systems Notes"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                    Google Drive or Document Share URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <p className="text-[10px] text-[var(--text-3)] mt-1">
                    Auto-formats Drive links to /preview so students can view PDFs in-app seamlessly.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                      Resource Category
                    </label>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value as ResourceType)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none"
                    >
                      <option value="notes">Lecture Notes</option>
                      <option value="question-paper">Question Paper / PYQ</option>
                      <option value="important-questions">Important Questions</option>
                      <option value="lab-manual">Lab Manual</option>
                      <option value="syllabus">Syllabus Copy</option>
                    </select>
                  </div>

                  <div>
                    <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                      Short Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Module 1 handwritten notes"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. DIRECT FILES & 3. DIRECTORY UPLOAD MODE */}
            {(uploadMode === 'files' || uploadMode === 'directory') && (
              <div className="space-y-4 text-xs">
                {/* Drag and Drop Box */}
                <div
                  onClick={() => {
                    if (uploadMode === 'files') {
                      fileInputRef.current?.click();
                    } else {
                      dirInputRef.current?.click();
                    }
                  }}
                  className="border-2 border-dashed border-[var(--bd)] hover:border-[var(--accent)] rounded-2xl p-6 text-center cursor-pointer transition bg-[var(--bg-overlay)]/40 hover:bg-[var(--bg-overlay)] space-y-2"
                >
                  <FileUp size={24} className="mx-auto text-[var(--accent)]" />
                  <div>
                    <p className="font-bold text-[var(--text-1)]">
                      {uploadMode === 'files'
                        ? 'Click to choose files or drag & drop here'
                        : 'Click to select an entire folder from your computer'}
                    </p>
                    <p className="text-[10px] text-[var(--text-3)]">
                      {uploadMode === 'directory'
                        ? 'Preserves relative folder structures & auto-creates subfolders'
                        : 'Supports PDF, DOCX, ZIP, PPTX'}
                    </p>
                  </div>
                </div>

                {/* Hidden Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
                <input
                  ref={dirInputRef}
                  type="file"
                  {...({ webkitdirectory: '', directory: '' } as any)}
                  onChange={handleDirectorySelected}
                  className="hidden"
                />

                {/* Pending Upload List */}
                {pendingUploads.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] divide-y divide-[var(--bd-subtle)]">
                    {pendingUploads.map((item) => (
                      <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--text-1)] truncate">{item.name}</p>
                          <p className="text-[10px] text-[var(--text-3)]">
                            {(item.size / 1024).toFixed(0)} KB {item.relativePath && `· ${item.relativePath}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {item.status === 'pending' && (
                            <span className="text-[10px] text-[var(--text-3)]">Ready</span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="text-[10px] text-[var(--accent)] animate-pulse">Uploading...</span>
                          )}
                          {item.status === 'success' && (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                          )}
                          {item.status === 'error' && (
                            <span title={item.errorMessage}>
                              <AlertCircle size={14} className="text-red-400" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPendingUploads((prev) => prev.filter((p) => p.id !== item.id))
                            }
                            disabled={isProcessingUploads}
                            className="p-1 text-[var(--text-3)] hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--bd)]">
              <span className="text-[10px] text-[var(--text-3)] font-mono">
                {uploadMode === 'link'
                  ? '1 Document Link'
                  : `${pendingUploads.length} item(s) selected`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setPendingUploads([]);
                  }}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleProcessUploads}
                  disabled={
                    isProcessingUploads ||
                    (uploadMode === 'link'
                      ? !manualTitle.trim() || !manualUrl.trim()
                      : pendingUploads.length === 0)
                  }
                  className="btn btn-primary btn-sm text-xs font-semibold flex items-center gap-1.5"
                >
                  {isProcessingUploads ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Upload &amp; Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal */}
      <DocPreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  );
}
