'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchResources } from '@/lib/db/resources';
import { formatGoogleDriveUrl } from '@/lib/utils';
import type { Resource } from '@/types';

export function PopularResources() {
  const [popular, setPopular] = useState<Resource[]>([]);

  useEffect(() => {
    fetchResources().then((data) => {
      if (data && data.length > 0) {
        setPopular(data.slice(0, 3));
      }
    });
  }, []);

  if (popular.length === 0) {
    return null;
  }

  return (
    <section className="section bg-[var(--bg)]">
      <div className="container-cf space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-1)]">
              Popular Study Material
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              Handpicked notes and lab manuals with high student engagement.
            </p>
          </div>
          <Link href="/resources" className="btn btn-secondary btn-sm group">
            All Resources
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popular.map((r) => (
            <div key={r.id} className="card p-5 flex flex-col justify-between hover:border-[var(--accent)] transition-all">
              <div className="space-y-3">
                {/* Meta info */}
                <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-[var(--text-3)]">
                  <span>Semester {r.semester} · {r.branchId.toUpperCase()}</span>
                  <span className="badge badge-cyan text-[9px]">{r.type.replace('-', ' ')}</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[var(--text-1)] tracking-tight line-clamp-1">
                  {r.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-[var(--text-2)] leading-relaxed line-clamp-2 h-[36px]">
                  {r.description}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--bd-subtle)] mt-4 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--text-3)]">{r.subjectName}</span>
                <a
                  href={r.url && r.url !== '#demo' ? formatGoogleDriveUrl(r.url) : `/resources`}
                  target={r.url && r.url !== '#demo' ? '_blank' : undefined}
                  rel={r.url && r.url !== '#demo' ? 'noopener noreferrer' : undefined}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold no-underline cursor-pointer"
                  title={`View ${r.title}`}
                >
                  <BookOpen size={12} />
                  <span>View Note</span>
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
