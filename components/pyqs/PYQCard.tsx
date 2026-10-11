'use client';

import { FileText, Download, ExternalLink, Calendar } from 'lucide-react';
import type { PYQ } from '@/types';
import { useState } from 'react';
import { formatBranchName } from '@/data/universities';
import { ResourceAccessModal } from '@/components/resources/ResourceAccessModal';

export function PYQCard({ pyq }: { pyq: PYQ }) {
  const [showAccessModal, setShowAccessModal] = useState(false);

  return (
    <>
      <div className="card p-4 hover:border-[var(--brand-violet)] transition-all flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Year Badge icon */}
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-overlay)] border border-[var(--bd)] flex flex-col items-center justify-center text-[var(--text-2)] flex-shrink-0">
            <Calendar size={14} className="text-[var(--brand-violet)]" />
            <span className="text-[9px] font-bold font-mono">{pyq.year}</span>
          </div>

          {/* Paper title info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-1)] truncate">
                {pyq.subjectName}
              </span>
              <span className="badge badge-cyan text-[8px] flex-shrink-0">
                {pyq.examType}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-3)] font-mono block mt-0.5">
              Code: {pyq.subjectCode} · Sem {pyq.semester} · {formatBranchName(pyq.branchId)}
            </span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAccessModal(true)}
            className="btn btn-secondary btn-sm p-2 rounded-lg"
            title="Download PDF"
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowAccessModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1 text-xs font-semibold"
          >
            <span>Open</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Access Verification Modal */}
      <ResourceAccessModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        item={{
          id: pyq.id,
          title: `${pyq.subjectName} (${pyq.year} ${pyq.examType})`,
          url: pyq.url,
          type: 'question-paper',
          branchId: pyq.branchId,
          semester: pyq.semester,
          subjectName: pyq.subjectName,
        }}
      />
    </>
  );
}
