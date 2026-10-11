'use client';

import React, { useState, useEffect, useId } from 'react';
import { X, Lock, ExternalLink, GraduationCap, CheckCircle2, User, Hash, Sparkles } from 'lucide-react';
import { recordResourceAccess } from '@/lib/db/access-logs';
import { formatBranchName } from '@/data/universities';

export interface ResourceAccessItem {
  id?: string;
  title: string;
  url: string;
  type?: string;
  branchId?: string;
  semester?: number;
  subjectName?: string;
}

interface ResourceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ResourceAccessItem | null;
}

const STORAGE_KEY_STUDENT = 'vidyaaraa_student_info';

export function ResourceAccessModal({ isOpen, onClose, item }: ResourceAccessModalProps) {
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [savedUser, setSavedUser] = useState<{ name: string; usn: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const nameInputId = useId();
  const usnInputId = useId();

  // Load remembered student details on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDENT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name && parsed.usn) {
          setName(parsed.name);
          setUsn(parsed.usn);
          setSavedUser(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUsn = usn.trim().toUpperCase();

    if (!cleanName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!cleanUsn || cleanUsn.length < 5) {
      setErrorMessage('Please enter a valid VTU USN (e.g. 1BI21CS001)');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Remember for next time
      localStorage.setItem(
        STORAGE_KEY_STUDENT,
        JSON.stringify({ name: cleanName, usn: cleanUsn })
      );

      // Record access in database
      await recordResourceAccess({
        studentName: cleanName,
        usn: cleanUsn,
        resourceId: item.id || null,
        resourceTitle: item.title,
        resourceType: item.type || 'notes',
        branchId: item.branchId || null,
        semester: item.semester || null,
      });

      // Open PDF / resource link
      if (item.url && item.url !== '#demo') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        alert('This is a demo resource. In production, your Google Drive PDF link opens automatically!');
      }

      onClose();
    } catch (err: any) {
      console.error('Error recording access:', err);
      // Still open link even if logging hits network issue
      if (item.url && item.url !== '#demo') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickContinue = async () => {
    if (!savedUser) return;
    setIsSubmitting(true);
    try {
      await recordResourceAccess({
        studentName: savedUser.name,
        usn: savedUser.usn,
        resourceId: item.id || null,
        resourceTitle: item.title,
        resourceType: item.type || 'notes',
        branchId: item.branchId || null,
        semester: item.semester || null,
      });

      if (item.url && item.url !== '#demo') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="card max-w-md w-full p-6 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-5 relative rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-overlay)] transition-colors"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-xl bg-[rgba(0,212,170,0.12)] border border-[rgba(0,212,170,0.3)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[var(--text-1)] tracking-tight">
              Access Study Resource
            </h2>
            <p className="text-xs text-[var(--text-3)] leading-snug mt-0.5">
              Enter your student details to view & download this material.
            </p>
          </div>
        </div>

        {/* Selected Resource Preview Card */}
        <div className="p-3 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)] space-y-1 text-xs">
          <div className="flex items-center gap-2">
            {item.semester && (
              <span className="badge badge-cyan text-[9px] uppercase font-mono">
                Sem {item.semester}
              </span>
            )}
            {item.branchId && (
              <span className="text-[10px] text-[var(--accent)] font-mono uppercase font-bold">
                {formatBranchName(item.branchId)}
              </span>
            )}
            {item.type && (
              <span className="text-[9px] text-[var(--text-3)] uppercase font-mono ml-auto">
                {item.type.replace('-', ' ')}
              </span>
            )}
          </div>
          <p className="font-bold text-[var(--text-1)] line-clamp-1">{item.title}</p>
        </div>

        {/* Quick Continue Button if already saved */}
        {savedUser && (
          <div className="p-3 rounded-xl border border-[rgba(0,212,170,0.25)] bg-[rgba(0,212,170,0.06)] flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] text-[var(--text-3)] block font-medium">
                Welcome back,
              </span>
              <p className="font-bold text-[var(--accent)] truncate">
                {savedUser.name} <span className="font-mono text-[11px] text-[var(--text-2)]">({savedUser.usn})</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickContinue}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm text-[11px] font-bold px-3 py-1.5 shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <span>Instant Open</span>
              <ExternalLink size={12} />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {savedUser && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)] uppercase font-semibold">
              <span className="h-px bg-[var(--bd)] flex-1"></span>
              <span>Or Update Details</span>
              <span className="h-px bg-[var(--bd)] flex-1"></span>
            </div>
          )}

          <div>
            <label
              htmlFor={nameInputId}
              className="block text-[11px] font-semibold text-[var(--text-2)] mb-1 flex items-center gap-1.5"
            >
              <User size={12} className="text-[var(--accent)]" />
              <span>Full Name *</span>
            </label>
            <input
              id={nameInputId}
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor={usnInputId}
              className="block text-[11px] font-semibold text-[var(--text-2)] mb-1 flex items-center gap-1.5"
            >
              <Hash size={12} className="text-[var(--accent)]" />
              <span>University Seat Number (USN) *</span>
            </label>
            <input
              id={usnInputId}
              type="text"
              required
              placeholder="e.g. 1BI21CS045"
              value={usn}
              onChange={(e) => {
                setUsn(e.target.value.toUpperCase());
                setErrorMessage('');
              }}
              className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-xs text-[var(--text-1)] font-mono uppercase focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {errorMessage && (
            <p className="text-[11px] text-red-400 font-medium">{errorMessage}</p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Opening...' : 'Unlock & View Document'}</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
