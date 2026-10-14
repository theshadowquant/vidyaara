'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, BookOpen, X } from 'lucide-react';
import { branches, semesters, isBranchMatch } from '@/data/universities';
import { fetchPYQs } from '@/lib/db/pyqs';
import { PYQCard } from '@/components/pyqs/PYQCard';
import type { PYQ } from '@/types';

export default function PYQsPage() {
  const [allPYQs, setAllPYQs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedSem, setSelectedSem] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchPYQs()
      .then((data) => {
        if (mounted) {
          setAllPYQs(data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load PYQs', err);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle reset filters
  const handleClearFilters = () => {
    setSelectedBranch('all');
    setSelectedSem(0);
    setSearchQuery('');
  };

  // Perform filtering on PYQ list
  const filteredPYQs = useMemo(() => {
    return allPYQs.filter((p) => {
      if (selectedBranch && selectedBranch !== 'all' && !isBranchMatch(p.branchId, selectedBranch)) return false;
      if (selectedSem && selectedSem !== 0 && p.semester !== selectedSem) return false;
      
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesSubj = (p.subjectName || '').toLowerCase().includes(q);
        const matchesCode = (p.subjectCode || '').toLowerCase().includes(q);
        const matchesYear = p.year ? p.year.toString().includes(q) : false;
        const matchesType = (p.examType || '').toLowerCase().includes(q);
        return matchesSubj || matchesCode || matchesYear || matchesType;
      }
      return true;
    });
  }, [allPYQs, selectedBranch, selectedSem, searchQuery]);

  return (
    <div className="section min-h-screen bg-[var(--bg)] py-12">
      <div className="container-cf space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-1)]">
            Previous Year Question Papers
          </h1>
          <p className="text-xs text-[var(--text-2)] max-w-lg">
            Find question papers in under 10 seconds. Select your branch and semester to browse.
          </p>
        </div>

        {/* Filters Panel: Branch + Semester + Search Bar */}
        <div className="card p-5 space-y-4 shadow-sm border-[var(--bd)]">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--bd)] pb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-1)] uppercase tracking-wider">
              <SlidersHorizontal size={14} className="text-[var(--brand-violet)]" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleClearFilters}
              className="btn btn-ghost text-[11px] font-bold py-1 px-2 hover:bg-[var(--bg-overlay)] flex items-center gap-1"
            >
              <X size={12} />
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Branch */}
            <div className="md:col-span-4">
              <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                Branch
              </label>
              <select
                className="select text-xs w-full"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">All Branches ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="md:col-span-3">
              <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                Semester
              </label>
              <select
                className="select text-xs w-full"
                value={selectedSem}
                onChange={(e) => setSelectedSem(Number(e.target.value))}
              >
                <option value={0}>All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div className="md:col-span-5">
              <label className="label text-[11px] font-semibold text-[var(--text-2)] mb-1 block">
                Search Question Papers
              </label>
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="Search subject name, subject code, year (2024)..."
                  className="input !pl-10 text-xs w-full"
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card p-4 space-y-3 animate-pulse">
                  <div className="h-4 bg-[var(--bd)] rounded w-1/3" />
                  <div className="h-5 bg-[var(--bd)] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredPYQs.length === 0 ? (
            <div className="card p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-overlay)] border border-[var(--bd)] flex items-center justify-center mx-auto text-[var(--text-3)]">
                <BookOpen size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-1)]">No question papers found</h3>
                <p className="text-xs text-[var(--text-2)] leading-relaxed">
                  No question papers match this filter. Upload question papers from the Admin Panel.
                </p>
              </div>
              <button onClick={handleClearFilters} className="btn btn-secondary btn-sm mx-auto">
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPYQs.map((p) => (
                <div key={p.id} className="fade-in">
                  <PYQCard pyq={p} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
