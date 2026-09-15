export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// In-memory access token (refresh token lives in an httpOnly cookie).
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Registered by the auth provider: silently refreshes and returns a new token.
let onUnauthorized: (() => Promise<string | null>) | null = null;
export function setUnauthorizedHandler(fn: (() => Promise<string | null>) | null) {
  onUnauthorized = fn;
}

type FetchOptions = RequestInit & { json?: unknown };

async function request<T>(
  path: string,
  opts: FetchOptions = {},
  allowRetry = true
): Promise<T> {
  const { json, headers, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    ...rest,
  });

  // Expired access token → try one silent refresh, then retry once.
  if (res.status === 401 && allowRetry && onUnauthorized) {
    const fresh = await onUnauthorized();
    if (fresh) {
      accessToken = fresh;
      return request<T>(path, opts, false);
    }
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      /* non-JSON */
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

export function api<T>(path: string, opts: FetchOptions = {}) {
  return request<T>(path, opts);
}
export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });
