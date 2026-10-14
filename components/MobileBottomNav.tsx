'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Sparkles,
  FileText,
  Briefcase,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isCenter?: boolean;
  ariaLabel: string;
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
    ariaLabel: 'Go to Vidyaaraa Home',
  },
  {
    label: 'Notes',
    href: '/resources',
    icon: BookOpen,
    ariaLabel: 'Access Notes and Study Resources',
  },
  {
    label: 'AI Copilot',
    href: '/ai',
    icon: Sparkles,
    isCenter: true,
    ariaLabel: 'Launch Vidyaaraa AI Copilot',
  },
  {
    label: 'PYQs',
    href: '/pyqs',
    icon: FileText,
    ariaLabel: 'Access Previous Year Question Papers',
  },
  {
    label: 'Placement',
    href: '/placement',
    icon: Briefcase,
    ariaLabel: 'Access Placement Preparation Hub',
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <aside
      role="region"
      aria-label="Mobile Navigation Dock"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none"
    >
      <nav
        role="navigation"
        aria-label="Mobile Primary Navigation"
        className="pointer-events-auto w-full h-16 backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95 border-t border-gray-200/80 dark:border-zinc-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.45)] px-2 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-full items-center justify-items-center relative">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            if (item.isCenter) {
              return (
                <div
                  key={item.href}
                  className="flex flex-col items-center justify-center h-full relative"
                >
                  <Link
                    href={item.href}
                    aria-label={item.ariaLabel}
                    aria-current={isActive ? 'page' : undefined}
                    className="group relative -top-3.5 flex flex-col items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-full active:scale-95 transition-transform duration-150"
                  >
                    {/* Elevated Circular Action Button */}
                    <div
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 group-hover:scale-105 ${
                        isActive
                          ? 'bg-gradient-to-tr from-emerald-500 via-[#00D4AA] to-teal-300 text-slate-950 shadow-emerald-500/40 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-white dark:ring-offset-zinc-950'
                          : 'bg-gradient-to-tr from-[#00D4AA] to-emerald-500 text-slate-950 shadow-emerald-500/30'
                      }`}
                    >
                      <item.icon size={22} className="stroke-[2.2] animate-pulse" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-950" />
                    </div>

                    {/* Cleanly Placed Label Beneath Circle */}
                    <span
                      className={`text-[10px] font-semibold mt-1 tracking-tight whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : 'text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            }

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center h-full w-full rounded-xl transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isActive
                    ? 'text-[var(--accent)] dark:text-emerald-400 font-semibold'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    size={20}
                    className={`transition-transform duration-150 stroke-[1.8] ${
                      isActive ? 'stroke-[2.4] scale-105' : ''
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)] dark:bg-emerald-400" />
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight mt-1 transition-all ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
