import { getApiConfig } from '../config/api';
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
  const config = getApiConfig(); // Get runtime config
  const url = `${config.BASE_URL}${endpoint}`;
  const auth = `Basic ${Buffer.from(`${config.AUTH.USERNAME}:${config.AUTH.PASSWORD}`).toString('base64')}`;
  
  // Check if credentials are configured
  if (!config.AUTH.USERNAME || !config.AUTH.PASSWORD) {
    const error: APIError = {
      message: 'API credentials not configured. Please set API_USER and API_PASS environment variables.',
      status: 401,
      code: 'MISSING_CREDENTIALS'
    };
    apiLogger.error(`API Error [${endpoint}]`, new Error(error.message), {
      url,
      endpoint,
      hasUsername: !!config.AUTH.USERNAME,
      hasPassword: !!config.AUTH.PASSWORD
    });
    throw new Error(error.message);
  }

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
      let errorMessage = `Upstream error: ${response.status} ${response.statusText}`;
      let errorCode = 'UPSTREAM_ERROR';
      
      // Provide more specific error messages
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please check API credentials.';
        errorCode = 'AUTH_FAILED';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. Please check API permissions.';
        errorCode = 'ACCESS_FORBIDDEN';
      } else if (response.status === 404) {
        errorMessage = `API endpoint not found: ${endpoint}`;
        errorCode = 'ENDPOINT_NOT_FOUND';
      } else if (response.status >= 500) {
        errorMessage = 'Backend server error. Please try again later.';
        errorCode = 'SERVER_ERROR';
      }
      
      const error: APIError = {
        message: errorMessage,
        status: response.status,
        code: errorCode
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
    // Handle network errors specifically
    if (error instanceof TypeError && error.message === 'fetch failed') {
      const networkError: APIError = {
        message: `Network error: Unable to connect to ${config.BASE_URL}. Please check your internet connection and backend server status.`,
        status: 0,
        code: 'NETWORK_ERROR'
      };
      
      apiLogger.error(`API Error [${endpoint}]`, error, {
        url,
        endpoint,
        errorType: 'NETWORK_ERROR'
      });
      
      throw new Error(networkError.message);
    }
    
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
