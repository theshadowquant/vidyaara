-- ============================================================
-- Vidyaaraa — Supabase Migration 006: Storage Bucket Setup
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Insert or update the 'resources' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('resources', 'resources', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Open RLS on storage.objects for the resources bucket
DROP POLICY IF EXISTS "Public read storage resources" ON storage.objects;
DROP POLICY IF EXISTS "Public upload storage resources" ON storage.objects;
DROP POLICY IF EXISTS "Public update storage resources" ON storage.objects;
DROP POLICY IF EXISTS "Public delete storage resources" ON storage.objects;

CREATE POLICY "Public read storage resources" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Public upload storage resources" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resources');

CREATE POLICY "Public update storage resources" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resources');

CREATE POLICY "Public delete storage resources" ON storage.objects
  FOR DELETE USING (bucket_id = 'resources');
