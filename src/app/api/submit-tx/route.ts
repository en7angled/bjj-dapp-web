'use server';

import { NextResponse } from 'next/server';
import { API_CONFIG } from '../../../config/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const auth = Buffer.from(`${API_CONFIG.AUTH.USERNAME}:${API_CONFIG.AUTH.PASSWORD}`).toString('base64');

    const res = await fetch(`${API_CONFIG.BASE_URL}/submit-tx`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Proxy error', { status: 500 });
  }
}


