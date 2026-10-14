'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Loader,
  Printer,
  Bot,
  Lightbulb,
  FileDown,
  Layers,
} from 'lucide-react';
import type { StudySubject, StudySession, StudyPlan } from '@/types';
import { generateStudyPlan, savePlan, getAllPlans, toggleSessionComplete } from '@/lib/planner';
import { exportStudyPlanToPdf } from '@/lib/pdfGenerator';

export function StudyPlanner() {
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [targetGoal, setTargetGoal] = useState('');
  const [subjectsList, setSubjectsList] = useState<StudySubject[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDiff, setNewSubDiff] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [allPlans, setAllPlans] = useState<StudyPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load existing plans on mount
  useEffect(() => {
    const plans = getAllPlans();
    setAllPlans(plans);
    if (plans.length > 0) {
      setCurrentPlan(plans[plans.length - 1]); // Show latest plan
      setIsCreatingNew(false);
    } else {
      setIsCreatingNew(true);
    }
  }, []);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const sub: StudySubject = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newSubName.trim(),
      difficulty: newSubDiff,
      hoursNeeded: newSubDiff === 'easy' ? 4 : newSubDiff === 'medium' ? 8 : 12,
    };

    setSubjectsList([...subjectsList, sub]);
    setNewSubName('');
    setNewSubDiff('medium');
  };

  const handleRemoveSubject = (id: string) => {
    setSubjectsList(subjectsList.filter((s) => s.id !== id));
  };

  // Generate with ChatGPT AI
  const handleGenerateWithAi = async () => {
    if (!examDate || subjectsList.length === 0) return;

    setLoading(true);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate,
          dailyHours,
          subjects: subjectsList,
          targetGoal: targetGoal.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data && data.schedule && Array.isArray(data.schedule)) {
        const plan: StudyPlan = {
          id: `plan-${Date.now()}`,
          examDate,
          dailyHours,
          subjects: subjectsList,
          schedule: data.schedule,
          createdAt: new Date().toISOString(),
          aiStrategy: data.aiStrategy,
          tips: data.tips,
          targetGoal: targetGoal.trim() || undefined,
        };

        savePlan(plan);
        const updated = getAllPlans();
        setAllPlans(updated);
        setCurrentPlan(plan);
        setIsCreatingNew(false);
        return;
      }
    } catch (err) {
      console.error('Failed to generate with AI, falling back to local calculation:', err);
    } finally {
      setLoading(false);
      setIsAiLoading(false);
    }

    // Fallback if network or error
    handleGenerateLocal();
  };

  // Local / Algorithmic plan generator
  const handleGenerateLocal = () => {
    if (!examDate || subjectsList.length === 0) return;

    setLoading(true);
    setTimeout(() => {
      const schedule = generateStudyPlan({
        examDate,
        dailyHours,
        subjects: subjectsList,
      });

      const plan: StudyPlan = {
        id: `plan-${Date.now()}`,
        examDate,
        dailyHours,
        subjects: subjectsList,
        schedule: schedule.map((s) => ({
          ...s,
          focusTopics: `Core module concepts, key diagrams and 10-mark VTU questions for ${s.subjectName}`,
        })),
        createdAt: new Date().toISOString(),
        aiStrategy:
          'Proportional difficulty-weighted revision roadmap calculated for balanced subject coverage.',
        tips: [
          'Solve at least two 10-mark questions without looking at solutions.',
          'Maintain a one-page formula sheet for rapid morning revisions.',
          'Take a 5-minute active rest break every 50 minutes of deep study.',
        ],
        targetGoal: targetGoal.trim() || undefined,
      };

      savePlan(plan);
      const updated = getAllPlans();
      setAllPlans(updated);
      setCurrentPlan(plan);
      setIsCreatingNew(false);
      setLoading(false);
      setIsAiLoading(false);
    }, 600);
  };

  const handleToggleComplete = (sessionId: string) => {
    if (!currentPlan) return;
    const updated = toggleSessionComplete(currentPlan.id, sessionId);
    if (updated) {
      setCurrentPlan(updated);
      setAllPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const handleDownloadPdf = () => {
    if (!currentPlan) return;
    exportStudyPlanToPdf(currentPlan);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSelectPlan = (planId: string) => {
    const found = allPlans.find((p) => p.id === planId);
    if (found) {
      setCurrentPlan(found);
      setIsCreatingNew(false);
    }
  };

  const handleDeleteCurrentPlan = () => {
    if (!currentPlan) return;
    if (confirm('Are you sure you want to delete this study plan?')) {
      const remaining = allPlans.filter((p) => p.id !== currentPlan.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyaaraa_plans', JSON.stringify(remaining));
      }
      setAllPlans(remaining);
      if (remaining.length > 0) {
        setCurrentPlan(remaining[remaining.length - 1]);
        setIsCreatingNew(false);
      } else {
        setCurrentPlan(null);
        setIsCreatingNew(true);
      }
    }
  };

  // Calculations for progress bar
  const totalSessions = currentPlan?.schedule.length ?? 0;
  const completedSessions = currentPlan?.schedule.filter((s) => s.completed).length ?? 0;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const isShowingForm = isCreatingNew || !currentPlan;

  return (
    <div className="space-y-8">
      {/* Top Planner Controls / Mode Switcher */}
      {currentPlan && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                !isShowingForm
                  ? 'bg-[var(--accent)] text-[#0F1729] shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <Calendar size={14} />
              <span>Active Plan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubjectsList([]);
                setExamDate('');
                setTargetGoal('');
                setDailyHours(2);
                setIsCreatingNew(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isShowingForm
                  ? 'bg-[var(--accent)] text-[#0F1729] shadow-sm'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <Plus size={14} />
              <span>+ Create New Plan</span>
            </button>
          </div>

          {/* If multiple plans exist, show quick switcher */}
          {allPlans.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-[var(--text-3)] flex items-center gap-1">
                <Layers size={13} />
                Switch Plan:
              </span>
              <select
                className="select text-xs py-1 px-2.5 bg-[var(--bg-overlay)] border border-[var(--bd)] rounded-lg"
                value={currentPlan.id}
                onChange={(e) => handleSelectPlan(e.target.value)}
              >
                {allPlans.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    Exam {p.examDate} ({p.subjects.length} subjects)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {isShowingForm ? (
        /* CREATE / GENERATE PLAN FORM */
        <div className="card p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--bd)] pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-[var(--text-1)] flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--accent)]" />
                Generate Study Plan with ChatGPT AI
              </h2>
              <p className="text-xs text-[var(--text-2)]">
                Specify your exam schedule, subjects, and study target. ChatGPT will synthesize a custom revision roadmap.
              </p>
            </div>

            {currentPlan && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="btn btn-ghost btn-sm text-xs flex items-center gap-1 self-start sm:self-center text-[var(--text-2)] hover:text-[var(--text-1)]"
              >
                <ArrowLeft size={14} />
                <span>Back to Active Plan</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs & Parameters */}
            <div className="space-y-4">
              <div>
                <label className="label">Exam Target Date</label>
                <input
                  type="date"
                  className="input text-xs"
                  value={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Daily Revision Budget (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="input text-xs"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div>
                <label className="label">Exam Target / Weak Areas (Optional for AI)</label>
                <input
                  type="text"
                  placeholder="e.g. Aiming for 9.0 SGPA, focus more on DBMS SQL & ADA Dynamic Programming"
                  className="input text-xs"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                />
              </div>

              {/* Add Subject Row */}
              <form
                onSubmit={handleAddSubject}
                className="p-4 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)] space-y-3"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] block">
                  Add Subject for Exam
                </span>

                <div>
                  <label className="label text-[10px]">Subject Title</label>
                  <input
                    type="text"
                    className="input py-1.5 text-xs"
                    placeholder="e.g. Database Management Systems"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-grow">
                    <label className="label text-[10px]">Subject Difficulty</label>
                    <select
                      className="select py-1.5 text-xs"
                      value={newSubDiff}
                      onChange={(e) => setNewSubDiff(e.target.value as any)}
                    >
                      <option value="easy">Easy (Less time)</option>
                      <option value="medium">Medium (Moderate time)</option>
                      <option value="hard">Hard (More time)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary text-xs flex-shrink-0 self-end py-2 px-3 flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Subjects List & Generate Actions */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider block">
                  Enrolled Subjects ({subjectsList.length})
                </span>

                {subjectsList.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[var(--bd)] rounded-xl text-xs text-[var(--text-3)]">
                    No subjects added yet. Add subjects on the left to begin your revision roadmap.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {subjectsList.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex justify-between items-center p-3 rounded-lg border border-[var(--bd)] bg-[var(--bg-raised)]"
                      >
                        <div>
                          <span className="text-xs font-bold text-[var(--text-1)] block">{sub.name}</span>
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--text-3)]">
                            Difficulty: {sub.difficulty}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="btn btn-ghost text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg"
                          title="Remove subject"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                {/* Primary AI Button */}
                <button
                  type="button"
                  onClick={handleGenerateWithAi}
                  disabled={!examDate || subjectsList.length === 0 || loading}
                  className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-md hover:brightness-105"
                >
                  {isAiLoading ? (
                    <>
                      <Loader size={16} className="animate-spin text-white" />
                      <span>Synthesizing plan with ChatGPT AI...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={16} className="text-[#0F1729]" />
                      <span>Plan with ChatGPT AI</span>
                      <Sparkles size={14} className="text-yellow-300" />
                    </>
                  )}
                </button>

                {/* Secondary Quick Button */}
                <button
                  type="button"
                  onClick={handleGenerateLocal}
                  disabled={!examDate || subjectsList.length === 0 || loading}
                  className="btn btn-ghost w-full py-2 text-xs text-[var(--text-3)] hover:text-[var(--text-1)] flex items-center justify-center gap-1.5"
                >
                  <span>Quick Algorithmic Plan (Offline)</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE GENERATED SCHEDULE VIEW */
        <div className="space-y-6">
          {/* Dashboard Summary Info & Actions */}
          <div className="card p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-lg font-extrabold text-[var(--text-1)]">
                  Active Revision Plan
                </h2>
                {currentPlan.aiStrategy && (
                  <span className="badge badge-cyan text-[10px] flex items-center gap-1">
                    <Sparkles size={10} />
                    AI Optimized
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-2)]">
                Target Exam Date: <span className="font-semibold text-[var(--text-1)]">{currentPlan.examDate}</span> · Daily Revision: <span className="font-semibold text-[var(--text-1)]">{currentPlan.dailyHours} hrs</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {/* Progress indicator */}
              <div className="text-center md:text-right pr-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-3)] block">
                  Overall Completion
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 bg-[var(--bd)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--accent)] h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-1)]">{progressPercent}%</span>
                </div>
                <span className="text-[10px] text-[var(--text-3)] block mt-0.5">
                  {completedSessions} of {totalSessions} slots finished
                </span>
              </div>

              {/* CREATE NEW PLAN BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setSubjectsList([]);
                  setExamDate('');
                  setTargetGoal('');
                  setDailyHours(2);
                  setIsCreatingNew(true);
                }}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                title="Create another revision plan"
              >
                <Plus size={14} className="text-[var(--accent)]" />
                <span>New Plan</span>
              </button>

              {/* PDF EXPORT BUTTON */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:brightness-110"
                title="Download your study schedule as a printable PDF"
              >
                <FileDown size={14} />
                <span>Download PDF</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary btn-sm p-2 rounded-lg"
                title="Print checklist"
              >
                <Printer size={14} />
              </button>

              {/* Delete Plan */}
              <button
                type="button"
                onClick={handleDeleteCurrentPlan}
                className="btn btn-secondary btn-sm p-2 rounded-lg"
                title="Delete this study plan"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          </div>

          {/* AI Strategy & Recommendations Card */}
          {currentPlan.aiStrategy && (
            <div className="card p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Bot size={16} />
                <span>ChatGPT Academic Strategy</span>
              </div>
              <p className="text-xs text-[var(--text-1)] leading-relaxed">
                {currentPlan.aiStrategy}
              </p>

              {currentPlan.tips && currentPlan.tips.length > 0 && (
                <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] flex items-center gap-1">
                    <Lightbulb size={11} className="text-yellow-500" />
                    Key Exam Revision Tactics
                  </span>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-none p-0 m-0">
                    {currentPlan.tips.map((tip, idx) => (
                      <li key={idx} className="text-[11px] text-[var(--text-2)] flex items-start gap-1.5">
                        <span className="text-[var(--accent)] font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Schedule Slots */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider block">
                Day-by-Day Agenda ({currentPlan.schedule.length} Sessions)
              </h3>
              <span className="text-[10px] text-[var(--text-3)]">
                Click any slot to mark it as completed
              </span>
            </div>

            {currentPlan.schedule.length === 0 ? (
              <div className="card p-8 text-center text-xs text-[var(--text-3)]">
                No slots generated. Adjust exam date or subjects count.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPlan.schedule.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleToggleComplete(session.id)}
                    className={`card p-4 flex flex-col justify-between cursor-pointer border transition-all select-none gap-2.5 ${
                      session.completed
                        ? 'border-[var(--accent)] bg-[rgba(0,212,170,0.03)] opacity-70'
                        : 'border-[var(--bd)] hover:border-[var(--accent)] bg-[var(--bg-raised)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Completion check circle */}
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                            session.completed
                              ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0F1729]'
                              : 'border-[var(--text-3)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {session.completed && <CheckCircle2 size={13} />}
                        </span>

                        <div>
                          <span
                            className={`text-xs font-bold block ${
                              session.completed
                                ? 'line-through text-[var(--text-3)]'
                                : 'text-[var(--text-1)]'
                            }`}
                          >
                            {session.subjectName}
                          </span>
                          <span className="text-[10px] text-[var(--text-3)] font-mono block mt-0.5">
                            {session.day}, {session.date}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[var(--text-2)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded border border-[var(--bd)] flex-shrink-0">
                        {session.durationHours} hrs
                      </span>
                    </div>

                    {/* Focus Topics Pill */}
                    {session.focusTopics && (
                      <div className="pl-8 text-[11px] text-[var(--text-2)] italic line-clamp-1 border-t border-[var(--bd-subtle)] pt-1.5">
                        <span className="text-[var(--accent)] not-italic font-semibold text-[10px] mr-1">
                          Focus:
                        </span>
                        {session.focusTopics}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
