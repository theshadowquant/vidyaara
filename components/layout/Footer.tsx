'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Globe, MessageSquare, Briefcase } from 'lucide-react';

const footerLinks = [
  { label: 'Resources', href: '/resources' },
  { label: 'Calculators', href: 'https://biet-sgpa-auto.vercel.app/' },
  { label: 'PYQs', href: '/pyqs' },
  { label: 'Planner', href: '/planner' },
  { label: 'Placement', href: '/placement' },
  { label: 'Vidyaaraa AI', href: '/ai' },
  { label: 'About', href: '/about' },
];

const teamMembers = [
  { name: 'Lekhan', href: 'https://www.linkedin.com/in/lekhan-v-t-988680312/?isSelfProfile=true' },
  { name: 'Varun', href: 'https://www.linkedin.com/in/s-m-varun-7a6b4b3b0/' },
  { name: 'Darshan', href: 'https://www.linkedin.com/in/darshan-mang-56110136a/' },
  { name: 'Sujan', href: 'https://www.linkedin.com/in/sujan-r-v-6ba45531a/' },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/ai') {
    return null;
  }
  return (
    <footer
      role="contentinfo"
      className="w-full border-t border-[var(--bd)] bg-[var(--bg-raised)] mt-auto pb-28 md:pb-6"
    >
      <div className="container-cf pt-12 pb-2">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                fontSize: '1.15rem',
                color: 'var(--text-1)',
                textDecoration: 'none',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.8rem',
                  height: '1.8rem',
                  borderRadius: '0.4rem',
                  background: 'linear-gradient(135deg, #00D4AA, #00A88A)',
                }}
              >
                <GraduationCap size={14} color="#0F1729" strokeWidth={2.5} />
              </span>
              Vidyaaraa
            </Link>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6, maxWidth: '220px' }}>
              Built for students who want to get ahead.
            </p>

            {/* Social placeholders */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {[
                { Icon: Globe, label: 'GitHub' },
                { Icon: MessageSquare, label: 'Twitter' },
                { Icon: Briefcase, label: 'LinkedIn' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.4rem',
                    border: '1px solid var(--bd)',
                    color: 'var(--text-3)',
                    textDecoration: 'none',
                    transition: 'color 0.15s, border-color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)';
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Platform
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {footerLinks.map((link) => {
                const isExternal = link.href.startsWith('http');
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-3)',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-3)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Info
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'About Vidyaaraa', href: '/about' },
                { label: 'Admin Portal', href: '/admin' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Use', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-3)',
                      textDecoration: 'none',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-3)')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Team Credits & Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--bd)',
            paddingTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.45rem',
          }}
        >
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: '-0.01em',
            }}
          >
            Developed by{' '}
            <span
              style={{
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              Team SQuantrix
            </span>
          </p>

          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--text-3)',
            }}
          >
            Connect With Us For More Updates
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              marginTop: '0.15rem',
              marginBottom: '0.35rem',
            }}
          >
            {teamMembers.map((member, index) => (
              <span key={member.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                <a
                  href={member.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-2)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease, text-decoration 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                    (e.currentTarget as HTMLElement).style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                    (e.currentTarget as HTMLElement).style.textDecoration = 'none';
                  }}
                >
                  {member.name}
                </a>
                {index < teamMembers.length - 1 && (
                  <span style={{ color: 'var(--text-3)', opacity: 0.5 }}>•</span>
                )}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
            © {new Date().getFullYear()} Vidyaaraa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
