'use server';

import { NextResponse } from 'next/server';
import { getApiConfig } from '../../../config/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('build-tx request body:', JSON.stringify(body, null, 2));
    const config = getApiConfig(); // Get runtime config
    const auth = Buffer.from(`${config.AUTH.USERNAME}:${config.AUTH.PASSWORD}`).toString('base64');

    const res = await fetch(`${config.BASE_URL}/build-tx`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log('build-tx response status:', res.status);
    console.log('build-tx response text:', text);
    // Mirror backend status and content-type to the client
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('build-tx error:', e);
    return new NextResponse(e?.message || 'Proxy error', { status: 500 });
  }
}


