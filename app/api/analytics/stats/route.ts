import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let supabase;
    try {
      supabase = adminClient();
    } catch {
      // Offline fallback
    }

    let totalVisits = 165;

    if (supabase) {
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('site_stats')
          .select('count')
          .eq('id', 'total_visits')
          .maybeSingle();

        if (!statsError && statsData) {
          totalVisits = Math.max(Number(statsData.count) || 0, 0);
        }
      } catch (e: any) {
        console.warn('Supabase stats error:', e?.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        totalVisits,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Admin updates visitor count
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
