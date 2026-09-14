'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, Send, Check } from 'lucide-react';
import { saveFeedback } from '@/lib/admin-storage';

export function FeedbackSection() {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('Feature Suggestion');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    saveFeedback(rating, comment.trim(), category);
    setSubmitted(true);
    setComment('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section className="py-12 sm:py-16 bg-[var(--bg)] border-b border-[var(--bd)]" id="feedback">
      <div className="container-cf max-w-3xl text-center space-y-8">
        
        {/* Title */}
        <div className="space-y-2 max-w-xl mx-auto">
          <span className="badge badge-cyan text-[10px]">Continuous Improvement</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-1)]">
            Your feedback matters
          </h2>
          <p className="text-sm text-[var(--text-2)]">
            Help us improve Vidyaaraa. Share your suggestions, report issues, or request new tools.
          </p>
        </div>

        {/* Feedback Card */}
        <form
          onSubmit={handleSubmit}
          className="card p-6 border-[var(--bd)] bg-[var(--bg-raised)] text-left space-y-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[var(--accent)]" />
              <span className="text-sm font-bold text-[var(--text-1)]">Rate your experience</span>
            </div>

            {/* Star Rating Selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="select">
                <option value="Feature Suggestion">Feature Suggestion</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Note / Syllabus Request">Note / Syllabus Request</option>
                <option value="General Feedback">General Feedback</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="label">Your Comments / Suggestions</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What can we build or improve for you?"
                required
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[var(--text-3)]">
              Submissions are reviewed directly by the Vidyaaraa team.
            </span>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Send size={13} />
              <span>Send Feedback</span>
            </button>
          </div>

          {submitted && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Check size={14} />
              <span>Thank you! Your feedback has been sent to our development team.</span>
            </div>
          )}
        </form>

      </div>
    </section>
  );
}
