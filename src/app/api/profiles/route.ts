import { makeUpstreamRequest, createErrorResponse, createSuccessResponse } from '../../../lib/api-utils';

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const qs = incoming.search || '';
  
  try {
    const response = await makeUpstreamRequest(`/profiles${qs}`);
    return createSuccessResponse(response.data);
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
  }
}


