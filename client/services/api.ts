import { API_URL } from '../constants/Config';
import { Platform } from 'react-native';
import { authClient } from '../lib/auth-client';

// ─── Authenticated API Service ───
// On web: browser cookies are sent automatically with credentials: 'include'.
//   The Config.ts URL rewrite ensures page host == API host for same-site cookies.
// On native: expoClient stores session cookies in SecureStore; we read them
//   and attach manually via Cookie + x-better-auth-cookie headers.

async function getAuthCookie(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // web uses browser cookies
  try {
    // The expoClient plugin exposes a getCookie() action
    const cookie = (authClient as any).getCookie?.();
    if (cookie) return cookie;
  } catch {}
  // Fallback: read directly from SecureStore
  try {
    const SecureStore = require('expo-secure-store');
    const raw = SecureStore.getItem('better-auth_cookie');
    if (!raw) return null;
    // Parse the stored cookie JSON → format as Cookie header string
    const parsed = JSON.parse(raw);
    return Object.entries(parsed).reduce((acc: string, [key, value]: [string, any]) => {
      if (value.expires && new Date(value.expires) < new Date()) return acc;
      return acc ? `${acc}; ${key}=${value.value}` : `${key}=${value.value}`;
    }, '');
  } catch {
    return null;
  }
}

async function apiRequest<T = any>(
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  // On native, manually attach the session cookie via both headers
  const cookie = await getAuthCookie();
  if (cookie) {
    headers['Cookie'] = cookie;
    headers['x-better-auth-cookie'] = cookie;
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    credentials: 'include',
    headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body);
  } else if (options.body) {
    fetchOptions.body = options.body;
  }

  fetchOptions.headers = headers;

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errBody.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data as T;
}

// Resume upload
export async function uploadResume(fileUri: string, fileName: string, mimeType: string, userEmail: string) {
  const formData = new FormData();
  formData.append('resume', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);
  formData.append('userEmail', userEmail);

  const res = await apiRequest<any>('/upload', {
    method: 'POST',
    body: formData,
  });

  const resultData = res?.result || res?.data?.result;
  if (!resultData) {
    throw new Error(res?.error || 'Invalid analysis response from server');
  }
  return resultData;
}

// Fetch analyses
export async function fetchAnalyses(email: string) {
  const res = await apiRequest<any>(`/analyses?email=${encodeURIComponent(email)}`);
  return res?.data || res || [];
}

export async function fetchAnalysesByEmail(email: string) {
  const res = await apiRequest<any>(`/analyses/${email}`);
  return normalize(res);
}

// Save interview
export async function saveInterview(data: {
  userEmail: string;
  questions: string[];
  answers: string[];
  feedback: string;
  score?: number;
  mode?: string;
}) {
  return apiRequest('/api/interviews', { method: 'POST', body: data });
}

export async function fetchInterviews(email: string) {
  const res = await apiRequest<any>(`/api/interviews/${email}`);
  return normalize(res);
}

// Save aptitude
export async function saveAptitude(data: {
  userEmail: string;
  score: number;
  total: number;
}) {
  return apiRequest('/api/aptitude', { method: 'POST', body: data });
}

export async function fetchAptitude(email: string) {
  const res = await apiRequest<any>(`/api/aptitude/${email}`);
  return normalize(res);
}

// Save coding
export async function saveCoding(data: {
  userEmail: string;
  question: string;
  code: string;
  feedback: string;
}) {
  return apiRequest('/api/coding', { method: 'POST', body: data });
}

export async function fetchCoding(email: string) {
  const res = await apiRequest<any>(`/api/coding/${email}`);
  return normalize(res);
}

// Normalize API response
function normalize(payload: any): any[] {
  if (!payload) return [];
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export { apiRequest };
