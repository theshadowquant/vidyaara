'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Sparkles,
  Calculator,
  Calendar,
  Briefcase,
} from 'lucide-react';

interface QuickCard {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isAi?: boolean;
  ariaLabel: string;
}

const quickCards: QuickCard[] = [
  {
    title: 'Notes',
    subtitle: 'VTU Modules',
    href: '/resources',
    icon: BookOpen,
    ariaLabel: 'Access Notes and Study Resources',
  },
  {
    title: 'PYQs',
    subtitle: 'Exam Papers',
    href: '/pyqs',
    icon: FileText,
    ariaLabel: 'Access Previous Year Question Papers',
  },
  {
    title: 'AI Doubts',
    subtitle: 'Instant Solves',
    href: '/ai',
    icon: Sparkles,
    isAi: true,
    ariaLabel: 'Ask AI Doubts with Vidyaaraa AI Copilot',
  },
  {
    title: 'Calculators',
    subtitle: 'SGPA & CGPA',
    href: '/calculators',
    icon: Calculator,
    ariaLabel: 'Open SGPA and CGPA Calculators',
  },
  {
    title: 'Planner',
    subtitle: 'Study Roadmap',
    href: '/planner',
    icon: Calendar,
    ariaLabel: 'Plan Exams with AI Study Planner',
  },
  {
    title: 'Placement',
    subtitle: 'DSA & Prep',
    href: '/placement',
    icon: Briefcase,
    ariaLabel: 'Explore Placement and Interview Hub',
  },
];

export function MobileQuickGrid() {
  return (
    <section
      aria-label="Mobile Quick Access Navigation"
      className="w-full px-4 pt-2 pb-6 md:hidden"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-zinc-400">
            Quick Modules
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            1-Tap Access
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {quickCards.map((card) => {
            const Icon = card.icon;

            if (card.isAi) {
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  aria-label={card.ariaLabel}
                  className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/35 shadow-sm shadow-emerald-500/10 active:scale-95 transition-transform duration-150 text-center"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00D4AA] to-emerald-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/25 mb-1.5 group-hover:scale-105 transition-transform">
                    <Icon size={18} className="stroke-[2.2] animate-pulse" />
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">
                    {card.title}
                  </span>
                  <span className="text-[9px] font-medium text-emerald-700/80 dark:text-emerald-300/70 mt-0.5 leading-none">
                    {card.subtitle}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={card.title}
                href={card.href}
                aria-label={card.ariaLabel}
                className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-gray-200/90 dark:border-zinc-800/90 shadow-sm active:scale-95 transition-transform duration-150 text-center hover:border-gray-300 dark:hover:border-zinc-700"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-200 flex items-center justify-center mb-1.5 group-hover:text-[var(--accent)] transition-colors">
                  <Icon size={18} className="stroke-[1.8]" />
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-100 leading-tight">
                  {card.title}
                </span>
                <span className="text-[9px] font-medium text-gray-500 dark:text-zinc-400 mt-0.5 leading-none">
                  {card.subtitle}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
