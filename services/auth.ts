import { API_BASE_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type LoginResponse = {
  token: string;
  user: any;
};

const JWT_KEY = 'hatunbus_jwt';
const USER_KEY = 'hatunbus_user';

// In-memory cache to avoid reading SecureStore on every request
let tokenCache: string | null = null;

// Helper para determinar si estamos en web
const isWeb = Platform.OS === 'web';

// Storage wrapper que funciona tanto en web como en mobile
const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

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
  // Only store essential user data to avoid exceeding SecureStore 2048 bytes limit
  try {
    // Validar que el token no esté vacío
    if (!data.token || data.token.trim() === '') {
      console.error('Token vacío recibido del servidor');
      throw new Error('Token recibido está vacío');
    }
    
    console.log('Guardando token en storage...');
    tokenCache = data.token;
    await storage.setItem(JWT_KEY, data.token);
    console.log('Token guardado exitosamente');
    
    // Extract only essential user fields (exclude large fields like profilePhoto)
    const essentialUserData = data.user ? {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      firstNames: data.user.firstNames,
      lastNames: data.user.lastNames,
      idCard: data.user.idCard,
      phone: data.user.phone,
    } : {};
    
    await storage.setItem(USER_KEY, JSON.stringify(essentialUserData));
    console.log('Usuario guardado exitosamente');
  } catch (e) {
    console.error('Error al guardar token:', e);
    throw e;
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
  if (tokenCache) {
    console.log('Token from cache');
    return tokenCache;
  }
  try {
    tokenCache = await storage.getItem(JWT_KEY);
    console.log('Token from storage:', tokenCache ? 'EXISTS' : 'NULL');
    return tokenCache;
  } catch (e) {
    console.error('Error getting token:', e);
    return null;
  }
}

export async function getUser(): Promise<any | null> {
  try {
    const u = await storage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    tokenCache = null;
    await storage.deleteItem(JWT_KEY);
    await storage.deleteItem(USER_KEY);
  } catch (e) {
  }
}

export async function initAuthFromStore(): Promise<{ token: string | null; user: any | null }> {
  const token = await getToken();
  const user = await getUser();
  return { token, user };
}
