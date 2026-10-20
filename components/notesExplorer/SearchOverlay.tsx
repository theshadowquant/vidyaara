'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, ArrowRight, CornerDownLeft } from 'lucide-react';
import type { Resource } from '@/types';
import { searchResourcesCatalog, SearchResultItem } from '@/lib/notesExplorer/vfs';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onSelectResource: (resource: Resource, folderPath: string[]) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  resources,
  onSelectResource,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const found = searchResourcesCatalog(resources, query);
      setResults(found);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, resources]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search study materials"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[var(--bd)] flex items-center gap-3 bg-[var(--bg-overlay)]">
          <Search size={18} className="text-[var(--text-3)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, subjects, topics, branches..."
            className="flex-1 bg-transparent text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none border-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[var(--text-3)] hover:text-[var(--text-1)]"
            >
              <X size={16} />
            </button>
          )}
          <span className="text-[10px] font-mono text-[var(--text-3)] border border-[var(--bd)] px-1.5 py-0.5 rounded hidden sm:inline-block">
            ESC to close
          </span>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[var(--bd-subtle)]">
          {query.trim() === '' ? (
            <div className="py-8 px-4 text-center text-xs text-[var(--text-3)] space-y-1">
              <p className="font-semibold text-[var(--text-2)]">Type to discover notes instantly</p>
              <p>Search across all engineering streams, semesters, and subjects</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-[var(--text-3)] space-y-1">
              <p className="font-semibold text-[var(--text-2)]">No study materials found</p>
              <p>Try searching with another keyword or check another subject</p>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.resource.id}
                onClick={() => {
                  onSelectResource(item.resource, item.folderPath);
                  onClose();
                }}
                className="w-full p-3 rounded-xl hover:bg-[var(--bg-overlay)] transition-colors text-left flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {item.resource.title}
                    </p>
                    <p className="text-[10px] text-[var(--text-3)] font-mono truncate">
                      {item.resource.subjectName} • Sem {item.resource.semester} • {item.branchName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge badge-cyan text-[9px] uppercase font-bold hidden sm:inline-block">
                    {item.resource.type}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
