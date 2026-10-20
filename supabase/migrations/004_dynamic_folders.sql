-- ============================================================
-- Vidyaaraa — Supabase Migration 004: Dynamic Academic Folder Hierarchy
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create dynamic folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  parent_id TEXT REFERENCES public.folders(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  icon TEXT DEFAULT 'folder',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rapid hierarchical queries
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_status ON public.folders(status);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON public.folders(sort_order);

-- 2. Add folder_id to resources table for direct folder association
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS mime_type TEXT;

CREATE INDEX IF NOT EXISTS idx_resources_folder_id ON public.resources(folder_id);

-- 3. Row Level Security Policies
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read folders" ON public.folders;
DROP POLICY IF EXISTS "Allow public insert folders" ON public.folders;
DROP POLICY IF EXISTS "Allow public update folders" ON public.folders;
DROP POLICY IF EXISTS "Allow public delete folders" ON public.folders;

CREATE POLICY "Allow public read folders" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Allow public insert folders" ON public.folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update folders" ON public.folders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete folders" ON public.folders FOR DELETE USING (true);
