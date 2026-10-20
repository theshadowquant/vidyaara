'use client';

import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/notesExplorer/vfs';

interface BreadcrumbNavProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (path: string[]) => void;
  onNavigateUp: () => void;
}

export function BreadcrumbNav({
  breadcrumbs,
  onNavigate,
  onNavigateUp,
}: BreadcrumbNavProps) {
  const isDeep = breadcrumbs.length > 1;
  const currentItem = breadcrumbs[breadcrumbs.length - 1];

  return (
    <nav
      aria-label="Breadcrumb folder trail"
      className="flex items-center flex-wrap gap-1.5 text-xs text-[var(--text-2)] py-1 overflow-x-auto scrollbar-none"
    >
      {/* Quick Up-Level Button on Mobile & Deep Navigation */}
      {isDeep && (
        <button
          onClick={onNavigateUp}
          className="btn btn-ghost btn-sm p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--bg-overlay)] flex items-center gap-1 mr-1"
          title="Go back to parent folder"
          aria-label="Go back to parent folder"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline text-[11px] font-semibold">Back</span>
        </button>
      )}

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isRoot = index === 0;

        return (
          <div key={item.path.join('/') || 'root'} className="flex items-center gap-1.5 flex-shrink-0">
            {index > 0 && (
              <ChevronRight size={13} className="text-[var(--text-3)] opacity-60 flex-shrink-0" />
            )}

            <button
              onClick={() => onNavigate(item.path)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                isLast
                  ? 'font-bold text-[var(--text-1)] bg-[var(--bg-overlay)]/60 cursor-default'
                  : 'font-medium text-[var(--text-2)] hover:text-[var(--accent)] hover:bg-[var(--bg-overlay)] cursor-pointer'
              }`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isRoot && <Home size={13} className="text-[var(--accent)]" />}
              <span className="truncate max-w-[140px] sm:max-w-[220px]">
                {item.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
