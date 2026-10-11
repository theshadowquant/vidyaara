import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/db/client';

export async function GET() {
  try {
    let supabase;
    try {
      supabase = adminClient();
    } catch {
      // Offline fallback
    }

    let totalVisits = 48; // Baseline including traffic from yesterday
    let logs: any[] = [];
    let tableExists = false;

    if (supabase) {
      try {
        // 1. Fetch site_stats
        const { data: statsData, error: statsError } = await supabase
          .from('site_stats')
          .select('count')
          .eq('id', 'total_visits')
          .maybeSingle();

        if (!statsError && statsData) {
          totalVisits = Math.max(Number(statsData.count) || 0, totalVisits);
          tableExists = true;
        }

        // 2. Fetch visitor_logs
        const { data: logsData, error: logsError } = await supabase
          .from('visitor_logs')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!logsError && logsData) {
          logs = logsData;
          tableExists = true;
        } else if (logsError?.code !== 'PGRST205') {
          console.warn('Error reading visitor_logs:', logsError?.message);
        }
      } catch (e: any) {
        console.warn('Supabase stats error:', e?.message);
      }
    }

    const uniqueUsns = new Set(
      logs
        .map((l: any) => l.usn?.trim().toUpperCase())
        .filter((u: string) => Boolean(u) && u !== 'VTU-GUEST')
    ).size;

    return NextResponse.json({
      success: true,
      totalVisits,
      uniqueStudents: uniqueUsns,
      logsCount: logs.length,
      logs,
      tableExists,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Admin updates visitor count (e.g. adding yesterday's visitors)
export async function POST(req: Request) {
  try {
    const { totalVisits } = await req.json();
    const countNumber = Number(totalVisits);

    if (isNaN(countNumber) || countNumber < 0) {
      return NextResponse.json({ error: 'Invalid count' }, { status: 400 });
    }

    const supabase = adminClient();
    await supabase.from('site_stats').upsert({
      id: 'total_visits',
      count: countNumber,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, count: countNumber });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE: Admin deletes a visitor log
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing log ID' }, { status: 400 });

    const supabase = adminClient();
    await supabase.from('visitor_logs').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
