'use client';

import React from 'react';
import { Folder, ChevronRight, Layers, BookMarked, GraduationCap } from 'lucide-react';
import type { ExplorerNode } from '@/lib/notesExplorer/vfs';

interface FolderCardProps {
  node: ExplorerNode;
  onOpen: (path: string[]) => void;
}

export function FolderCard({ node, onOpen }: FolderCardProps) {
  // Category-specific visual accents
  const getCategoryIcon = () => {
    switch (node.category) {
      case 'branch':
        return <GraduationCap size={20} className="text-[var(--accent)]" />;
      case 'semester':
        return <Layers size={20} className="text-cyan-500 dark:text-cyan-400" />;
      case 'subject':
        return <BookMarked size={20} className="text-emerald-500 dark:text-emerald-400" />;
      default:
        return <Folder size={20} className="text-[var(--accent)]" />;
    }
  };

  const getBadgeText = () => {
    if (node.category === 'branch') {
      return 'Stream';
    }
    if (node.category === 'semester') {
      return 'Semester';
    }
    if (node.category === 'subject') {
      return 'Subject';
    }
    return 'Folder';
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(node.path)}
      className="group w-full p-4 rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm hover:shadow-md text-left flex flex-col justify-between cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      aria-label={`Open folder ${node.name}, contains ${node.resourceCount} resources`}
    >
      <div className="flex items-start justify-between gap-3 w-full mb-3">
        {/* Folder Icon Tile */}
        <div className="w-11 h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--bd)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(0,212,170,0.1)] group-hover:border-[rgba(0,212,170,0.3)] transition-colors">
          {getCategoryIcon()}
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-full border border-[var(--bd)]">
          {getBadgeText()}
        </span>
      </div>

      <div className="space-y-1 w-full">
        <h3 className="text-sm font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
          {node.name}
        </h3>
        <p className="text-xs text-[var(--text-3)] flex items-center justify-between pt-1">
          <span>
            {node.resourceCount} {node.resourceCount === 1 ? 'file' : 'resources'}
          </span>
          <ChevronRight
            size={14}
            className="text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
          />
        </p>
      </div>
    </button>
  );
}
