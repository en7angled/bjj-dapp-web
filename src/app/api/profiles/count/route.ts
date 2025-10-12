import { makeUpstreamRequest, createErrorResponse, createSuccessResponse } from '../../../../lib/api-utils';

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const qs = incoming.search || '';
  
  try {
    // Try the count endpoint first
    const response = await makeUpstreamRequest(`/profiles/count${qs}`);
    return createSuccessResponse(response.data);
  } catch (error) {
    // If count endpoint doesn't exist (404), fallback to getting all profiles and counting
    if (error instanceof Error && error.message.includes('API endpoint not found')) {
      try {
        const profilesResponse = await makeUpstreamRequest(`/profiles${qs}`);
        const profiles = Array.isArray(profilesResponse.data) ? profilesResponse.data : [];
        return createSuccessResponse(profiles.length);
      } catch (fallbackError) {
        return createErrorResponse(fallbackError instanceof Error ? fallbackError : new Error('Unknown error'));
      }
    }
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
  }
}


