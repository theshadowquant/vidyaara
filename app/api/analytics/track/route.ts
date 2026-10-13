import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let supabase;
    try {
      supabase = adminClient();
    } catch {
      // Supabase credentials not set
    }

    if (supabase) {
      try {
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
          await supabase
            .from('site_stats')
            .insert({ id: 'total_visits', count: 1, updatedAt: new Date().toISOString() });
        }
      } catch (dbErr) {
        console.warn('site_stats tracking db warning:', dbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
