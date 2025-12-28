import axios from 'axios';
import { supabase } from './supabase';

// Use environment variable or default to localhost:5000
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the Supabase session token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    let token = session.access_token;
    
    // WORKAROUND: If token is corrupted (too large > 4KB), create a minimal JWT-like token
    if (token.length > 4000 && session.user) {
      console.warn('⚠️ [API] Token is corrupted (too large). Using workaround...');
      
      const minimalPayload = {
        sub: session.user.id,
        email: session.user.email,
        iat: Math.floor(Date.now() / 1000)
      };
      
      // Create a fake but syntactically valid JWT
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
        btoa(JSON.stringify(minimalPayload)) + 
        '.workaround_signature';
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;
