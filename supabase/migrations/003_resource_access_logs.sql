-- ============================================================
-- Vidyaaraa — Visitor Counter & Student Access Logs
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. Site Analytics & Global Visitor Counter
CREATE TABLE IF NOT EXISTS public.site_stats (
  id TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  "updatedAt" TEXT NOT NULL
);

-- 2. Student Visitor Access Logs
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT NOT NULL,
  email TEXT,
  action TEXT NOT NULL DEFAULT 'Viewed Resource',
  details TEXT NOT NULL,
  branch TEXT,
  sem TEXT,
  "createdAt" TEXT NOT NULL
);

-- Ensure email column exists if table already created
ALTER TABLE public.visitor_logs ADD COLUMN IF NOT EXISTS email TEXT;

-- Enable Row Level Security
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies so script can be re-run safely anytime
DROP POLICY IF EXISTS "Allow public read site_stats" ON public.site_stats;
DROP POLICY IF EXISTS "Allow public insert site_stats" ON public.site_stats;
DROP POLICY IF EXISTS "Allow public update site_stats" ON public.site_stats;

DROP POLICY IF EXISTS "Allow public read visitor_logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow public insert visitor_logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Allow public delete visitor_logs" ON public.visitor_logs;

-- Policies for public client read/write
CREATE POLICY "Allow public read site_stats" ON public.site_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert site_stats" ON public.site_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update site_stats" ON public.site_stats FOR UPDATE USING (true);

CREATE POLICY "Allow public read visitor_logs" ON public.visitor_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert visitor_logs" ON public.visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete visitor_logs" ON public.visitor_logs FOR DELETE USING (true);

-- Seed initial counter
INSERT INTO public.site_stats (id, count, "updatedAt")
VALUES ('total_visits', 1, NOW()::TEXT)
ON CONFLICT (id) DO NOTHING;
