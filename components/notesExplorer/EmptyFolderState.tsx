'use client';

import React from 'react';
import Link from 'next/link';
import { FolderOpen, ArrowLeft, Send } from 'lucide-react';

interface EmptyFolderStateProps {
  folderName: string;
  onNavigateUp: () => void;
}

export function EmptyFolderState({
  folderName,
  onNavigateUp,
}: EmptyFolderStateProps) {
  return (
    <div className="card p-10 sm:p-14 text-center max-w-md mx-auto space-y-5 border border-dashed border-[var(--bd)]">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--bd)] flex items-center justify-center mx-auto text-[var(--accent)] shadow-sm">
        <FolderOpen size={24} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-[var(--text-1)]">
          No resources in this folder yet
        </h3>
        <p className="text-xs text-[var(--text-2)] leading-relaxed">
          There are currently no notes uploaded under <span className="font-semibold text-[var(--text-1)]">{folderName}</span>.
          You can request them or navigate back.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onNavigateUp}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          <span>Go Up Level</span>
        </button>

        <Link
          href="/#request-notes"
          className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold"
        >
          <Send size={13} />
          <span>Request Notes</span>
        </Link>
      </div>
    </div>
  );
}
