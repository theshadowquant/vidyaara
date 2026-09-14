'use client';

import React, { useState, useEffect } from 'react';
import { FileQuestion, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

import { AdminNoteRequest as RequestItem } from '@/lib/admin-storage';
import { fetchAllRequests, addNoteRequest } from '@/lib/supabase';

export function RequestNotes() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [sem, setSem] = useState('4th Sem');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchAllRequests().then((data) => setRequests(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const newReq = await addNoteRequest({
      subject: subject.trim(),
      branch,
      sem,
      status: 'Under Review',
    });

    setRequests((prev) => [newReq, ...prev]);
    setSubject('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const getStatusBadge = (status: RequestItem['status']) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={11} />
            Available
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <Clock size={11} />
            In Progress
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            <AlertCircle size={11} />
            Under Review
          </span>
        );
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-[var(--bg-overlay)] border-b border-[var(--bd)]" id="request-notes">
      <div className="container-cf max-w-4xl text-center space-y-10">
        
        {/* Title */}
        <div className="space-y-2.5 max-w-2xl mx-auto">
          <span className="badge badge-cyan text-[10px]">Community Requested</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-1)]">
            Can't find your subject notes?
          </h2>
          <p className="text-sm text-[var(--text-2)] max-w-lg mx-auto">
            Submit your subject request below and our team will source verified notes within 24 hours.
          </p>
        </div>

        {/* Request Form & Live Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left items-start">
          
          {/* Request Form */}
          <form
            onSubmit={handleSubmit}
            className="md:col-span-5 card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--bd)]">
              <FileQuestion size={18} className="text-[var(--accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-1)]">Request Subject Notes</h3>
            </div>

            <div className="space-y-1">
              <label className="label">Subject Name / Code</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. 21CS42 Design & Analysis of Algorithms"
                required
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Branch</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} className="select">
                  <option value="CSE">CSE</option>
                  <option value="ISE">ISE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="ME">ME</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="label">Semester</label>
                <select value={sem} onChange={(e) => setSem(e.target.value)} className="select">
                  <option value="1st Sem">1st Sem</option>
                  <option value="2nd Sem">2nd Sem</option>
                  <option value="3rd Sem">3rd Sem</option>
                  <option value="4th Sem">4th Sem</option>
                  <option value="5th Sem">5th Sem</option>
                  <option value="6th Sem">6th Sem</option>
                  <option value="7th Sem">7th Sem</option>
                  <option value="8th Sem">8th Sem</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Send size={14} />
              <span>Submit Note Request</span>
            </button>

            {submitted && (
              <p className="text-xs text-emerald-400 font-medium text-center animate-fade-in">
                ✓ Request submitted! We'll notify you once verified notes are uploaded.
              </p>
            )}
          </form>

          {/* Recent Requests Feed */}
          <div className="md:col-span-7 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              Recent Community Requests
            </h3>

            <div className="space-y-2.5">
              {requests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="card p-3.5 border-[var(--bd)] bg-[var(--bg-raised)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="font-bold text-[var(--text-1)] truncate">{req.subject}</div>
                    <div className="text-[11px] text-[var(--text-3)] flex items-center gap-2">
                      <span className="font-semibold text-[var(--accent)]">{req.branch}</span>
                      <span>•</span>
                      <span>{req.sem}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{getStatusBadge(req.status)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
