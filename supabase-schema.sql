-- ============================================================
-- Vidyaaraa Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. Resources Table (Notes, PYQs, Lab Manuals, Google Drive Links)
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  "subjectId" TEXT,
  "subjectName" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  semester INT NOT NULL,
  "universityId" TEXT DEFAULT 'vtu',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  "isDemo" BOOLEAN DEFAULT false,
  "uploadedAt" TEXT NOT NULL
);

-- 2. Student Note Requests Table
CREATE TABLE IF NOT EXISTS public.note_requests (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  branch TEXT NOT NULL,
  sem TEXT NOT NULL,
  status TEXT DEFAULT 'Under Review',
  "createdAt" TEXT NOT NULL
);

-- 3. Student Feedback Table
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id TEXT PRIMARY KEY,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  category TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Clean existing policies so this script can be re-run safely anytime
DROP POLICY IF EXISTS "Allow public read resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public insert resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public delete resources" ON public.resources;

DROP POLICY IF EXISTS "Allow public read note_requests" ON public.note_requests;
DROP POLICY IF EXISTS "Allow public insert note_requests" ON public.note_requests;
DROP POLICY IF EXISTS "Allow public update note_requests" ON public.note_requests;
DROP POLICY IF EXISTS "Allow public delete note_requests" ON public.note_requests;

DROP POLICY IF EXISTS "Allow public read feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Allow public insert feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Allow public delete feedbacks" ON public.feedbacks;

-- Create Policies (Public access for client read & writes)
CREATE POLICY "Allow public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow public insert resources" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete resources" ON public.resources FOR DELETE USING (true);

CREATE POLICY "Allow public read note_requests" ON public.note_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert note_requests" ON public.note_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update note_requests" ON public.note_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete note_requests" ON public.note_requests FOR DELETE USING (true);

CREATE POLICY "Allow public read feedbacks" ON public.feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow public insert feedbacks" ON public.feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete feedbacks" ON public.feedbacks FOR DELETE USING (true);
