'use client';

import Link from 'next/link';
import { Calculator, Percent, FileQuestion, BookOpen, Calendar, Sparkles, Target, ArrowRight } from 'lucide-react';

const tools = [
  {
    title: 'SGPA Calculator',
    description: 'Calculate your semester GPA using your exact VTU branch grading scheme.',
    icon: <Calculator size={20} className="text-[var(--accent)]" />,
    href: 'https://biet-sgpa-auto.vercel.app/',
    cta: 'Calculate SGPA',
  },
  {
    title: 'CGPA Calculator',
    description: 'Combine your semester GPAs to compute your cumulative academic progress.',
    icon: <Calculator size={20} className="text-[#7C3AED]" />,
    href: 'https://biet-sgpa-auto.vercel.app/',
    cta: 'Calculate CGPA',
  },
  {
    title: 'Percentage Calculator',
    description: 'Convert your CGPA to percentage using the official VTU conversion formula.',
    icon: <Percent size={20} className="text-[var(--accent)]" />,
    href: 'https://biet-sgpa-auto.vercel.app/',
    cta: 'Convert Percentage',
  },
  {
    title: 'Required SGPA',
    description: 'Find out the exact SGPA needed in upcoming semesters to hit your target CGPA.',
    icon: <Target size={20} className="text-amber-500" />,
    href: 'https://biet-sgpa-auto.vercel.app/',
    cta: 'Check Target',
  },
  {
    title: 'PYQ Finder',
    description: 'Access VTU previous year question papers sorted by scheme and module.',
    icon: <FileQuestion size={20} className="text-[#7C3AED]" />,
    href: '/pyqs',
    cta: 'Find Papers',
  },
  {
    title: 'Notes & Resources',
    description: 'Browse VTU module-wise notes, lab manuals, slides, and study materials.',
    icon: <BookOpen size={20} className="text-[var(--accent)]" />,
    href: '/resources',
    cta: 'Browse Notes',
  },
  {
    title: 'Study Planner',
    description: 'Create a custom day-by-day exam revision schedule tailored to your syllabus.',
    icon: <Calendar size={20} className="text-[#7C3AED]" />,
    href: '/planner',
    cta: 'Create Plan',
  },
  {
    title: 'Vidyaaraa AI',
    description: 'Ask our academic copilot for instant explanations, formula solutions, and exam tips.',
    icon: <Sparkles size={20} className="text-[var(--accent)]" />,
    href: '/ai',
    cta: 'Ask Vidyaaraa AI',
  },
];

export function QuickTools() {
  return (
    <section className="py-12 sm:py-16 bg-[var(--bg)] border-b border-[var(--bd)]" id="quick-tools">
      <div className="container-cf text-center space-y-10">
        
        {/* Title */}
        <div className="space-y-2.5 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-1)]">
            Everything you need. <br className="sm:hidden" />
            <span className="text-[var(--text-2)] font-medium">A few clicks away.</span>
          </h2>
          <p className="text-sm text-[var(--text-2)] max-w-lg mx-auto">
            Get the task done in seconds. No sign-up. No complicated steps.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {tools.map((t) => (
            <div
              key={t.title}
              className="card p-5 flex flex-col justify-between h-full border-[var(--bd)] bg-[var(--bg-raised)] hover:border-[var(--accent)] hover:shadow-lg transition-all duration-200 group"
            >
              <div className="space-y-3.5">
                {/* Icon wrapper */}
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-overlay)] flex items-center justify-center border border-[var(--bd)] group-hover:border-[var(--accent)]/40 transition-colors">
                  {t.icon}
                </div>
                {/* Text content */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--text-1)] tracking-tight">{t.title}</h3>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                </div>
              </div>

              {/* Link CTA */}
              <div className="pt-4 border-t border-[var(--bd-subtle)] mt-4">
                <Link
                  href={t.href}
                  target={t.href.startsWith('http') ? '_blank' : undefined}
                  rel={t.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors"
                >
                  <span>{t.cta}</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
