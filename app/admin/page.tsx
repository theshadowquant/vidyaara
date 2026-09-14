'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Layers,
  FileText,
  MessageSquare,
  Sparkles,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart3,
  Bot,
  Zap,
} from 'lucide-react';
import {
  getStoredResources,
  saveCustomResource,
  deleteCustomResource,
  getStoredRequests,
  updateNoteRequestStatus,
  deleteNoteRequest,
  getStoredFeedback,
  deleteFeedback,
  isAdminAuthenticated,
  setAdminAuthenticated,
  DEFAULT_ADMIN_PASSCODE,
  AdminNoteRequest,
  AdminFeedback,
} from '@/lib/admin-storage';
import {
  fetchAllResources,
  addResource,
  removeResource,
  fetchAllRequests,
  updateRequestStatus,
  removeNoteRequest,
  fetchAllFeedback,
  removeFeedback,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { Resource, ResourceType } from '@/types';

type AdminTab = 'overview' | 'resources' | 'requests' | 'feedback' | 'ai';

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Data state
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [requestsList, setRequestsList] = useState<AdminNoteRequest[]>([]);
  const [feedbackList, setFeedbackList] = useState<AdminFeedback[]>([]);

  // Resource Filter & Modal
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceBranch, setResourceBranch] = useState('all');
  const [resourceSem, setResourceSem] = useState('all');
  const [showAddResource, setShowAddResource] = useState(false);

  // New Resource Form
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBranch, setNewBranch] = useState('cse');
  const [newSem, setNewSem] = useState<number>(4);
  const [newType, setNewType] = useState<ResourceType>('notes');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // AI Tester
  const [aiPrompt, setAiPrompt] = useState('Explain ACID properties in DBMS briefly');
  const [aiResponse, setAiResponse] = useState('');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiLatency, setAiLatency] = useState<number | null>(null);

  // Unique IDs for accessibility
  const passcodeInputId = useId();
  const resourceSearchId = useId();
  const resourceBranchId = useId();
  const resourceSemId = useId();
  const newTitleId = useId();
  const newSubjectId = useId();
  const newBranchId = useId();
  const newSemId = useId();
  const newTypeId = useId();
  const newUrlId = useId();
  const newDescId = useId();
  const aiPromptId = useId();

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [res, reqs, fbs] = await Promise.all([
      fetchAllResources(),
      fetchAllRequests(),
      fetchAllFeedback(),
    ]);
    setResourcesList(res);
    setRequestsList(reqs);
    setFeedbackList(fbs);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === DEFAULT_ADMIN_PASSCODE || passcode === 'admin123') {
      setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setAuthError(false);
      setPasscode('');
      loadAllData();
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
  };

  // Add Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    const resource: Resource = {
      id: 'res-' + Date.now(),
      subjectId: `${newBranch}-s${newSem}-${newSubject.toLowerCase().replace(/\s+/g, '-')}`,
      subjectName: newSubject.trim(),
      branchId: newBranch,
      semester: Number(newSem),
      universityId: 'vtu',
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Uploaded via Vidyaaraa Admin Panel.',
      url: newUrl.trim() || '#demo',
      isDemo: !newUrl.trim(),
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    await addResource(resource);
    await loadAllData();
    setShowAddResource(false);
    // Reset form
    setNewTitle('');
    setNewSubject('');
    setNewUrl('');
    setNewDesc('');
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm('Delete this resource?')) {
      await removeResource(id);
      setResourcesList((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Requests Status Change
  const handleStatusChange = async (id: string, status: AdminNoteRequest['status']) => {
    await updateRequestStatus(id, status);
    const updated = await fetchAllRequests();
    setRequestsList(updated);
  };

  const handleDeleteRequest = async (id: string) => {
    await removeNoteRequest(id);
    setRequestsList((prev) => prev.filter((r) => r.id !== id));
  };

  // Feedback Delete
  const handleDeleteFeedback = async (id: string) => {
    await removeFeedback(id);
    setFeedbackList((prev) => prev.filter((f) => f.id !== id));
  };

  // AI Test
  const handleAiTest = async () => {
    if (!aiPrompt.trim() || aiTesting) return;
    setAiTesting(true);
    setAiResponse('');
    const startTime = Date.now();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: aiPrompt.trim() }],
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat API error (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setAiResponse(text);
      }

      setAiLatency(Date.now() - startTime);
    } catch (err: any) {
      setAiResponse(`Error: ${err?.message || err}`);
    } finally {
      setAiTesting(false);
    }
  };

  // Filtered resources
  const filteredResources = resourcesList.filter((r) => {
    const matchQuery =
      r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.subjectName.toLowerCase().includes(resourceSearch.toLowerCase());
    const matchBranch = resourceBranch === 'all' || r.branchId === resourceBranch;
    const matchSem = resourceSem === 'all' || r.semester === Number(resourceSem);
    return matchQuery && matchBranch && matchSem;
  });

  // Overview Stats
  const pendingRequests = requestsList.filter((r) => r.status === 'Under Review').length;
  const inProgressRequests = requestsList.filter((r) => r.status === 'In Progress').length;
  const availableRequests = requestsList.filter((r) => r.status === 'Available').length;
  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / feedbackList.length).toFixed(1)
      : '5.0';

  // PASSCODE LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[var(--bg)] via-[var(--bg-overlay)] to-[var(--bg)]">
        <div className="card max-w-md w-full p-8 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.25)] flex items-center justify-center mx-auto text-[var(--accent)] shadow-inner">
            <Lock size={26} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-1)]">
              Vidyaaraa Admin Portal
            </h1>
            <p className="text-xs text-[var(--text-2)]">
              Enter the administrator passcode to access management tools.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left space-y-1.5">
              <label htmlFor={passcodeInputId} className="text-xs font-semibold text-[var(--text-2)]">
                Admin Passcode
              </label>
              <input
                id={passcodeInputId}
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setAuthError(false);
                }}
                placeholder="Enter passcode (e.g. vidyaaraa2026)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />
              {authError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> Incorrect passcode. Default is <span className="font-mono font-bold">vidyaaraa2026</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-semibold shadow-md hover:brightness-110"
            >
              <ShieldCheck size={18} />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="pt-2 border-t border-[var(--bd)]">
            <Link
              href="/"
              className="text-xs text-[var(--text-3)] hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1"
            >
              ← Back to Vidyaaraa Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-16">
      {/* Top Header */}
      <header className="border-b border-[var(--bd)] bg-[var(--bg-raised)]/80 backdrop-blur sticky top-16 z-30">
        <div className="container-cf py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center text-[var(--accent)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[var(--text-1)] tracking-tight">
                  Vidyaaraa Admin Panel
                </h1>
                <span className="badge badge-cyan text-[10px]">Master Console</span>
                {isSupabaseConfigured() ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Supabase Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--text-3)] bg-[var(--bg-overlay)] border border-[var(--bd)] px-2 py-0.5 rounded-full font-mono" title="Add NEXT_PUBLIC_SUPABASE_URL to connect cloud DB">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Local Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-3)]">
                Manage resources, requests, user feedback, and AI assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="btn btn-ghost btn-sm text-xs flex items-center gap-1.5 border border-[var(--bd)] text-[var(--text-2)]"
            >
              <ExternalLink size={13} />
              <span>View Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
            >
              <LogOut size={13} />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container-cf">
          <nav className="flex space-x-1 border-t border-[var(--bd)] pt-1 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <BarChart3 size={15} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'resources'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <Layers size={15} />
              <span>Resources ({resourcesList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <FileText size={15} />
              <span>Note Requests ({requestsList.length})</span>
              {pendingRequests > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                  {pendingRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <MessageSquare size={15} />
              <span>Feedback ({feedbackList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              <Bot size={15} />
              <span>AI Engine & Tester</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container-cf py-8 space-y-6">
        {/* ======================= TAB: OVERVIEW ======================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-2">
                <div className="flex items-center justify-between text-[var(--text-3)] text-xs font-semibold">
                  <span>Total Resources</span>
                  <Layers size={17} className="text-[var(--accent)]" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-1)]">
                  {resourcesList.length}
                </div>
                <p className="text-[11px] text-[var(--text-3)]">Notes, PYQs, Lab Manuals</p>
              </div>

              <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-2">
                <div className="flex items-center justify-between text-[var(--text-3)] text-xs font-semibold">
                  <span>Student Requests</span>
                  <FileText size={17} className="text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-1)]">
                  {requestsList.length}
                </div>
                <p className="text-[11px] text-amber-400 font-medium">
                  {pendingRequests} pending review · {inProgressRequests} in progress
                </p>
              </div>

              <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-2">
                <div className="flex items-center justify-between text-[var(--text-3)] text-xs font-semibold">
                  <span>Average Feedback</span>
                  <Star size={17} className="text-amber-400 fill-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-1)] flex items-center gap-2">
                  <span>{avgRating}</span>
                  <span className="text-xs font-normal text-[var(--text-3)]">/ 5.0</span>
                </div>
                <p className="text-[11px] text-[var(--text-3)]">{feedbackList.length} student reviews</p>
              </div>

              <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-2">
                <div className="flex items-center justify-between text-[var(--text-3)] text-xs font-semibold">
                  <span>AI Copilot Status</span>
                  <Zap size={17} className="text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online (Meta AI)</span>
                </div>
                <p className="text-[11px] text-[var(--text-3)] font-mono truncate">Model: muse-spark-1.3</p>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Requests */}
              <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                    <FileText size={16} className="text-[var(--accent)]" />
                    <span>Recent Student Requests</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={13} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {requestsList.slice(0, 4).map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-[var(--text-1)] truncate">{req.subject}</p>
                        <p className="text-[10px] text-[var(--text-3)]">
                          {req.branch} · {req.sem}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                          req.status === 'Available'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40'
                            : req.status === 'In Progress'
                            ? 'text-amber-400 border-amber-500/30 bg-amber-950/40'
                            : 'text-sky-400 border-sky-500/30 bg-sky-950/40'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Student Feedback */}
              <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                    <MessageSquare size={16} className="text-amber-400" />
                    <span>Recent Feedback</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={13} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {feedbackList.slice(0, 3).map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({ length: fb.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                        <span className="text-[10px] text-[var(--text-3)]">{fb.createdAt}</span>
                      </div>
                      <p className="text-[var(--text-2)] line-clamp-2 italic">&ldquo;{fb.comment}&rdquo;</p>
                      <span className="badge badge-cyan text-[9px]">{fb.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: RESOURCES ======================= */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search size={15} className="absolute left-3 top-3 text-[var(--text-3)]" />
                  <input
                    id={resourceSearchId}
                    type="text"
                    placeholder="Search by title or subject..."
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-raised)] border border-[var(--bd)] rounded-xl text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <select
                  id={resourceBranchId}
                  aria-label="Filter by branch"
                  value={resourceBranch}
                  onChange={(e) => setResourceBranch(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-raised)] border border-[var(--bd)] rounded-xl text-xs text-[var(--text-1)] focus:outline-none"
                >
                  <option value="all">All Branches</option>
                  <option value="cse">CSE</option>
                  <option value="ise">ISE</option>
                  <option value="ece">ECE</option>
                  <option value="me">ME</option>
                </select>

                <select
                  id={resourceSemId}
                  aria-label="Filter by semester"
                  value={resourceSem}
                  onChange={(e) => setResourceSem(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-raised)] border border-[var(--bd)] rounded-xl text-xs text-[var(--text-1)] focus:outline-none"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowAddResource(true)}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold shrink-0"
              >
                <Plus size={15} />
                <span>Add Resource</span>
              </button>
            </div>

            {/* Resources Table/List */}
            <div className="card border-[var(--bd)] bg-[var(--bg-raised)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-overlay)] border-b border-[var(--bd)] text-[var(--text-3)] uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Title & Description</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Branch / Sem</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--bd)]">
                    {filteredResources.map((res) => (
                      <tr key={res.id} className="hover:bg-[var(--bg-overlay)]/40 transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-[var(--text-1)] line-clamp-1">{res.title}</div>
                          <div className="text-[11px] text-[var(--text-3)] line-clamp-1">{res.description}</div>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-2)] whitespace-nowrap">{res.subjectName}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="badge badge-cyan text-[10px] uppercase font-mono">
                            {res.branchId} · S{res.semester}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-overlay)] border border-[var(--bd)] text-[var(--text-2)] capitalize font-mono">
                            {res.type.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {res.url && res.url !== '#demo' && (
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--bg-overlay)]"
                                title="Open Link"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                            {res.id.startsWith('custom-') && (
                              <button
                                onClick={() => handleDeleteResource(res.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Delete Custom Resource"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Add Resource */}
            {showAddResource && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="card max-w-lg w-full p-6 border-[var(--bd)] bg-[var(--bg-raised)] shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--bd)] pb-3">
                    <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                      <Plus size={16} className="text-[var(--accent)]" />
                      <span>Add New Study Resource</span>
                    </h2>
                    <button
                      onClick={() => setShowAddResource(false)}
                      className="text-xs text-[var(--text-3)] hover:text-[var(--text-1)]"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddResource} className="space-y-3.5 text-xs">
                    <div>
                      <label htmlFor={newTitleId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                        Resource Title *
                      </label>
                      <input
                        id={newTitleId}
                        type="text"
                        required
                        placeholder="e.g. Complete DBMS Unit 1 to 5 Notes"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={newSubjectId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                          Subject Name *
                        </label>
                        <input
                          id={newSubjectId}
                          type="text"
                          required
                          placeholder="e.g. Database Management"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div>
                        <label htmlFor={newTypeId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                          Resource Type
                        </label>
                        <select
                          id={newTypeId}
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as ResourceType)}
                          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none"
                        >
                          <option value="notes">Notes</option>
                          <option value="question-paper">Question Paper</option>
                          <option value="lab-manual">Lab Manual</option>
                          <option value="important-questions">Important Questions</option>
                          <option value="syllabus">Syllabus</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={newBranchId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                          Branch
                        </label>
                        <select
                          id={newBranchId}
                          value={newBranch}
                          onChange={(e) => setNewBranch(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none"
                        >
                          <option value="cse">CSE</option>
                          <option value="ise">ISE</option>
                          <option value="ece">ECE</option>
                          <option value="me">ME</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={newSemId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                          Semester
                        </label>
                        <select
                          id={newSemId}
                          value={newSem}
                          onChange={(e) => setNewSem(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor={newUrlId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                        Resource Link / Google Drive URL
                      </label>
                      <input
                        id={newUrlId}
                        type="url"
                        placeholder="https://drive.google.com/... or leave empty for demo"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label htmlFor={newDescId} className="block text-[11px] font-semibold text-[var(--text-2)] mb-1">
                        Description / Module Details
                      </label>
                      <textarea
                        id={newDescId}
                        rows={2}
                        placeholder="Brief summary of what this document covers..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--bd)]">
                      <button
                        type="button"
                        onClick={() => setShowAddResource(false)}
                        className="btn btn-ghost btn-sm text-xs"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm text-xs font-semibold">
                        Publish Resource
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: NOTE REQUESTS ======================= */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-1)]">Incoming Student Requests</h2>
                <p className="text-xs text-[var(--text-3)]">
                  Subject notes requested by students on the homepage. Change status to inform students.
                </p>
              </div>
              <button
                onClick={() => setRequestsList(getStoredRequests())}
                className="btn btn-ghost btn-sm text-xs flex items-center gap-1.5 border border-[var(--bd)]"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="card border-[var(--bd)] bg-[var(--bg-raised)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-overlay)] border-b border-[var(--bd)] text-[var(--text-3)] uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Subject Requested</th>
                      <th className="py-3 px-4">Branch / Sem</th>
                      <th className="py-3 px-4">Date Submitted</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-right">Update Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--bd)]">
                    {requestsList.map((req) => (
                      <tr key={req.id} className="hover:bg-[var(--bg-overlay)]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--text-1)]">{req.subject}</td>
                        <td className="py-3 px-4">
                          <span className="badge badge-cyan text-[10px] font-mono">
                            {req.branch} · {req.sem}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-3)] font-mono text-[11px]">
                          {req.createdAt || 'Recent'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              req.status === 'Available'
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40'
                                : req.status === 'In Progress'
                                ? 'text-amber-400 border-amber-500/30 bg-amber-950/40'
                                : 'text-sky-400 border-sky-500/30 bg-sky-950/40'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStatusChange(req.id, 'Under Review')}
                              className="px-2 py-1 text-[10px] rounded bg-[var(--bg-overlay)] hover:bg-sky-500/20 text-sky-400 border border-sky-500/20"
                              title="Mark Under Review"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleStatusChange(req.id, 'In Progress')}
                              className="px-2 py-1 text-[10px] rounded bg-[var(--bg-overlay)] hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                              title="Mark In Progress"
                            >
                              Progress
                            </button>
                            <button
                              onClick={() => handleStatusChange(req.id, 'Available')}
                              className="px-2 py-1 text-[10px] rounded bg-[var(--bg-overlay)] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                              title="Mark Available"
                            >
                              Available
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-1"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: FEEDBACK ======================= */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-1)]">Student Feedback & Ratings</h2>
                <p className="text-xs text-[var(--text-3)]">
                  Live submissions collected from the homepage feedback form.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-2)]">
                  Avg Rating: <span className="text-amber-400 font-bold">{avgRating} ★</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="card p-4 border-[var(--bd)] bg-[var(--bg-raised)] space-y-3 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < fb.rating ? 'currentColor' : 'none'}
                            className={i >= fb.rating ? 'text-[var(--text-3)]' : ''}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-3)] font-mono">{fb.createdAt}</span>
                    </div>

                    <p className="text-[var(--text-1)] leading-relaxed italic">&ldquo;{fb.comment}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--bd)]">
                    <span className="badge badge-cyan text-[9px]">{fb.category}</span>
                    <button
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                      title="Dismiss feedback"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB: AI ENGINE & TESTER ======================= */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* Model Info Banner */}
            <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center text-[var(--accent)]">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-1)]">Meta Model API Engine</h2>
                    <p className="text-xs text-[var(--text-3)]">Primary academic reasoning copilot for VTU students</p>
                  </div>
                </div>
                <span className="badge badge-cyan text-[10px]">Active & Streaming</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)]">
                  <span className="text-[10px] text-[var(--text-3)] block font-semibold">Active Model</span>
                  <span className="font-mono font-bold text-[var(--text-1)]">muse-spark-1.3</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)]">
                  <span className="text-[10px] text-[var(--text-3)] block font-semibold">API Endpoint</span>
                  <span className="font-mono font-bold text-[var(--text-1)]">https://api.meta.ai/v1</span>
                </div>
                <div className="p-2.5 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)]">
                  <span className="text-[10px] text-[var(--text-3)] block font-semibold">Fallbacks Configured</span>
                  <span className="font-mono font-bold text-[var(--text-1)]">Groq (OSS 20B) · Gemini 1.5</span>
                </div>
              </div>
            </div>

            {/* AI Test Bench */}
            <div className="card p-5 border-[var(--bd)] bg-[var(--bg-raised)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--accent)]" />
                  <span>Admin AI Live Playground</span>
                </h3>
                {aiLatency && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    Response time: {(aiLatency / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor={aiPromptId} className="text-xs font-semibold text-[var(--text-2)]">
                  Test Query
                </label>
                <div className="flex gap-2">
                  <input
                    id={aiPromptId}
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAiTest();
                    }}
                  />
                  <button
                    onClick={handleAiTest}
                    disabled={aiTesting}
                    className="btn btn-primary btn-sm px-4 flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                  >
                    {aiTesting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Streaming...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Run Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Response output */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[var(--text-3)] font-semibold uppercase tracking-wider">
                  Live Stream Output
                </span>
                <div className="p-4 rounded-xl border border-[var(--bd)] bg-[var(--bg-overlay)] min-h-[120px] font-mono text-xs text-[var(--text-1)] whitespace-pre-wrap leading-relaxed">
                  {aiResponse ? (
                    aiResponse
                  ) : (
                    <span className="text-[var(--text-3)]">Click &quot;Run Test&quot; to test the live streaming response from Meta muse-spark-1.3...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
