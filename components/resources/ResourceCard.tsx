'use client';

import { FileText, Download, ExternalLink, Bookmark, Check } from 'lucide-react';
import type { Resource } from '@/types';
import { useState, useEffect } from 'react';
import { formatBranchName } from '@/data/universities';
import { formatGoogleDriveUrl } from '@/lib/utils';

export function ResourceCard({ resource }: { resource: Resource }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items = localStorage.getItem('cf_saved_resources');
    const list = items ? JSON.parse(items) : [];
    setSaved(list.includes(resource.id));
  }, [resource.id]);

  const handleSave = () => {
    const items = localStorage.getItem('cf_saved_resources');
    const list = items ? JSON.parse(items) : [];
    
    let updated;
    if (list.includes(resource.id)) {
      updated = list.filter((id: string) => id !== resource.id);
      setSaved(false);
    } else {
      updated = [...list, resource.id];
      setSaved(true);
    }
    localStorage.setItem('cf_saved_resources', JSON.stringify(updated));
  };

  const handleOpenResource = () => {
    if (resource.url && resource.url !== '#demo') {
      const targetUrl = formatGoogleDriveUrl(resource.url);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('This is a demo resource. In production, your Google Drive PDF link opens automatically!');
    }
  };

  const formattedType = resource.type.replace('-', ' ');

  return (
    <div className="card p-5 hover:border-[var(--accent)] transition-all flex flex-col justify-between h-full relative group">
      
      {/* Save Button */}
      <button
        onClick={handleSave}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-[var(--bg-overlay)] border border-[var(--bd)] text-[var(--text-3)] hover:text-[var(--accent)] transition-colors"
        aria-label={saved ? "Unsave resource" : "Save resource"}
      >
        {saved ? <Check size={14} className="text-[var(--accent)]" /> : <Bookmark size={14} />}
      </button>

      <div className="space-y-4">
        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold text-[var(--text-3)]">
          <span>Sem {resource.semester}</span>
          <span>•</span>
          <span className="text-[var(--accent)] font-mono">{formatBranchName(resource.branchId)}</span>
          <span>•</span>
          <span className="badge badge-cyan text-[9px]">{formattedType}</span>
        </div>

        {/* Title & Subject */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-3)] block">{resource.subjectName}</span>
          <h3 className="text-sm font-bold text-[var(--text-1)] tracking-tight line-clamp-1 leading-snug">
            {resource.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--text-2)] leading-relaxed line-clamp-2 h-[36px]">
          {resource.description}
        </p>
      </div>

      {/* Footer / CTA Actions */}
      <div className="pt-4 border-t border-[var(--bd-subtle)] mt-5 flex items-center justify-between">
        <span className="text-[9px] text-[var(--text-3)] font-mono">
          Uploaded: {resource.uploadedAt}
        </span>

        <button
          type="button"
          onClick={handleOpenResource}
          className="btn btn-primary btn-sm flex items-center gap-1 text-xs font-semibold shadow-sm hover:brightness-110"
        >
          <span>View Notes</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
