/** API 错误分类 */
export type ApiErrorCategory =
  | 'network'
  | 'timeout'
  | 'http_error'
  | 'api_error'
  | 'parse_error'
  | 'unknown';

/** 增强的 API 错误 */
export class ApiError extends Error {
  category: ApiErrorCategory;
  statusCode?: number;
  originalError?: unknown;

  constructor(
    message: string,
    category: ApiErrorCategory,
    statusCode?: number,
    originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.category = category;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}
