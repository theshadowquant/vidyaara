-- ============================================================
-- Vidyaaraa — Supabase Migration 003: Resource Access Logs
-- Visitor Tracking & USN-based Download/View Access Logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resource_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  usn TEXT NOT NULL,
  resource_id TEXT,
  resource_title TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'notes',
  branch_id TEXT,
  semester INTEGER,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resource_access_logs ENABLE ROW LEVEL SECURITY;

-- 1. Allow any student (anonymous or authenticated) to insert an access log
CREATE POLICY "Allow public insert to resource_access_logs"
  ON public.resource_access_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Allow read access to access logs for admin dashboard
CREATE POLICY "Allow read access to resource_access_logs"
  ON public.resource_access_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Allow admins to delete access logs
CREATE POLICY "Allow admin delete from resource_access_logs"
  ON public.resource_access_logs
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Indexes for fast querying & visitor analytics
CREATE INDEX IF NOT EXISTS idx_access_logs_usn ON public.resource_access_logs(usn);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON public.resource_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_branch ON public.resource_access_logs(branch_id);
