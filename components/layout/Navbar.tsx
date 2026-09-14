'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sun, Moon, Search, Menu, X, GraduationCap } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { GlobalSearch } from '@/components/search/GlobalSearch';

const navLinks = [
  { href: '/resources', label: 'Resources' },
  { href: 'https://biet-sgpa-auto.vercel.app/', label: 'Calculators' },
  { href: '/pyqs', label: 'PYQs' },
  { href: '/planner', label: 'Planner' },
  { href: '/placement', label: 'Placement' },
  { href: '/ai', label: 'Vidyaaraa AI' },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Keyboard shortcut: "/" opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close mobile nav on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <header
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: scrolled ? 'var(--bg-raised)' : 'var(--bg)',
          borderBottom: `1px solid ${scrolled ? 'var(--bd)' : 'transparent'}`,
          transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: scrolled ? 'var(--shadow-card)' : 'none',
        }}
      >
        <div className="container-cf" style={{ display: 'flex', alignItems: 'center', height: '4rem', gap: '1.5rem' }}>
          {/* Logo */}
          <Link
            href="/"
            aria-label="Vidyaaraa home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: 'var(--text-1)',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.1rem',
                height: '2.1rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #00D4AA, #00A88A)',
                boxShadow: '0 2px 8px rgba(0, 212, 170, 0.25)',
              }}
            >
              <GraduationCap size={16} color="#0F1729" strokeWidth={2.5} />
            </span>
            <span style={{ letterSpacing: '-0.02em' }}>Vidyaaraa</span>
          </Link>

          {/* Desktop Nav */}
          <nav
            role="navigation"
            aria-label="Main navigation"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}
            className="hidden-mobile"
          >
            {navLinks.map((link) => {
              const isExternal = link.href.startsWith('http');
              const active = !isExternal && pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease, background-color 0.15s ease',
                    backgroundColor: active ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-overlay)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            {/* Search trigger */}
            <button
              className="btn btn-ghost"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Search size={17} />
              <span
                className="hidden-mobile"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-3)',
                  border: '1px solid var(--bd)',
                  borderRadius: '0.25rem',
                  padding: '0.1rem 0.35rem',
                  fontFamily: 'monospace',
                }}
              >
                /
              </span>
            </button>

            {/* Theme toggle */}
            <button
              className="btn btn-ghost"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="btn btn-ghost show-mobile"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div
            style={{
              borderTop: '1px solid var(--bd)',
              backgroundColor: 'var(--bg-raised)',
              padding: '0.75rem 1.25rem 1.25rem',
            }}
          >
            <nav role="navigation" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isExternal = link.href.startsWith('http');
                const active = !isExternal && pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? 'var(--accent)' : 'var(--text-1)',
                      textDecoration: 'none',
                      backgroundColor: active ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                      marginBottom: '0.125rem',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Search Modal */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {/* Inline style for responsive helpers */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile { display: none; }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
