import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'academic-notes';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const client = adminClient();

    // 1. Ensure 'resources' bucket exists and is public
    try {
      const { data: bucket, error: bucketError } = await client.storage.getBucket('resources');
      if (bucketError || !bucket) {
        await client.storage.createBucket('resources', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });
      }
    } catch (e) {
      console.warn('Storage bucket setup notice:', e);
    }

    // 2. Prepare clean, safe file name & path
    const fileExt = file.name.split('.').pop() || 'pdf';
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    const fileName = `${Date.now()}_${cleanBaseName}.${fileExt}`;
    const storagePath = `${folder}/${fileName}`;

    // 3. Upload file bytes to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await client.storage
      .from('resources')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 4. Retrieve permanent public URL
    const { data: publicUrlData } = client.storage
      .from('resources')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/pdf',
    });
  } catch (error: any) {
    console.error('API /api/upload error:', error);
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
