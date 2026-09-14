'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Calculator, FileText, BookOpen, Briefcase, Wrench } from 'lucide-react';
import { searchAll } from '@/data/search';
import type { SearchResult } from '@/types';

const typeIcons = {
  tool: <Wrench size={14} />,
  resource: <FileText size={14} />,
  pyq: <BookOpen size={14} />,
  subject: <Calculator size={14} />,
  placement: <Briefcase size={14} />,
};

const typeLabels: Record<string, string> = {
  tool: 'Tool',
  resource: 'Resource',
  pyq: 'PYQ',
  subject: 'Subject',
  placement: 'Placement',
};

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const r = searchAll(query);
    setResults(r);
    setSelected(0);
  }, [query]);

  const navigate = (href: string) => {
    onClose();
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Search Vidyaaraa"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '15vh',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 101,
          width: 'min(92vw, 560px)',
          backgroundColor: 'var(--bg-raised)',
          borderRadius: '1rem',
          border: '1px solid var(--bd)',
          boxShadow: 'var(--shadow-dropdown)',
          overflow: 'hidden',
        }}
        className="slide-down"
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: '1px solid var(--bd)' }}>
          <Search size={18} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search resources, tools, subjects…"
            aria-label="Search"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-1)',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={onClose}
            className="btn btn-ghost"
            aria-label="Close search"
            style={{ padding: '0.25rem' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Search results"
            style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem', margin: 0, listStyle: 'none' }}
          >
            {results.map((r, i) => (
              <li key={r.id} role="option" aria-selected={i === selected}>
                <button
                  onClick={() => navigate(r.href)}
                  onMouseEnter={() => setSelected(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.6rem',
                    border: 'none',
                    backgroundColor: i === selected ? 'var(--bg-overlay)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-1)',
                    transition: 'background-color 0.1s ease',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.5rem',
                      backgroundColor: i === selected ? 'rgba(0,212,170,0.12)' : 'var(--bg-overlay)',
                      color: i === selected ? 'var(--accent)' : 'var(--text-3)',
                      flexShrink: 0,
                    }}
                  >
                    {typeIcons[r.type] ?? <Search size={14} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </span>
                    {r.meta && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.1rem' }}>
                        {r.meta}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--text-3)',
                      border: '1px solid var(--bd)',
                      borderRadius: '0.25rem',
                      padding: '0.1rem 0.4rem',
                      flexShrink: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {typeLabels[r.type]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : query ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
            <Search size={28} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: '0.875rem' }}>No results for &ldquo;{query}&rdquo;</p>
            <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Try searching for a subject, tool, or topic.</p>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Access
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['SGPA Calculator', 'DBMS Notes', 'ADA PYQ', 'Study Planner', 'Java Lab Manual'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-2)',
                    border: '1px solid var(--bd)',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div
          style={{
            padding: '0.6rem 1rem',
            borderTop: '1px solid var(--bd)',
            display: 'flex',
            gap: '1rem',
            fontSize: '0.72rem',
            color: 'var(--text-3)',
          }}
        >
          <span><kbd style={{ fontFamily: 'monospace' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontFamily: 'monospace' }}>↵</kbd> select</span>
          <span><kbd style={{ fontFamily: 'monospace' }}>Esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}
