/**
 * Vidyaaraa — Supabase Client
 *
 * - browserClient(): anon key, safe for client components (read-only public data + auth)
 * - adminClient():   service-role key, server-side only (admin mutations)
 *
 * NEVER import adminClient() into a 'use client' component.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// ── Validation helpers ────────────────────────────────────────────────────

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

// ── Browser / anon client (safe in 'use client' components) ──────────────
let _browserClient: SupabaseClient<Database> | null = null;

export function browserClient(): SupabaseClient<Database> {
  if (!_browserClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _browserClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _browserClient;
}

// ── Admin / service-role client (SERVER SIDE ONLY) ────────────────────────
// Do NOT call this from client components — the service role key must
// stay in SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix).
export function adminClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for admin operations');
  }
  // Not cached — each admin call gets a fresh client to avoid session leakage
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
