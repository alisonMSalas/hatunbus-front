import { getToken, logout } from '@/services/auth';

type FetchOptions = RequestInit & { retry?: boolean };

/**
 * Fetch wrapper that adds Authorization: Bearer <token> automatically when available.
 * If the server returns 401, it calls logout() so the app can react (redirect to login).
 */
export async function fetchWithAuth(input: RequestInfo, init?: FetchOptions): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(init && init.headers ? (init.headers as Record<string, string>) : {}),
  };

  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(input, { ...init, headers });

  if (resp.status === 401) {
    // token expired or invalid — clear and allow app to redirect to login
    try {
      await logout();
    } catch (e) {
      // ignore
    }
  }

  return resp;
}

export async function getJsonWithAuth<T = any>(url: string, init?: FetchOptions): Promise<T> {
  const r = await fetchWithAuth(url, init);
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(txt || `HTTP ${r.status}`);
  }
  return (await r.json()) as T;
}

export async function postJsonWithAuth<T = any>(url: string, body?: any, init?: FetchOptions): Promise<T> {
  const r = await fetchWithAuth(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(init && init.headers ? (init.headers as any) : {}) },
    ...init,
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(txt || `HTTP ${r.status}`);
  }
  
  // Check if response has content before trying to parse JSON
  const text = await r.text();
  if (!text || text.trim() === '') {
    return null as T;
  }
  return JSON.parse(text) as T;
}

export async function putJsonWithAuth<T = any>(url: string, body?: any, init?: FetchOptions): Promise<T> {
  const r = await fetchWithAuth(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(init && init.headers ? (init.headers as any) : {}) },
    ...init,
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(txt || `HTTP ${r.status}`);
  }
  
  // Check if response has content before trying to parse JSON
  const text = await r.text();
  if (!text || text.trim() === '') {
    return null as T;
  }
  return JSON.parse(text) as T;
}

export async function deleteWithAuth<T = any>(url: string, init?: FetchOptions): Promise<T> {
  const r = await fetchWithAuth(url, {
    method: 'DELETE',
    ...init,
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(txt || `HTTP ${r.status}`);
  }
  
  // Check if response has content before trying to parse JSON
  const text = await r.text();
  if (!text || text.trim() === '') {
    return null as T;
  }
  return JSON.parse(text) as T;
}
