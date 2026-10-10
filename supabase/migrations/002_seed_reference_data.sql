-- ============================================================
-- Vidyaaraa — Supabase Migration 002: Reference Data Seed
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING
-- ============================================================

-- ── University ────────────────────────────────────────────────────────────
INSERT INTO public.universities (id, name, short_name, slug) VALUES
  ('vtu', 'Visvesvaraya Technological University', 'VTU', 'vtu')
ON CONFLICT (id) DO NOTHING;

-- ── Branches ─────────────────────────────────────────────────────────────
INSERT INTO public.branches (id, university_id, name, short_name, slug) VALUES
  ('cse-allied', 'vtu', 'CSE, ISE & Allied Branches',                'CSE & Allied', 'cse-allied'),
  ('cse',        'vtu', 'Computer Science & Engineering',            'CSE',     'cse'),
  ('cse-ds',     'vtu', 'CSE (Data Science)',                        'CSE-DS',  'cse-ds'),
  ('cse-aiml',   'vtu', 'CSE (Artificial Intelligence & ML)',        'CSE-AIML','cse-aiml'),
  ('cse-cy',     'vtu', 'CSE (Cyber Security)',                      'CSE-CY',  'cse-cy'),
  ('ise',        'vtu', 'Information Science & Engineering',         'ISE',     'ise'),
  ('ece',        'vtu', 'Electronics & Communication Engineering',   'ECE',     'ece'),
  ('eee',        'vtu', 'Electrical & Electronics Engineering',      'EEE',     'eee'),
  ('me',         'vtu', 'Mechanical Engineering',                    'ME',      'me'),
  ('cv',         'vtu', 'Civil Engineering',                         'CV',      'cv'),
  ('ch',         'vtu', 'Chemical Engineering',                      'CH',      'ch'),
  ('bt',         'vtu', 'Biotechnology',                             'BT',      'bt'),
  ('ae',         'vtu', 'Aeronautical Engineering',                  'AE',      'ae'),
  ('med',        'vtu', 'Medical Electronics',                       'MED',     'med'),
  ('te',         'vtu', 'Telecommunication Engineering',             'TE',      'te'),
  ('ind',        'vtu', 'Industrial Engineering & Management',       'IEM',     'ind'),
  ('mba',        'vtu', 'MBA',                                       'MBA',     'mba'),
  ('mca',        'vtu', 'MCA',                                       'MCA',     'mca'),
  ('other',      'vtu', 'Other Branches',                            'Other',   'other')
ON CONFLICT (id) DO NOTHING;

-- ── Subjects (CSE — all 8 semesters) ────────────────────────────────────
INSERT INTO public.subjects (id, university_id, branch_id, semester, code, name, credits) VALUES
  -- Semester 1
  ('cse-s1-maths1', 'vtu', 'cse', 1, '21MAT11', 'Calculus & Linear Algebra',            4),
  ('cse-s1-phy',    'vtu', 'cse', 1, '21PHY12', 'Engineering Physics',                  4),
  ('cse-s1-bep',    'vtu', 'cse', 1, '21ELN14', 'Basic Electronics',                    3),
  ('cse-s1-cprog',  'vtu', 'cse', 1, '21CPP14', 'C Programming',                        3),
  -- Semester 2
  ('cse-s2-maths2', 'vtu', 'cse', 2, '21MAT21', 'Advanced Calculus & Numerical Methods',4),
  ('cse-s2-chem',   'vtu', 'cse', 2, '21CHE22', 'Engineering Chemistry',                4),
  ('cse-s2-bme',    'vtu', 'cse', 2, '21ME25',  'Basic Mechanical Engineering',         3),
  -- Semester 3
  ('cse-s3-ds',     'vtu', 'cse', 3, '21CS32',  'Data Structures',                      4),
  ('cse-s3-dm',     'vtu', 'cse', 3, '21CS31',  'Discrete Mathematics',                 3),
  ('cse-s3-dsa',    'vtu', 'cse', 3, '21CS33',  'Data Structures & Applications',       3),
  ('cse-s3-math3',  'vtu', 'cse', 3, '21MAT31', 'Transform Calculus & Statistics',      4),
  -- Semester 4
  ('cse-s4-dbms',   'vtu', 'cse', 4, '21CS42',  'Database Management Systems',          4),
  ('cse-s4-ada',    'vtu', 'cse', 4, '21CS43',  'Analysis & Design of Algorithms',      4),
  ('cse-s4-java',   'vtu', 'cse', 4, '21CS44',  'Object Oriented Programming with Java',4),
  ('cse-s4-flat',   'vtu', 'cse', 4, '21CS41',  'Formal Languages & Automata Theory',   3),
  -- Semester 5
  ('cse-s5-cn',     'vtu', 'cse', 5, '21CS51',  'Computer Networks',                    4),
  ('cse-s5-os',     'vtu', 'cse', 5, '21CS52',  'Operating Systems',                    4),
  ('cse-s5-se',     'vtu', 'cse', 5, '21CS53',  'Software Engineering & Project Mgmt',  3),
  ('cse-s5-wt',     'vtu', 'cse', 5, '21CS55',  'Web Technologies',                     3),
  -- Semester 6
  ('cse-s6-cdp',    'vtu', 'cse', 6, '21CS61',  'Compiler Design',                      4),
  ('cse-s6-ml',     'vtu', 'cse', 6, '21CS62',  'Machine Learning',                     4),
  ('cse-s6-cgv',    'vtu', 'cse', 6, '21CS63',  'Computer Graphics & Visualization',    3),
  ('cse-s6-cns',    'vtu', 'cse', 6, '21CS64',  'Cryptography & Network Security',      3),
  -- Semester 7
  ('cse-s7-ai',     'vtu', 'cse', 7, '21CS71',  'Artificial Intelligence',              4),
  ('cse-s7-dc',     'vtu', 'cse', 7, '21CS72',  'Distributed Computing',               3),
  -- Semester 8
  ('cse-s8-project','vtu', 'cse', 8, '21CSP8',  'Project Work',                        16)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Subjects for ECE, ISE, ME, CV, EEE and other branches are added via
-- the admin panel or additional seed migrations as content is uploaded.
-- The branch records above are ready and waiting.
