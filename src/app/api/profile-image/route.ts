export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { logger } from '../../../lib/logger';
import type { APIError } from '../../../types/api';

type UploadResult = { ok: true; image_url: string } | { ok: false; error: string };

// Image processing queue to avoid blocking
const processImage = async (bytes: Uint8Array, profileId: string): Promise<{ filename: string; buffer: Buffer }> => {
  const sharp = (await import('sharp')).default;
  const crypto = await import('crypto');
  
  const image = sharp(bytes, { failOnError: false });
  
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
      const error: APIError = {
        message: 'Missing file in request',
        status: 400,
        code: 'MISSING_FILE'
      };
      
      return Response.json({ ok: false, error: error.message } as UploadResult, { status: 400 });
    }
    
    if (!profileId) {
      const error: APIError = {
        message: 'Missing profile_id in request',
        status: 400,
        code: 'MISSING_PARAMETER'
      };
      
      return Response.json({ ok: false, error: error.message } as UploadResult, { status: 400 });
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
    
    logger.info('Image uploaded successfully', {
      profileId,
      filename,
      size: buffer.length,
      path: imageUrl
    });
    
    return Response.json({ ok: true, image_url: imageUrl } as UploadResult, { status: 200 });
  } catch (error) {
    const apiError: APIError = {
      message: error instanceof Error ? error.message : 'Upload failed',
      status: 500,
      code: 'UPLOAD_ERROR'
    };
    
    logger.error('Image upload error', error instanceof Error ? error : new Error(apiError.message), {
      profileId: req.formData ? (await req.formData()).get('profile_id') : 'unknown'
    });
    
    return Response.json({ ok: false, error: apiError.message } as UploadResult, { status: 500 });
  }
}


