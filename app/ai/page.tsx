'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Trash2, Bot, User, ArrowRight, BookOpen, Calculator, FileText, HelpCircle } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  { icon: Sparkles, label: 'Say Hello', prompt: 'hi' },
  { icon: BookOpen, label: 'What is DBMS?', prompt: 'What is DBMS?' },
  { icon: FileText, label: 'DBMS Normalization', prompt: 'Explain DBMS normalization in detail with examples.' },
  { icon: HelpCircle, label: 'ADA Exam PYQs', prompt: 'Give me important ADA questions for exam.' },
  { icon: Calculator, label: 'Calculate CGPA', prompt: 'Calculate my CGPA' },
  { icon: Calculator, label: 'Simple Math', prompt: '8.5 + 7.8' },
];

export default function VidyaaraaAIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!overridePrompt) setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      if (!response.body) {
        throw new Error('No stream response received');
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
            msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: 'Vidyaaraa AI is temporarily unavailable. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pt-16 bg-[var(--bg)] text-[var(--text-1)]">
      {/* Top Header */}
      <header className="border-b border-[var(--bd)] bg-[var(--bg-raised)] py-3.5 px-4 sticky top-16 z-30 shadow-sm">
        <div className="container-cf max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00D4AA] to-[#7C3AED] flex items-center justify-center text-slate-900 shadow-md">
              <Sparkles size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-[var(--text-1)]">
                  Vidyaaraa AI
                </h1>
                <span className="badge badge-cyan text-[10px]">Academic Copilot</span>
              </div>
              <p className="text-xs text-[var(--text-2)]">
                VTU & Engineering Study Assistant · Meta AI Powered
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="btn btn-ghost btn-sm text-xs text-[var(--text-3)] hover:text-red-400 flex items-center gap-1.5"
              title="Clear conversation"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 container-cf max-w-4xl w-full flex flex-col px-4 py-6">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="my-auto flex flex-col items-center text-center space-y-6 max-w-xl mx-auto py-8 fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center text-[var(--accent)] shadow-lg">
              <Bot size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Hey! 👋 I'm <span className="text-gradient">Vidyaaraa AI</span>
              </h2>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">
                Your instant academic copilot for VTU subjects, 2-mark & 5-mark exam answers, formulas, notes, and placement prep.
              </p>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
              {SAMPLE_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="card p-3 flex items-center justify-between text-xs hover:border-[var(--accent)] hover:bg-[var(--bg-overlay)] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="p-1.5 rounded-md bg-[rgba(0,212,170,0.1)] text-[var(--accent)] flex-shrink-0">
                        <Icon size={14} />
                      </span>
                      <span className="font-medium text-[var(--text-1)] truncate">{item.label}</span>
                    </div>
                    <ArrowRight size={13} className="text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Messages Stream */
          <div className="space-y-4 pb-24 w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-[rgba(0,212,170,0.12)] border border-[rgba(0,212,170,0.25)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 mt-0.5">
                    <Bot size={18} />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent)] text-slate-950 font-medium rounded-tr-none'
                      : 'card bg-[var(--bg-raised)] text-[var(--text-1)] rounded-tl-none border-[var(--bd)]'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : msg.content ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-2 text-[var(--text-3)] text-xs py-1">
                      <span className="spinner w-3.5 h-3.5" />
                      <span>Vidyaaraa AI is thinking...</span>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 flex justify-end ${
                      msg.role === 'user' ? 'text-slate-800/80' : 'text-[var(--text-3)]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-overlay)] border border-[var(--bd)] flex items-center justify-center text-[var(--text-2)] flex-shrink-0 mt-0.5">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Floating Input Dock */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-raised)]/90 backdrop-blur-md border-t border-[var(--bd)] py-3 px-4">
        <div className="container-cf max-w-4xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--bd)] rounded-xl p-1.5 focus-within:border-[var(--accent)] transition-colors shadow-inner"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vidyaaraa AI anything (e.g., What is DBMS?, ADA PYQs, 8.5 + 7.8)..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-[var(--text-1)] placeholder-[var(--text-3)] px-3 py-2 outline-none resize-none max-h-32"
              style={{ minHeight: '2.5rem' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn btn-primary p-2.5 rounded-lg flex-shrink-0"
              title="Send message"
            >
              {isLoading ? <span className="spinner w-4 h-4" /> : <Send size={16} />}
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-3)] mt-1.5 px-1">
            <span>Press Enter to send, Shift+Enter for newline</span>
            <span>Vidyaaraa Copilot · Instant SSE Streaming</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
