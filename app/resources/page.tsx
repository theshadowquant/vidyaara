import { Suspense } from 'react';
import type { Metadata } from 'next';
import { NotesExplorerContainer } from '@/components/notesExplorer/NotesExplorerContainer';
import { Folder } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Notes & Study Materials Explorer — Vidyaaraa',
  description:
    'Browse VTU engineering lecture notes, question banks, syllabus, and lab manuals organized intuitively into interactive stream, semester, and subject folders.',
};

function ExplorerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 bg-[var(--bg-raised)] border border-[var(--bd)] rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="card p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bd)]" />
            <div className="h-4 bg-[var(--bd)] rounded w-3/4" />
            <div className="h-3 bg-[var(--bd)] rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="section min-h-screen bg-[var(--bg)] py-8 sm:py-12">
      <div className="container-cf space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] text-[var(--accent)] text-xs font-bold uppercase tracking-wider">
            <Folder size={13} className="text-[var(--accent)]" />
            <span>Academic Library</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-1)]">
            Notes & Study Materials Explorer
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-2)] max-w-xl leading-relaxed">
            Browse through your academic branches, semesters, and subjects just like folders on Google Drive.
            Open notes instantly inside the app or download them for offline revision.
          </p>
        </div>

        {/* Dynamic Interactive Explorer */}
        <Suspense fallback={<ExplorerSkeleton />}>
          <NotesExplorerContainer />
        </Suspense>
      </div>
    </div>
  );
}
