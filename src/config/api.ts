// API Configuration
// Update this URL to match your backend server
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bjjserver-995707778143.europe-west1.run.app',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 0,
  AUTH: {
    USERNAME: 'cardano',
    PASSWORD: 'lovelace'
  },
  // Chain-related config (profile asset detection)
  PROFILE_POLICY_ID: process.env.NEXT_PUBLIC_PROFILE_POLICY_ID || '',
  NETWORK_ID: Number(process.env.NEXT_PUBLIC_NETWORK_ID || '1'), // 0 testnet, 1 mainnet
};

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
