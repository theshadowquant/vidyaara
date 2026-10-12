import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/db/client';

// In-memory fallback buffer (persists during server runtime)
interface InMemoryLog {
  id: string;
  name: string;
  usn: string;
  email?: string | null;
  action: string;
  details: string;
  branch?: string | null;
  sem?: string | null;
  createdAt: string;
}

let inMemoryVisits = 45; // Seeded with estimated visitors from yesterday
const inMemoryLogs: InMemoryLog[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, studentName, usn, email, resourceTitle, action, branch, semester } = body;

    let supabase;
    try {
      supabase = adminClient();
    } catch {
      // Supabase credentials not set, use in-memory
    }

    if (type === 'pageview') {
      inMemoryVisits += 1;

      if (supabase) {
        try {
          // 1. Fetch current count from site_stats
          const { data, error } = await supabase
            .from('site_stats')
            .select('count')
            .eq('id', 'total_visits')
            .maybeSingle();

          if (!error && data) {
            const newCount = (Number(data.count) || 0) + 1;
            await supabase
              .from('site_stats')
              .update({ count: newCount, updatedAt: new Date().toISOString() })
              .eq('id', 'total_visits');
          } else if (!error && !data) {
            // First row initialization
            await supabase
              .from('site_stats')
              .insert({ id: 'total_visits', count: inMemoryVisits, updatedAt: new Date().toISOString() });
          }
        } catch (dbErr) {
          console.warn('site_stats tracking db warning:', dbErr);
        }
      }

      return NextResponse.json({ success: true, visits: inMemoryVisits });
    }

    if (type === 'resource_access' || studentName) {
      inMemoryVisits += 1;
      const cleanName = (studentName || 'Anonymous Student').trim();
      const cleanUsn = (usn || 'VTU-GUEST').trim().toUpperCase();
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      const cleanTitle = (resourceTitle || 'Study Document').trim();
      const timestamp = new Date().toISOString();

      const newLog: InMemoryLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        usn: cleanUsn,
        email: cleanEmail,
        action: action || 'Viewed Resource',
        details: cleanTitle,
        branch: branch || null,
        sem: semester ? String(semester) : null,
        createdAt: timestamp,
      };

      inMemoryLogs.unshift(newLog);

      if (supabase) {
        try {
          // Increment visits
          const { data } = await supabase
            .from('site_stats')
            .select('count')
            .eq('id', 'total_visits')
            .maybeSingle();

          if (data) {
            await supabase
              .from('site_stats')
              .update({ count: Number(data.count) + 1, updatedAt: timestamp })
              .eq('id', 'total_visits');
          }

          // Insert into visitor_logs (try with email first, fallback without email if column pending)
          const insertPayload: any = {
            id: newLog.id,
            name: cleanName,
            usn: cleanUsn,
            email: cleanEmail,
            action: newLog.action,
            details: cleanTitle,
            branch: branch || null,
            sem: semester ? String(semester) : null,
            createdAt: timestamp,
          };

          const insertRes = await supabase.from('visitor_logs').insert(insertPayload);
          if (insertRes.error && insertRes.error.message.includes('email')) {
            delete insertPayload.email;
            await supabase.from('visitor_logs').insert(insertPayload);
          }
        } catch (dbErr) {
          console.warn('visitor_logs insert db warning:', dbErr);
        }
      }

      return NextResponse.json({ success: true, log: newLog });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Analytics track error:', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export function getInMemoryData() {
  return { inMemoryVisits, inMemoryLogs };
}
