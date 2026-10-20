'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  Eye,
  Bookmark,
  Check,
  Calendar,
} from 'lucide-react';
import type { Resource } from '@/types';
import { formatGoogleDriveUrl } from '@/lib/utils';

interface FileCardProps {
  resource: Resource;
  onPreview: (resource: Resource) => void;
}

export function FileCard({ resource, onPreview }: FileCardProps) {
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
      className="group card p-5 hover:border-[var(--accent)] transition-all duration-200 flex flex-col justify-between h-full relative cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPreview(resource);
        }
      }}
      aria-label={`Preview document ${resource.title}`}
    >
      <div className="space-y-3">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <FileText size={18} className="stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="badge badge-cyan text-[10px] uppercase font-bold tracking-wider">
              {formattedType}
            </span>

            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-1.5 rounded-lg border transition-colors ${
                saved
                  ? 'bg-[var(--accent)] text-slate-950 border-[var(--accent)]'
                  : 'bg-[var(--bg-overlay)] border-[var(--bd)] text-[var(--text-3)] hover:text-[var(--accent)]'
              }`}
              title={saved ? 'Remove bookmark' : 'Bookmark this resource'}
              aria-label={saved ? 'Remove bookmark' : 'Bookmark this resource'}
            >
              {saved ? <Check size={13} strokeWidth={2.5} /> : <Bookmark size={13} />}
            </button>
          </div>
        </div>

        {/* Title and Subject */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-semibold text-[var(--accent)] uppercase tracking-wider block">
            {resource.subjectName}
          </span>
          <h4 className="text-sm font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
            {resource.title}
          </h4>
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-xs text-[var(--text-2)] line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[var(--bd-subtle)] mt-4 flex items-center justify-between text-xs">
        <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1">
          <Calendar size={11} />
          <span>{resource.uploadedAt ? resource.uploadedAt.slice(0, 10) : 'Recent'}</span>
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onPreview(resource)}
            className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1 font-semibold"
            title="Preview note inside app"
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>

          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm p-1.5 text-[var(--text-3)] hover:text-[var(--accent)] rounded-lg"
            title="Open original file in new tab"
            aria-label="Open original file in new tab"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
