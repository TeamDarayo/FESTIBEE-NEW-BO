// API Utilities

/**
 * Calculate pagination meta
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
) {
  return {
    success: false as const,
    error: {
      code,
      message,
      details,
    },
  };
}
