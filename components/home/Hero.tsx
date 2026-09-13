'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight, Bot, Calculator } from 'lucide-react';

export function Hero() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[var(--bg)] via-[var(--bg-overlay)] to-[var(--bg)] overflow-hidden border-b border-[var(--bd)] text-center">
      <div className="container-cf max-w-3xl flex flex-col items-center space-y-6 mx-auto">
        {/* Small Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.15)] text-[var(--accent)] font-semibold text-xs uppercase tracking-wider">
          <Sparkles size={13} className="text-[var(--accent)] animate-pulse" />
          <span>Built for students. Designed for action.</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--text-1)] leading-[1.12]">
          College, without <span className="text-gradient">the chaos.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-[var(--text-2)] leading-relaxed max-w-2xl">
          Notes, previous-year papers, calculators, study tools and AI — organized in one place.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap gap-3.5 justify-center pt-2 w-full sm:w-auto">
          <Link href="/resources" className="btn btn-primary btn-lg flex items-center justify-center">
            <span>Explore Vidyaaraa</span>
            <ChevronRight size={18} />
          </Link>
          <Link href="/calculators" className="btn btn-secondary btn-lg flex items-center justify-center gap-2">
            <Calculator size={18} />
            <span>Calculate CGPA</span>
          </Link>
          <Link href="/ai" className="btn btn-ghost btn-lg border border-[var(--bd)] hover:border-[var(--accent)] flex items-center justify-center gap-2 text-[var(--text-1)]">
            <Bot size={18} className="text-[var(--accent)]" />
            <span>Vidyaaraa AI</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
