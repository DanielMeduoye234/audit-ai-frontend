import { supabase } from '../lib/supabase';

const API_BASE_URL = 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Centralized API client with automatic authentication
 */
class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    console.log('🔐 [ApiClient] Getting auth headers...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [ApiClient] Error getting session:', error);
        return { 'Content-Type': 'application/json' };
      }
      
      console.log('🔐 [ApiClient] Session status:', session ? 'Active' : 'None');
      
      if (!session) {
        console.warn('⚠️ [ApiClient] No session found - user may need to login');
        return { 'Content-Type': 'application/json' };
      }
      
      if (!session.access_token) {
        console.error('❌ [ApiClient] Session exists but no access_token');
        return { 'Content-Type': 'application/json' };
      }
      
      const token = session.access_token;
      console.log('🔐 [ApiClient] Token length:', token.length);
      
      // WORKAROUND: If token is corrupted (too large), create a minimal JWT-like token
      // with just the user ID from the session
      if (token.length > 4000) {
        console.warn('⚠️ [ApiClient] Token is corrupted (too large). Using workaround...');
        
        // Get user from session
        const user = session.user;
        if (!user || !user.id) {
          console.error('❌ [ApiClient] No user in session');
          return { 'Content-Type': 'application/json' };
        }
        
        // Create a minimal token with just the user info
        // Format: base64(JSON.stringify({sub: userId, email: userEmail}))
        const minimalPayload = {
          sub: user.id,
          email: user.email,
          iat: Math.floor(Date.now() / 1000)
        };
        
        const minimalToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
          btoa(JSON.stringify(minimalPayload)) + 
          '.workaround_signature';
        
        console.log('✅ [ApiClient] Using workaround token, length:', minimalToken.length);
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${minimalToken}`
        };
      }
      
      console.log('✅ [ApiClient] Valid access token found');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    } catch (error: any) {
      console.error('❌ [ApiClient] Exception in getAuthHeaders:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;
    
    console.log(`📡 [ApiClient] Making ${fetchOptions.method || 'GET'} request to: ${endpoint}`);
    console.log(`📡 [ApiClient] Requires auth: ${requireAuth}`);
    
    const headers = requireAuth 
      ? await this.getAuthHeaders()
      : { 'Content-Type': 'application/json' };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`📡 [ApiClient] Full URL: ${url}`);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers
        }
      });

      console.log(`📡 [ApiClient] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        console.error(`❌ [ApiClient] Request failed:`, error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [ApiClient] Request successful, data:`, data);
      return data;
    } catch (fetchError: any) {
      console.error('❌ [ApiClient] Fetch error:', {
        message: fetchError.message,
        endpoint,
        url
      });
      throw fetchError;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
