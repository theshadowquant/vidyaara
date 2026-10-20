-- ============================================================
-- Vidyaaraa — Supabase Migration 005: Relax Resource Constraints & RLS for CMS
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Relax foreign key constraints on resources so dynamic folders can store resources without hardcoded branches/subjects
ALTER TABLE public.resources ALTER COLUMN branch_id DROP NOT NULL;
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_branch_id_fkey;
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_subject_id_fkey;
ALTER TABLE public.resources ALTER COLUMN semester DROP NOT NULL;

-- 2. Open RLS policies on resources for public/admin uploads matching the folders table
DROP POLICY IF EXISTS "Public read resources" ON public.resources;
DROP POLICY IF EXISTS "Admin write resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public read resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public insert resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public update resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public delete resources" ON public.resources;

CREATE POLICY "Allow public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow public insert resources" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update resources" ON public.resources FOR UPDATE USING (true);
CREATE POLICY "Allow public delete resources" ON public.resources FOR DELETE USING (true);
