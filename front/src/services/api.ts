// Base API client — wraps fetch with standard error handling.
// Feature-specific service files will be added in Phase 2 feature tickets.

import { apiConfig } from "../config/amplify";
import type { ApiError } from "../types";

function apiUrl(path: string): string {
  const baseUrl = apiConfig.baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete(path: string, token: string): Promise<void> {
  const res = await fetch(apiUrl(path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) await handleResponse(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = json?.error ?? {
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
    };
    throw err;
  }
  return (json as { data: T }).data;
}
