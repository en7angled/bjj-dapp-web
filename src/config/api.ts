// API Configuration
// Update this URL to match your backend server
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bjjserver-995707778143.europe-west1.run.app',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 0,
  AUTH: {
    USERNAME: 'cardano',
    PASSWORD: 'lovelace'
  }
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
  BUILD_TX: 'build-transaction',
  SUBMIT_TX: 'submit-transaction',
} as const;
