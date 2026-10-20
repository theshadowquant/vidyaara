'use client';

import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { BreadcrumbNav } from './BreadcrumbNav';
import type { BreadcrumbItem } from '@/lib/notesExplorer/vfs';

interface ExplorerHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (path: string[]) => void;
  onNavigateUp: () => void;
  onOpenSearch: () => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  itemCount: number;
}

export function ExplorerHeader({
  breadcrumbs,
  onNavigate,
  onNavigateUp,
  onOpenSearch,
  viewMode,
  onToggleViewMode,
  itemCount,
}: ExplorerHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)] shadow-sm">
        {/* Search Input Affordance */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-3)] hover:text-[var(--text-2)] hover:border-[var(--accent)] transition-all cursor-pointer text-left"
          aria-label="Open search for study notes"
        >
          <div className="flex items-center gap-2">
            <Search size={15} className="text-[var(--accent)]" />
            <span>Search subjects, notes, modules, PYQs...</span>
          </div>
          <span className="text-[10px] font-mono border border-[var(--bd)] px-1.5 py-0.5 rounded text-[var(--text-3)] hidden md:inline-block">
            /
          </span>
        </button>

        {/* Right Tools: View Toggle & Item Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
          <span className="text-xs text-[var(--text-3)] font-mono">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg)] border border-[var(--bd)]">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
              title="Grid view"
              aria-label="Switch to grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
              title="List view"
              aria-label="Switch to list view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Trail Navigation */}
      <div className="px-1">
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          onNavigate={onNavigate}
          onNavigateUp={onNavigateUp}
        />
      </div>
    </div>
  );
}
