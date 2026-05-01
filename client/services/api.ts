import axios from 'axios';
import { API_URL } from '../constants/Config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Resume upload
export async function uploadResume(fileUri: string, fileName: string, mimeType: string, userEmail: string) {
  const formData = new FormData();
  formData.append('resume', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);
  formData.append('userEmail', userEmail);

  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const resultData = res.data?.result || res.data?.data?.result;
  if (!resultData) {
    throw new Error(res.data?.error || 'Invalid analysis response from server');
  }
  return resultData;
}

// Fetch analyses
export async function fetchAnalyses(email: string) {
  const res = await api.get(`/analyses?email=${encodeURIComponent(email)}`);
  return res.data.data || res.data || [];
}

export async function fetchAnalysesByEmail(email: string) {
  const res = await api.get(`/analyses/${email}`);
  return normalize(res.data);
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
  const res = await api.post('/api/interviews', data);
  return res.data;
}

export async function fetchInterviews(email: string) {
  const res = await api.get(`/api/interviews/${email}`);
  return normalize(res.data);
}

// Save aptitude
export async function saveAptitude(data: {
  userEmail: string;
  score: number;
  total: number;
}) {
  const res = await api.post('/api/aptitude', data);
  return res.data;
}

export async function fetchAptitude(email: string) {
  const res = await api.get(`/api/aptitude/${email}`);
  return normalize(res.data);
}

// Save coding
export async function saveCoding(data: {
  userEmail: string;
  question: string;
  code: string;
  feedback: string;
}) {
  const res = await api.post('/api/coding', data);
  return res.data;
}

export async function fetchCoding(email: string) {
  const res = await api.get(`/api/coding/${email}`);
  return normalize(res.data);
}

// Normalize API response
function normalize(payload: any): any[] {
  if (!payload) return [];
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default api;
