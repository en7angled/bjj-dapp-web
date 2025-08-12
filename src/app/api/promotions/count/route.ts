import { API_CONFIG } from '../../../../config/api';

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const qs = incoming.search || '';
  const url = `${API_CONFIG.BASE_URL}/promotions/count${qs}`;
  const auth = `Basic ${Buffer.from(`${API_CONFIG.AUTH.USERNAME}:${API_CONFIG.AUTH.PASSWORD}`).toString('base64')}`;
  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': auth, 'Accept': 'application/json' },
      cache: 'no-store',
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Upstream error', { status: 500 });
  }
}


