/**
 * Vidyaaraa — Supabase Data Seeding Script
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts [--dry-run] [--validate]
 *
 * Flags:
 *   --dry-run   Print rows that would be inserted without touching the database
 *   --validate  Verify row counts against static datasets after seeding
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { universities, branches, subjects } from '../data/universities';
import { resources } from '../data/resources';
import { pyqs } from '../data/pyqs';

// Load .env.local if exists
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isDryRun = process.argv.includes('--dry-run');
const isValidate = process.argv.includes('--validate');

async function main() {
  console.log('====================================================');
  console.log(' Vidyaaraa — Supabase Seeding Script');
  console.log(` Mode: ${isDryRun ? 'DRY RUN (No writes)' : 'LIVE SEED'}`);
  console.log('====================================================\n');

  if (!isDryRun) {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Error: Missing Supabase credentials.');
      console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
      process.exit(1);
    }
  }

  const supabase = !isDryRun ? createClient(supabaseUrl!, supabaseKey!) : null;

  // 1. Universities
  console.log(`📌 Seeding Universities (${universities.length} records)...`);
  for (const u of universities) {
    if (isDryRun) {
      console.log(`  [DRY] University: ${u.name} (${u.id})`);
    } else {
      const { error } = await supabase!.from('universities').upsert({
        id: u.id,
        name: u.name,
        short_name: u.shortName,
        slug: u.slug,
      });
      if (error) console.error(`  ❌ Error inserting university ${u.id}:`, error.message);
    }
  }

  // 2. Branches
  console.log(`\n📌 Seeding Branches (${branches.length} records)...`);
  for (const b of branches) {
    if (isDryRun) {
      console.log(`  [DRY] Branch: ${b.name} (${b.id})`);
    } else {
      const { error } = await supabase!.from('branches').upsert({
        id: b.id,
        university_id: b.universityId,
        name: b.name,
        short_name: b.shortName,
        slug: b.slug,
      });
      if (error) console.error(`  ❌ Error inserting branch ${b.id}:`, error.message);
    }
  }

  // 3. Subjects
  console.log(`\n📌 Seeding Subjects (${subjects.length} records)...`);
  for (const s of subjects) {
    if (isDryRun) {
      console.log(`  [DRY] Subject: [${s.code}] ${s.name} (Sem ${s.semester})`);
    } else {
      const { error } = await supabase!.from('subjects').upsert({
        id: s.id,
        university_id: s.universityId,
        branch_id: s.branchId,
        semester: s.semester,
        code: s.code,
        name: s.name,
        credits: s.credits,
      });
      if (error) console.error(`  ❌ Error inserting subject ${s.id}:`, error.message);
    }
  }

  // 4. Resources
  console.log(`\n📌 Seeding Resources (${resources.length} records)...`);
  for (const r of resources) {
    if (isDryRun) {
      console.log(`  [DRY] Resource: ${r.title} (${r.type})`);
    } else {
      const { error } = await supabase!.from('resources').insert({
        subject_id: r.subjectId || null,
        subject_name: r.subjectName,
        branch_id: r.branchId,
        semester: r.semester,
        university_id: r.universityId || 'vtu',
        type: r.type,
        title: r.title,
        description: r.description,
        url: r.url,
        is_demo: r.isDemo,
        uploaded_at: r.uploadedAt ? new Date(r.uploadedAt).toISOString() : new Date().toISOString(),
      });
      if (error) console.error(`  ❌ Error inserting resource ${r.title}:`, error.message);
    }
  }

  // 5. PYQs
  console.log(`\n📌 Seeding PYQs (${pyqs.length} records)...`);
  for (const p of pyqs) {
    if (isDryRun) {
      console.log(`  [DRY] PYQ: ${p.subjectName} (${p.year} ${p.examType})`);
    } else {
      const { error } = await supabase!.from('pyqs').insert({
        subject_id: p.subjectId || null,
        subject_name: p.subjectName,
        subject_code: p.subjectCode,
        branch_id: p.branchId,
        semester: p.semester,
        university_id: p.universityId || 'vtu',
        year: p.year,
        exam_type: p.examType,
        url: p.url,
        is_demo: p.isDemo,
      });
      if (error) console.error(`  ❌ Error inserting PYQ ${p.id}:`, error.message);
    }
  }

  // Validation
  if (isValidate && !isDryRun && supabase) {
    console.log('\n📊 Validating Database Record Counts...');
    const { count: uCount } = await supabase.from('universities').select('*', { count: 'exact', head: true });
    const { count: bCount } = await supabase.from('branches').select('*', { count: 'exact', head: true });
    const { count: sCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
    const { count: rCount } = await supabase.from('resources').select('*', { count: 'exact', head: true });
    const { count: pCount } = await supabase.from('pyqs').select('*', { count: 'exact', head: true });

    console.log(`  Universities: Expected ${universities.length}, DB has ${uCount}`);
    console.log(`  Branches:     Expected ${branches.length}, DB has ${bCount}`);
    console.log(`  Subjects:     Expected ${subjects.length}, DB has ${sCount}`);
    console.log(`  Resources:    Expected ${resources.length}, DB has ${rCount}`);
    console.log(`  PYQs:         Expected ${pyqs.length}, DB has ${pCount}`);
  }

  console.log('\n✅ Seeding process completed successfully!');
}

main().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
