export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

type UploadResult = { ok: true; image_url: string } | { ok: false; error: string };

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const profileId = (formData.get('profile_id') as string) || '';
    if (!file || !(file instanceof File)) {
      return Response.json({ ok: false, error: 'Missing file' } as UploadResult, { status: 400 });
    }
    if (!profileId) {
      return Response.json({ ok: false, error: 'Missing profile_id' } as UploadResult, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Lazy import sharp to keep edge bundles small
    const sharp = (await import('sharp')).default;
    const image = sharp(bytes, { failOnError: false });
    // Resize to small square thumbnail, e.g., 256x256, webp for size
    const resized = await image.resize(256, 256, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();

    // Save to disk under public/uploads using SHA-256(profileId).webp
    const fs = await import('fs');
    const path = await import('path');
    const crypto = await import('crypto');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const hash = crypto.createHash('sha256').update(profileId).digest('hex');
    const filename = `${hash}.webp`;
    const outPath = path.join(uploadsDir, filename);
    fs.writeFileSync(outPath, resized);

    const imageUrl = `/uploads/${filename}`;
    return Response.json({ ok: true, image_url: imageUrl } as UploadResult, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Upload failed' } as UploadResult, { status: 500 });
  }
}


