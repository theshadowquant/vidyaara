-- ============================================================
-- Vidyaaraa — Supabase Migration 001: Initial Schema
-- Run in: Supabase Dashboard → SQL Editor
-- Branch: migrate/supabase
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- accent-insensitive FTS
-- pgvector: design stub for future RAG over study materials
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- LOOKUP / REFERENCE TABLES
-- ============================================================

-- ── Universities ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.universities (
  id          TEXT PRIMARY KEY,          -- 'vtu'
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE
);

-- ── Branches ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.branches (
  id             TEXT PRIMARY KEY,       -- 'cse', 'ece', 'ise', 'me', 'cv', 'cse-ds', etc.
  university_id  TEXT NOT NULL REFERENCES public.universities(id),
  name           TEXT NOT NULL,
  short_name     TEXT NOT NULL,
  slug           TEXT NOT NULL
);

-- ── Subjects ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
  id             TEXT PRIMARY KEY,       -- 'cse-s4-dbms'
  university_id  TEXT NOT NULL REFERENCES public.universities(id),
  branch_id      TEXT NOT NULL REFERENCES public.branches(id),
  semester       SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  code           TEXT NOT NULL,          -- '21CS42'
  name           TEXT NOT NULL,
  credits        SMALLINT NOT NULL CHECK (credits > 0)
);

CREATE INDEX IF NOT EXISTS idx_subjects_branch_sem ON public.subjects(branch_id, semester);

-- ============================================================
-- CONTENT TABLES
-- ============================================================

-- ── Resources ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id     TEXT    REFERENCES public.subjects(id),
  subject_name   TEXT    NOT NULL,
  branch_id      TEXT    NOT NULL REFERENCES public.branches(id),
  semester       SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  university_id  TEXT    NOT NULL DEFAULT 'vtu' REFERENCES public.universities(id),
  type           TEXT    NOT NULL CHECK (type IN (
                   'notes','question-paper','lab-manual',
                   'important-questions','syllabus','reference'
                 )),
  title          TEXT    NOT NULL,
  description    TEXT    DEFAULT '',
  url            TEXT    NOT NULL CHECK (url <> ''),
  is_demo        BOOLEAN NOT NULL DEFAULT false,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Full-Text Search: weighted generated column (auto-maintained)
  search_vector  TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subject_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description,  '')), 'C')
  ) STORED

  -- pgvector stub — uncomment when RAG is ready:
  -- ,embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_resources_branch_sem   ON public.resources(branch_id, semester);
CREATE INDEX IF NOT EXISTS idx_resources_subject       ON public.resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_type          ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_at   ON public.resources(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_fts           ON public.resources USING GIN(search_vector);
-- Future: CREATE INDEX idx_resources_embedding ON public.resources USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- ── PYQs (Previous Year Question Papers) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pyqs (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id     TEXT    REFERENCES public.subjects(id),
  subject_name   TEXT    NOT NULL,
  subject_code   TEXT    DEFAULT '',
  branch_id      TEXT    NOT NULL REFERENCES public.branches(id),
  semester       SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  university_id  TEXT    NOT NULL DEFAULT 'vtu' REFERENCES public.universities(id),
  year           SMALLINT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  exam_type      TEXT    NOT NULL CHECK (exam_type IN ('CIE','SEE','Model','Practice')),
  url            TEXT    NOT NULL CHECK (url <> ''),
  is_demo        BOOLEAN NOT NULL DEFAULT false,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  search_vector  TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(subject_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subject_code, '')), 'B')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_pyqs_branch_sem    ON public.pyqs(branch_id, semester);
CREATE INDEX IF NOT EXISTS idx_pyqs_subject        ON public.pyqs(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyqs_year_type      ON public.pyqs(year DESC, exam_type);
CREATE INDEX IF NOT EXISTS idx_pyqs_fts            ON public.pyqs USING GIN(search_vector);

-- ============================================================
-- USER-SUBMITTED DATA TABLES
-- ============================================================

-- ── Note Requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.note_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     TEXT NOT NULL,
  branch      TEXT NOT NULL,
  semester    TEXT NOT NULL,    -- "4th Sem" — kept as text to match UI
  status      TEXT NOT NULL DEFAULT 'Under Review'
                CHECK (status IN ('Under Review','In Progress','Available')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_note_requests_status     ON public.note_requests(status);
CREATE INDEX IF NOT EXISTS idx_note_requests_created_at ON public.note_requests(created_at DESC);

-- ── Feedbacks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL,
  category    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

-- ============================================================
-- ADMIN ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.universities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyqs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles     ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the current caller an admin? ───────────────────────────────
-- SECURITY DEFINER lets the anon key call this without SELECT on admin_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
$$;

-- ── Lookup tables: public read, admin write ───────────────────────────────
DROP POLICY IF EXISTS "Public read universities" ON public.universities;
DROP POLICY IF EXISTS "Admin write universities" ON public.universities;
CREATE POLICY "Public read universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Admin write universities" ON public.universities FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read branches" ON public.branches;
DROP POLICY IF EXISTS "Admin write branches" ON public.branches;
CREATE POLICY "Public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Admin write branches" ON public.branches FOR ALL   USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admin write subjects" ON public.subjects;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admin write subjects" ON public.subjects FOR ALL   USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Resources: public read, admin write ──────────────────────────────────
DROP POLICY IF EXISTS "Public read resources" ON public.resources;
DROP POLICY IF EXISTS "Admin write resources" ON public.resources;
CREATE POLICY "Public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admin write resources" ON public.resources FOR ALL   USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── PYQs: public read, admin write ───────────────────────────────────────
DROP POLICY IF EXISTS "Public read pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Admin write pyqs" ON public.pyqs;
CREATE POLICY "Public read pyqs" ON public.pyqs FOR SELECT USING (true);
CREATE POLICY "Admin write pyqs" ON public.pyqs FOR ALL  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Note requests: public read + insert, admin manage ────────────────────
DROP POLICY IF EXISTS "Public read note_requests"   ON public.note_requests;
DROP POLICY IF EXISTS "Public insert note_requests" ON public.note_requests;
DROP POLICY IF EXISTS "Admin manage note_requests"  ON public.note_requests;
CREATE POLICY "Public read note_requests"   ON public.note_requests FOR SELECT USING (true);
CREATE POLICY "Public insert note_requests" ON public.note_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage note_requests"  ON public.note_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Feedbacks: anonymous insert, admin read + delete ─────────────────────
DROP POLICY IF EXISTS "Public insert feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Admin read feedbacks"    ON public.feedbacks;
DROP POLICY IF EXISTS "Admin delete feedbacks"  ON public.feedbacks;
CREATE POLICY "Public insert feedbacks" ON public.feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read feedbacks"    ON public.feedbacks FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin delete feedbacks"  ON public.feedbacks FOR DELETE USING (public.is_admin());

-- ── Admin roles: only admins can read this table ─────────────────────────
DROP POLICY IF EXISTS "Admin read admin_roles" ON public.admin_roles;
CREATE POLICY "Admin read admin_roles" ON public.admin_roles FOR SELECT USING (public.is_admin());
