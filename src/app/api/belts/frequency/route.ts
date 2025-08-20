import { makeUpstreamRequest, createErrorResponse, createSuccessResponse } from '../../../../lib/api-utils';

export async function GET() {
  try {
    const response = await makeUpstreamRequest('/belts/frequency');
    return createSuccessResponse(response.data);
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
  }
}


