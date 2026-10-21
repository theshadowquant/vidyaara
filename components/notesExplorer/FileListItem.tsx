'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Eye, Bookmark, Check } from 'lucide-react';
import type { Resource } from '@/types';
import { formatGoogleDriveUrl, openDocumentInNewTab } from '@/lib/utils';

interface FileListItemProps {
  resource: Resource;
  onPreview: (resource: Resource) => void;
}

export function FileListItem({ resource, onPreview }: FileListItemProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const items = localStorage.getItem('cf_saved_resources');
      const list = items ? JSON.parse(items) : [];
      setSaved(list.includes(resource.id));
    } catch {
      // ignore
    }
  }, [resource.id]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const directUrl =
    resource.url && resource.url !== '#demo' && !resource.url.startsWith('#')
      ? formatGoogleDriveUrl(resource.url)
      : `https://www.google.com/search?q=${encodeURIComponent(
          `VTU ${resource.subjectName} ${resource.title} PDF notes`
        )}`;

  const formattedType = (resource.type || 'notes').replace('-', ' ');

  return (
    <div
      onClick={() => onPreview(resource)}
      className="group w-full p-3.5 rounded-xl bg-[var(--bg-raised)] border border-[var(--bd)] hover:border-[var(--accent)] transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer shadow-sm active:scale-[0.99]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPreview(resource);
        }
      }}
      aria-label={`Open ${resource.title}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <FileText size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors truncate">
              {resource.title}
            </span>
            <span className="badge badge-cyan text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">
              {formattedType}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)] font-mono mt-0.5 truncate">
            <span>{resource.subjectName}</span>
            <span>•</span>
            <span>{resource.uploadedAt ? resource.uploadedAt.slice(0, 10) : 'Recent'}</span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleToggleSave}
          className={`p-1.5 rounded-lg border transition-colors ${
            saved
              ? 'bg-[var(--accent)] text-slate-950 border-[var(--accent)]'
              : 'bg-[var(--bg-overlay)] border-[var(--bd)] text-[var(--text-3)] hover:text-[var(--accent)]'
          }`}
          title={saved ? 'Remove bookmark' : 'Bookmark resource'}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark resource'}
        >
          {saved ? <Check size={12} strokeWidth={2.5} /> : <Bookmark size={12} />}
        </button>

        <button
          type="button"
          onClick={() => onPreview(resource)}
          className="btn btn-secondary btn-sm text-xs py-1 px-2.5 hidden sm:flex items-center gap-1 font-semibold"
          title="Preview note"
        >
          <Eye size={13} />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={() => openDocumentInNewTab(resource.url, resource.fileName || resource.title)}
          className="btn btn-ghost btn-sm p-1.5 text-[var(--text-3)] hover:text-[var(--accent)] rounded-lg"
          title="Open file in new tab"
          aria-label="Open file in new tab"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}
