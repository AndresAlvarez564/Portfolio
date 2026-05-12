// Shared TypeScript interfaces and types
// Feature-specific types will be added in Phase 2 feature tickets.

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
}
