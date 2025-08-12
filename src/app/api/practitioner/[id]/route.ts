import { API_CONFIG } from '../../../../config/api';

export async function GET(_req: Request, ctx: any) {
  const context = (ctx && typeof ctx.then === 'function') ? await ctx : ctx;
  const params = (context?.params && typeof context.params.then === 'function') ? await context.params : context?.params;
  const id = params?.id as string;
  // Pass the dotted asset id as-is; avoid encoding '.' which some backends expect literally
  const url = `${API_CONFIG.BASE_URL}/practitioner/${id}`;
  const auth = `Basic ${Buffer.from(`${API_CONFIG.AUTH.USERNAME}:${API_CONFIG.AUTH.PASSWORD}`).toString('base64')}`;
  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Accept': 'application/json',
      },
      // Ensure we don't cache stale profile
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


