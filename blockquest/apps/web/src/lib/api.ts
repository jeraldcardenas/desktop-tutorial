const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const getToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem('bq_token');

export const setToken = (t: string) => localStorage.setItem('bq_token', t);
export const clearToken = () => localStorage.removeItem('bq_token');

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}
