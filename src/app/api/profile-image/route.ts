export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

type UploadResult = { ok: true; image_url: string } | { ok: false; error: string };

// Image processing queue to avoid blocking
const processImage = async (bytes: Uint8Array, profileId: string): Promise<{ filename: string; buffer: Buffer }> => {
  const sharp = (await import('sharp')).default;
  const crypto = await import('crypto');
  
  const image = sharp(bytes, { failOnError: false });
  
  // Generate multiple sizes for responsive images
  const sizes = [
    { width: 64, height: 64, suffix: 'thumb' },
    { width: 128, height: 128, suffix: 'small' },
    { width: 256, height: 256, suffix: 'medium' },
  ];
  
  const hash = crypto.createHash('sha256').update(profileId).digest('hex');
  const filename = `${hash}.webp`;
  
  // Process the main image (256x256)
  const resized = await image
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 82, effort: 4 }) // Higher compression effort
    .toBuffer();
  
  return { filename, buffer: resized };
};

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
    
    // Process image asynchronously
    const { filename, buffer } = await processImage(bytes, profileId);

    // Save to disk under public/uploads
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const outPath = path.join(uploadsDir, filename);
    fs.writeFileSync(outPath, buffer);

    const imageUrl = `/uploads/${filename}`;
    return Response.json({ ok: true, image_url: imageUrl } as UploadResult, { status: 200 });
  } catch (e: any) {
    console.error('Image upload error:', e);
    return Response.json({ ok: false, error: e?.message || 'Upload failed' } as UploadResult, { status: 500 });
  }
}


