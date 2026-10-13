import { browserClient, isSupabaseConfigured } from './client';

export async function adminSignIn(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    // If Supabase is not configured, fall back to check if it's default admin for local dev without env vars
    if (password === 'vidyaaraa2026') {
      return { data: { user: { email } }, error: null };
    }
    return { data: null, error: new Error('Invalid credentials (or Supabase not configured)') };
  }

  const client = browserClient();
  return await client.auth.signInWithPassword({
    email,
    password,
  });
}

export async function adminSignOut() {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const client = browserClient();
  return await client.auth.signOut();
}

export async function getAdminSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = browserClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const client = browserClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) return false;

  return true;
}
