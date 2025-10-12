// API Configuration - Runtime resolution for server-side
// This ensures environment variables are read at runtime, not build time
export function getApiConfig() {
  // For server-side, always read from environment variables at runtime
  const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://bjjbackend.cardano.vip';
  
  return {
    BASE_URL: baseUrl,
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 0,
    AUTH: {
      // Use server-side env vars; avoid exposing credentials in the client bundle
      USERNAME: process.env.API_USER || '',
      PASSWORD: process.env.API_PASS || ''
    },
    // Chain-related config (profile asset detection)
    PROFILE_POLICY_ID: process.env.NEXT_PUBLIC_PROFILE_POLICY_ID || '',
    NETWORK_ID: Number(process.env.NEXT_PUBLIC_NETWORK_ID || '1'), // 0 testnet, 1 mainnet
  };
}

// For backward compatibility, export a default config
// Note: This will still use build-time values for client-side code
export const API_CONFIG = getApiConfig();

// Common API endpoints
export const API_ENDPOINTS = {
  BELTS: 'belts',
  BELTS_COUNT: 'belts/count',
  BELTS_FREQUENCY: 'belts/frequency',
  PROMOTIONS: 'promotions',
  PROMOTIONS_COUNT: 'promotions/count',
  PROFILES: 'profiles',
  PROFILES_COUNT: 'profiles/count',
  PRACTITIONER: 'practitioner',
  ORGANIZATION: 'organization',
  BUILD_TX: 'build-tx',
  SUBMIT_TX: 'submit-tx',
} as const;
