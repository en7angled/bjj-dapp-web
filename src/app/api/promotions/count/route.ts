import { makeUpstreamRequest, createErrorResponse, createSuccessResponse } from '../../../../lib/api-utils';

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const qs = incoming.search || '';
  
  try {
    // Try the count endpoint first
    const response = await makeUpstreamRequest(`/promotions/count${qs}`);
    return createSuccessResponse(response.data);
  } catch (error) {
    // If count endpoint doesn't exist (404), fallback to getting all promotions and counting
    if (error instanceof Error && error.message.includes('API endpoint not found')) {
      try {
        const promotionsResponse = await makeUpstreamRequest(`/promotions${qs}`);
        const promotions = Array.isArray(promotionsResponse.data) ? promotionsResponse.data : [];
        return createSuccessResponse(promotions.length);
      } catch (fallbackError) {
        return createErrorResponse(fallbackError instanceof Error ? fallbackError : new Error('Unknown error'));
      }
    }
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
  }
}


