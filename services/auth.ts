import { API_BASE_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';

export type LoginResponse = {
  token: string;
  user: any;
};

const JWT_KEY = 'hatunbus_jwt';
const USER_KEY = 'hatunbus_user';

// In-memory cache to avoid reading SecureStore on every request
let tokenCache: string | null = null;

export async function login(email: string, password: string): Promise<LoginResponse> {
  const resp = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }

  const data = (await resp.json()) as LoginResponse;

  // Store token and user securely and in-memory
  try {
    tokenCache = data.token;
    await SecureStore.setItemAsync(JWT_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user ?? {}));
  } catch (e) {
    // If secure store fails, swallow but warn
    console.warn('SecureStore error saving token', e);
  }

  return data;
}

export type RegisterRequest = {
  firstNames: string;
  lastNames: string;
  idCard: string;
  email?: string;
  phone?: string;
  password: string;
  role: 'CLIENT' | 'DRIVER' | 'CLERK' | 'COOPERATIVE' | 'ADMIN';
  birthDate?: string; // YYYY-MM-DD
  gender?: 'M' | 'F' | 'O';
  cooperativeId?: string | null;
};

export async function register(request: RegisterRequest) {
  const resp = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || `HTTP ${resp.status}`);
  }

  return await resp.json();
}

export function setToken(token: string | null) {
  tokenCache = token;
}

export async function getToken(): Promise<string | null> {
  if (tokenCache) return tokenCache;
  try {
    tokenCache = await SecureStore.getItemAsync(JWT_KEY);
    return tokenCache;
  } catch {
    return null;
  }
}

export async function getUser(): Promise<any | null> {
  try {
    const u = await SecureStore.getItemAsync(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    tokenCache = null;
    await SecureStore.deleteItemAsync(JWT_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (e) {
    console.warn('SecureStore error deleting token', e);
  }
}

export async function initAuthFromStore(): Promise<{ token: string | null; user: any | null }> {
  const token = await getToken();
  const user = await getUser();
  return { token, user };
}
