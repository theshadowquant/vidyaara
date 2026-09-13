'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  X,
  ChevronDown,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Calculator,
  Briefcase,
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AIMode = 'Academic' | 'Exam PYQs' | 'Calculator' | 'Placement';
export type AIContextScope = 'Auto' | 'VTU CSE' | 'VTU ISE' | 'VTU ECE' | 'General';

export function VidyaaraaAiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AIMode>('Academic');
  const [scope, setScope] = useState<AIContextScope>('Auto');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const scopeDropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape closes widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modeDropdownRef.current &&
        !modeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowModeDropdown(false);
      }
      if (
        scopeDropdownRef.current &&
        !scopeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowScopeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || isLoading) return;

    setError(null);

    // Prefix input with mode context if non-standard
    let promptWithContext = textToSend.trim();
    if (mode === 'Exam PYQs' && !promptWithContext.toLowerCase().includes('pyq')) {
      promptWithContext = `[Mode: Exam PYQs] ${promptWithContext}`;
    } else if (mode === 'Calculator' && !promptWithContext.toLowerCase().includes('calculate')) {
      promptWithContext = `[Mode: Calculator] ${promptWithContext}`;
    } else if (mode === 'Placement' && !promptWithContext.toLowerCase().includes('placement')) {
      promptWithContext = `[Mode: Placement] ${promptWithContext}`;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!overridePrompt) setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content === textToSend.trim() ? promptWithContext : m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('API response failed');
      }

      if (!response.body) {
        throw new Error('No stream body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulatedText }
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error('[Vidyaaraa AI Widget] Request error:', err);
      setError("Vidyaaraa AI couldn't respond right now. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        handleSend(lastUserMsg.content);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside
      aria-label="Vidyaaraa AI Assistant"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end"
    >
      {/* 1. EXPANDED BORDERBEAM CHATBOT PANEL */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vidyaaraa AI Chat"
          className="relative mb-3 w-[calc(100vw-28px)] sm:w-[410px] h-[520px] max-h-[82vh] rounded-2xl bg-[var(--bg-raised)] border border-[var(--bd)] shadow-2xl flex flex-col overflow-hidden transition-all duration-250 ease-out animate-in fade-in slide-in-from-bottom-3"
          style={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)' }}
        >
          {/* BorderBeam Animated Frame */}
          <BorderBeam size="md" colorVariant="colorful" borderWidth={1.5} duration={7} />

          {/* Chat Header */}
          <header className="px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg-overlay)]/90 backdrop-blur-sm flex items-center justify-between flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00D4AA] to-[#7C3AED] flex items-center justify-center text-slate-950 font-bold shadow-sm">
                <Sparkles size={15} className="text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[var(--text-1)] tracking-tight">
                    Vidyaaraa AI
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-3)]">Academic Copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="btn btn-ghost btn-sm p-1.5 text-[var(--text-3)] hover:text-red-400 rounded-md"
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm p-1.5 text-[var(--text-3)] hover:text-[var(--text-1)] rounded-md"
                title="Close chat"
                aria-label="Close Vidyaaraa AI"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 relative z-10 scrollbar-thin">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center p-4 my-auto space-y-4 fade-in">
                <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center text-[var(--accent)]">
                  <Bot size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[var(--text-1)]">
                    Vidyaaraa AI
                  </h3>
                  <p className="text-xs text-[var(--text-2)] max-w-xs leading-relaxed">
                    Ask me about VTU notes, subjects, PYQs, exams, placements, or anything you're studying.
                  </p>
                </div>

                <div className="w-full grid grid-cols-1 gap-1.5 pt-1 text-left">
                  {[
                    { label: 'What is DBMS?', icon: BookOpen },
                    { label: 'Explain binary search', icon: HelpCircle },
                    { label: 'Give me ADA important questions', icon: Briefcase },
                    { label: '8.5 + 7.8', icon: Calculator },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.label)}
                        className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-overlay)] border border-[var(--bd)] hover:border-[var(--accent)] hover:text-[var(--text-1)] transition-colors flex items-center justify-between text-[var(--text-2)]"
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={12} className="text-[var(--accent)]" />
                          <span>{item.label}</span>
                        </span>
                        <span className="text-[10px] text-[var(--accent)]">→</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Conversation Messages */
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 text-xs ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md bg-[rgba(0,212,170,0.12)] border border-[rgba(0,212,170,0.25)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-[var(--accent)] text-slate-950 font-medium rounded-tr-none'
                        : 'bg-[var(--bg-overlay)] border border-[var(--bd)] text-[var(--text-1)] rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : msg.content ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <div className="flex items-center gap-1.5 text-[var(--text-3)] text-[11px] py-0.5">
                        <span className="spinner w-3 h-3" />
                        <span>Vidyaaraa AI is thinking...</span>
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1 text-right ${
                        msg.role === 'user' ? 'text-slate-800/80' : 'text-[var(--text-3)]'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-md bg-[var(--bg-overlay)] border border-[var(--bd)] flex items-center justify-center text-[var(--text-2)] flex-shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Error UI */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-2">
                <span>{error}</span>
                <button
                  onClick={handleRetry}
                  className="btn btn-secondary btn-sm text-[11px] py-1 px-2 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Retry</span>
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls Bar ([ Academic ▼ ] [ Auto ▼ ]) */}
          <div className="px-3 py-1.5 border-t border-[var(--bd)] bg-[var(--bg-overlay)]/60 flex items-center justify-between text-[11px] relative z-10">
            <div className="flex items-center gap-1.5">
              {/* Mode Selector */}
              <div className="relative" ref={modeDropdownRef}>
                <button
                  onClick={() => setShowModeDropdown((v) => !v)}
                  className="px-2 py-1 rounded bg-[var(--bg-raised)] border border-[var(--bd)] text-[var(--text-2)] hover:text-[var(--text-1)] flex items-center gap-1 font-medium text-[11px] transition-colors"
                >
                  <span>{mode}</span>
                  <ChevronDown size={11} className="text-[var(--text-3)]" />
                </button>
                {showModeDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-32 rounded-lg bg-[var(--bg-raised)] border border-[var(--bd)] shadow-lg py-1 z-30 slide-down">
                    {(['Academic', 'Exam PYQs', 'Calculator', 'Placement'] as AIMode[]).map(
                      (m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setMode(m);
                            setShowModeDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1 text-[11px] hover:bg-[var(--bg-overlay)] ${
                            mode === m
                              ? 'text-[var(--accent)] font-semibold'
                              : 'text-[var(--text-2)]'
                          }`}
                        >
                          {m}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Scope Selector */}
              <div className="relative" ref={scopeDropdownRef}>
                <button
                  onClick={() => setShowScopeDropdown((v) => !v)}
                  className="px-2 py-1 rounded bg-[var(--bg-raised)] border border-[var(--bd)] text-[var(--text-2)] hover:text-[var(--text-1)] flex items-center gap-1 font-medium text-[11px] transition-colors"
                >
                  <span>{scope}</span>
                  <ChevronDown size={11} className="text-[var(--text-3)]" />
                </button>
                {showScopeDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-28 rounded-lg bg-[var(--bg-raised)] border border-[var(--bd)] shadow-lg py-1 z-30 slide-down">
                    {(['Auto', 'VTU CSE', 'VTU ISE', 'VTU ECE', 'General'] as AIContextScope[]).map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setScope(s);
                            setShowScopeDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1 text-[11px] hover:bg-[var(--bg-overlay)] ${
                            scope === s
                              ? 'text-[var(--accent)] font-semibold'
                              : 'text-[var(--text-2)]'
                          }`}
                        >
                          {s}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <span className="text-[10px] text-[var(--text-3)] font-mono">
              Meta AI Powered
            </span>
          </div>

          {/* Chat Input Dock */}
          <footer className="p-2.5 border-t border-[var(--bd)] bg-[var(--bg-raised)] relative z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--bd)] rounded-xl p-1 focus-within:border-[var(--accent)] transition-colors"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Vidyaaraa AI anything..."
                rows={1}
                className="flex-1 bg-transparent text-xs text-[var(--text-1)] placeholder-[var(--text-3)] px-2.5 py-1.5 outline-none resize-none max-h-24"
                style={{ minHeight: '2.25rem' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn btn-primary p-2 rounded-lg flex-shrink-0"
                title="Send message"
                aria-label="Send message"
              >
                {isLoading ? (
                  <span className="spinner w-3.5 h-3.5" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </form>
          </footer>
        </div>
      )}

      {/* 2. COMPACT FLOATING LAUNCHER BUTTON */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Vidyaaraa AI' : 'Open Vidyaaraa AI'}
        className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[var(--bg-raised)] border border-[rgba(0,212,170,0.3)] shadow-lg hover:border-[var(--accent)] hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
        style={{
          boxShadow: isOpen
            ? '0 0 0 2px rgba(0, 212, 170, 0.3)'
            : '0 8px 20px rgba(0, 0, 0, 0.25), 0 0 12px rgba(0, 212, 170, 0.15)',
        }}
      >
        <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00D4AA] to-[#7C3AED] flex items-center justify-center text-slate-950 font-bold shadow-sm group-hover:scale-105 transition-transform">
          <Sparkles size={13} className="text-white animate-pulse" />
        </span>
        <span className="text-xs font-bold text-[var(--text-1)] tracking-tight">
          Vidyaaraa AI
        </span>
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping opacity-75" />
      </button>
    </aside>
  );
}
