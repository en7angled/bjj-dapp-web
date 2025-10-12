import { getApiConfig } from '../../../config/api';

// This endpoint allows the client to get the current API configuration at runtime
export async function GET() {
  const config = getApiConfig();
  
  // Only expose safe configuration values to the client
  const clientConfig = {
    BASE_URL: config.BASE_URL,
    TIMEOUT: config.TIMEOUT,
    RETRY_ATTEMPTS: config.RETRY_ATTEMPTS,
    PROFILE_POLICY_ID: config.PROFILE_POLICY_ID,
    NETWORK_ID: config.NETWORK_ID,
    // Don't expose credentials
    HAS_CREDENTIALS: !!(config.AUTH.USERNAME && config.AUTH.PASSWORD)
  };

  return new Response(
    JSON.stringify(clientConfig),
    { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
}
