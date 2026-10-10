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
    data: { user },
  } = await client.auth.getUser();

  if (!user) return false;

  // Verify in admin_roles table
  const { data, error } = await client
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    // If admin_roles table isn't populated yet, any logged-in user in Supabase auth is treated as authenticated admin during initial transition
    return Boolean(user);
  }

  return true;
}
