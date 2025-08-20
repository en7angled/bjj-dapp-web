import { API_CONFIG } from '../../../config/api';
import { apiLogger } from '../../../lib/logger';
import type { APIError } from '../../../types/api';

// Cache for deduplicating requests
const requestCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const qs = incoming.search || '';
  const url = `${API_CONFIG.BASE_URL}/belts${qs}`;
  const auth = `Basic ${Buffer.from(`${API_CONFIG.AUTH.USERNAME}:${API_CONFIG.AUTH.PASSWORD}`).toString('base64')}`;
  
  // Check cache for deduplication
  const cacheKey = `belts:${qs}`;
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      },
    });
  }

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': auth, 'Accept': 'application/json' },
      // Use cache for read-only operations
      cache: 'default',
      next: { revalidate: 30 }, // Revalidate every 30 seconds
    });
    
    if (!upstream.ok) {
      const error: APIError = {
        message: `Upstream error: ${upstream.status} ${upstream.statusText}`,
        status: upstream.status,
        code: 'UPSTREAM_ERROR'
      };
      throw new Error(error.message);
    }
    
    const body = await upstream.text();
    const data = JSON.parse(body);
    
    // Cache the response
    requestCache.set(cacheKey, { data, timestamp: Date.now() });
    
    return new Response(body, {
      status: upstream.status,
      headers: { 
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      },
    });
  } catch (error) {
    const apiError: APIError = {
      message: error instanceof Error ? error.message : 'Upstream error',
      status: 500,
      code: 'FETCH_ERROR'
    };
    
    apiLogger.error('Belts API error', error instanceof Error ? error : new Error(apiError.message), {
      url,
      queryString: qs
    });
    
    return new Response(
      JSON.stringify({ error: apiError.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}


