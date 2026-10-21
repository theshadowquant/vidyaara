'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, ExternalLink, Bookmark, Check, FileText, Loader2, Download } from 'lucide-react';
import type { Resource } from '@/types';
import {
  formatGoogleDriveUrl,
  dataUrlToBlob,
  openDocumentInNewTab,
  downloadDocument,
} from '@/lib/utils';

interface DocPreviewModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export function DocPreviewModal({ resource, onClose }: DocPreviewModalProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!resource) return;

    setIframeLoading(true);

    try {
      const items = localStorage.getItem('cf_saved_resources');
      if (items) {
        const list = JSON.parse(items);
        setSaved(list.includes(resource.id));
      }
    } catch {
      setSaved(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resource, onClose]);

  // Convert base64 data URLs to object blob URLs so browser PDF viewer can render them
  const isDataUrl = Boolean(resource?.url && resource.url.startsWith('data:'));

  const previewBlobUrl = useMemo(() => {
    if (!resource?.url) return null;
    if (resource.url.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(resource.url);
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error('Failed to convert base64 to preview blob:', err);
        return null;
      }
    }
    return null;
  }, [resource?.url]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (!resource) return null;

  const targetUrl = isDataUrl
    ? previewBlobUrl || ''
    : resource.url && resource.url !== '#demo' && !resource.url.startsWith('#')
      ? formatGoogleDriveUrl(resource.url)
      : `https://www.google.com/search?q=${encodeURIComponent(
          `VTU ${resource.subjectName} ${resource.title} PDF notes`
        )}`;

  const handleToggleSave = () => {
    try {
      const items = localStorage.getItem('cf_saved_resources');
      const list = items ? JSON.parse(items) : [];
      let updated: string[];

      if (list.includes(resource.id)) {
        updated = list.filter((id: string) => id !== resource.id);
        setSaved(false);
      } else {
        updated = [...list, resource.id];
        setSaved(true);
      }
      localStorage.setItem('cf_saved_resources', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${resource.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <header className="px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg-overlay)] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <FileText size={16} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text-1)] truncate">
                  {resource.title}
                </h3>
                <span className="badge badge-cyan text-[9px] uppercase font-bold hidden sm:inline-block">
                  {resource.type}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-3)] font-mono truncate">
                {resource.subjectName} • Semester {resource.semester}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                saved
                  ? 'bg-[var(--accent)] text-slate-950 border-[var(--accent)]'
                  : 'bg-[var(--bg-raised)] border-[var(--bd)] text-[var(--text-2)] hover:text-[var(--text-1)]'
              }`}
              title={saved ? 'Remove bookmark' : 'Bookmark this note'}
              aria-label={saved ? 'Remove bookmark' : 'Bookmark this note'}
            >
              {saved ? <Check size={14} /> : <Bookmark size={14} />}
              <span className="hidden sm:inline text-[11px]">{saved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={() => downloadDocument(resource.url, resource.fileName || resource.title)}
              className="btn btn-secondary btn-sm text-xs py-1.5 px-2.5 flex items-center gap-1 font-semibold"
              title="Download file to computer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Open in new tab with proper Blob rendering */}
            <button
              type="button"
              onClick={() => openDocumentInNewTab(resource.url, resource.fileName || resource.title)}
              className="btn btn-secondary btn-sm text-xs py-1.5 px-2.5 flex items-center gap-1 font-semibold"
              title="Open document in new tab"
            >
              <span>{isDataUrl ? 'Open Tab' : 'Open Drive'}</span>
              <ExternalLink size={13} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)]"
              title="Close preview (Esc)"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Iframe Document View Container */}
        <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[var(--bg)] text-[var(--text-2)] z-10">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
              <span className="text-xs font-semibold">Loading document preview...</span>
            </div>
          )}

          {targetUrl ? (
            <iframe
              key={targetUrl}
              src={targetUrl}
              title={resource.title}
              className="w-full h-full border-0"
              allow="autoplay"
              onLoad={() => setIframeLoading(false)}
            />
          ) : (
            <div className="text-center p-8 text-xs text-[var(--text-3)]">
              Document preview unavailable. Use the Download button above to view this file.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
