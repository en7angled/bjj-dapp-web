import { API_CONFIG } from '../config/api';
import { apiLogger } from './logger';
import type { APIError } from '../types/api';

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export async function makeUpstreamRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const auth = `Basic ${Buffer.from(`${API_CONFIG.AUTH.USERNAME}:${API_CONFIG.AUTH.PASSWORD}`).toString('base64')}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': auth, 
        'Accept': 'application/json',
        ...options.headers 
      },
      cache: 'default',
      next: { revalidate: 30 },
      ...options
    });
    
    if (!response.ok) {
      const error: APIError = {
        message: `Upstream error: ${response.status} ${response.statusText}`,
        status: response.status,
        code: 'UPSTREAM_ERROR'
      };
      throw new Error(error.message);
    }
    
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    const apiError: APIError = {
      message: error instanceof Error ? error.message : 'Upstream error',
      status: 500,
      code: 'FETCH_ERROR'
    };
    
    apiLogger.error(`API Error [${endpoint}]`, error instanceof Error ? error : new Error(apiError.message), {
      url,
      endpoint
    });
    
    throw new Error(apiError.message);
  }
}

export function createErrorResponse(error: Error, status = 500): Response {
  const apiError: APIError = {
    message: error.message,
    status,
    code: 'API_ERROR'
  };
  
  return new Response(
    JSON.stringify({ error: apiError.message }), 
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        ...headers
      }
    }
  );
}
