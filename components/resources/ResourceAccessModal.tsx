'use client';

import React, { useState, useEffect, useId } from 'react';
import { X, ExternalLink, GraduationCap, User, Hash, CheckCircle, ShieldCheck } from 'lucide-react';
import { recordResourceAccess, setStoredStudentInfo, getStoredStudentInfo } from '@/lib/db/access-logs';
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

export function ResourceAccessModal({ isOpen, onClose, item }: ResourceAccessModalProps) {
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const nameInputId = useId();
  const usnInputId = useId();

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // If already stored, close immediately (safety check)
  useEffect(() => {
    if (isOpen) {
      const existing = getStoredStudentInfo();
      if (existing) {
        setName(existing.name);
        setUsn(existing.usn);
      }
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
      // 1. Permanently remember student info - Never prompt again!
      setStoredStudentInfo(cleanName, cleanUsn);

      // 2. Record access in database for admin visitors counter
      await recordResourceAccess({
        studentName: cleanName,
        usn: cleanUsn,
        resourceId: item.id || null,
        resourceTitle: item.title,
        resourceType: item.type || 'notes',
        branchId: item.branchId || null,
        semester: item.semester || null,
      });

      // 3. Open PDF / resource link
      if (item.url && item.url !== '#demo') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        alert('Verified! In production, your Google Drive PDF / resource link opens directly.');
      }

      onClose();
    } catch (err: any) {
      console.error('Error in student access verification:', err);
      if (item.url && item.url !== '#demo') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md mx-auto my-auto rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)] p-6 shadow-2xl space-y-5 transition-all text-left"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-overlay)] transition-colors"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,170,0.12)] border border-[rgba(0,212,170,0.3)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-sm">
            <GraduationCap size={20} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-[var(--text-1)] tracking-tight">
              One-Time Student Access
            </h2>
            <p className="text-xs text-[var(--text-3)] leading-relaxed">
              Quick 1-time verification to unlock and read this material.
            </p>
          </div>
        </div>

        {/* Document Preview Card */}
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

        {/* One-time guarantee info banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(0,212,170,0.06)] border border-[rgba(0,212,170,0.2)] text-[11px] text-[var(--accent)] font-medium">
          <ShieldCheck size={14} className="shrink-0 text-[var(--accent)]" />
          <span>You only fill this <strong>once</strong>. Next notes open instantly!</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
              <span>VTU USN *</span>
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
              <span>{isSubmitting ? 'Verifying...' : 'Unlock & Open PDF'}</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
