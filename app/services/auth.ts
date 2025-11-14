// Use relative URL for client-side requests (Vite proxy handles it in dev)
// Use absolute URL for server-side requests (loaders/actions) or production
const USER_SERVICE_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? '/api/v1'  // Client-side: Use Vite proxy in development
  : 'http://localhost:8073/api/v1';  // Server-side or production: Use absolute URL

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

// Helper to get cookies from request headers (server-side) or document (client-side)
function getCookie(name: string, request?: Request): string | null {
  if (request) {
    // Server-side: get from request headers
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);
    return cookies[name] || null;
  } else if (typeof document !== 'undefined') {
    // Client-side: get from document.cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);
    return cookies[name] || null;
  }
  return null;
}

// Helper to set cookie (client-side only)
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

// Helper to delete cookie
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  // Clear cookie with expired date and same attributes as when setting
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
}

// Token management
export const tokenStorage = {
  getAccessToken: (request?: Request): string | null => {
    return getCookie(ACCESS_TOKEN_KEY, request);
  },
  
  setAccessToken: (token: string): void => {
    setCookie(ACCESS_TOKEN_KEY, token, 1); // 1 day expiry
  },
  
  getRefreshToken: (request?: Request): string | null => {
    return getCookie(REFRESH_TOKEN_KEY, request);
  },
  
  setRefreshToken: (token: string): void => {
    setCookie(REFRESH_TOKEN_KEY, token, 7); // 7 days expiry
  },
  
  getUser: (request?: Request): UserResponse | null => {
    const userStr = getCookie(USER_KEY, request);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  
  setUser: (user: UserResponse): void => {
    setCookie(USER_KEY, JSON.stringify(user), 1);
  },
  
  clear: (): void => {
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_KEY);
    // Also clear localStorage if it exists (for backward compatibility)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },
  
  isAuthenticated: (request?: Request): boolean => {
    return !!tokenStorage.getAccessToken(request);
  },
};

// Auth API
export const authAPI = {
  login: async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
    console.log('[AUTH] Starting login process...', { usernameOrEmail, hasPassword: !!password });
    console.log('[AUTH] User service URL:', `${USER_SERVICE_BASE_URL}/auth/login`);
    console.log('[AUTH] Is client side?', typeof window !== 'undefined');

    try {
      const response = await fetch(`${USER_SERVICE_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
        }),
      });

      console.log('[AUTH] Login response status:', response.status, response.statusText);
      console.log('[AUTH] Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('[AUTH] Raw response text:', responseText);

      if (!response.ok) {
        console.error('[AUTH] Login failed with status:', response.status, responseText);
        throw new Error(`Login failed: ${response.status} ${response.statusText} - ${responseText}`);
      }

      let result: ApiResponse<AuthResponse>;
      try {
        result = JSON.parse(responseText);
        console.log('[AUTH] Parsed response:', result);
      } catch (parseError) {
        console.error('[AUTH] Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      if (!result.success) {
        console.error('[AUTH] Login response indicates failure:', result.message);
        throw new Error(result.message || 'Login failed');
      }

      if (!result.data) {
        console.error('[AUTH] Login response missing data:', result);
        throw new Error('Login response missing data');
      }

      console.log('[AUTH] Login successful, received tokens:', {
        hasAccessToken: !!result.data.accessToken,
        hasRefreshToken: !!result.data.refreshToken,
        tokenType: result.data.tokenType,
        expiresIn: result.data.expiresIn,
      });

      // Store tokens in cookies (works on both server and client)
      console.log('[AUTH] Storing tokens in cookies...');
      tokenStorage.setAccessToken(result.data.accessToken);
      tokenStorage.setRefreshToken(result.data.refreshToken);

      // Verify token was stored (only works on client side for cookies)
      if (typeof document !== 'undefined') {
        const storedToken = tokenStorage.getAccessToken();
        console.log('[AUTH] Token storage verification:', {
          stored: !!storedToken,
          tokenLength: storedToken?.length || 0,
        });
      } else {
        console.log('[AUTH] Server-side: tokens will be available via cookies on next request');
      }

      // Fetch user info (optional - don't fail login if this fails)
      // Only fetch on client side since we need cookies
      if (typeof document !== 'undefined') {
        try {
          console.log('[AUTH] Fetching user info...');
          await authAPI.getCurrentUser();
          console.log('[AUTH] User info fetched successfully');
        } catch (error) {
          // Log error but don't fail login - user info can be fetched later
          console.warn('[AUTH] Failed to fetch user info after login (non-critical):', error);
          // User info will be fetched when they navigate to a protected route
        }
      } else {
        console.log('[AUTH] Server-side: user info will be fetched on client side');
      }

      console.log('[AUTH] Login process completed successfully');
      return result.data;
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    const token = tokenStorage.getAccessToken();
    
    if (token) {
      try {
        await fetch(`${USER_SERVICE_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Ignore logout errors, still clear local storage
        console.error('Logout API call failed:', error);
      }
    }

    tokenStorage.clear();
  },

  getCurrentUser: async (request?: Request): Promise<UserResponse> => {
    console.log('[AUTH] getCurrentUser called');
    const token = tokenStorage.getAccessToken(request);
    console.log('[AUTH] Token from storage:', { hasToken: !!token, tokenLength: token?.length || 0 });
    
    if (!token) {
      console.error('[AUTH] No access token available');
      throw new Error('No access token available');
    }

    // Always use the user service at localhost:8073
    // Server-side: Direct URL to user service
    // Client-side: Use Vite proxy (/api/v1 -> localhost:8073)
    const baseUrl = request 
      ? 'http://localhost:8073/api/v1'  // Server-side: Direct to user service on port 8073
      : '/api/v1';  // Client-side: Use Vite proxy (configured to forward to localhost:8073)

    console.log('[AUTH] Fetching user info from:', `${baseUrl}/users/me`);
    const response = await fetch(`${baseUrl}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('[AUTH] User info response status:', response.status, response.statusText);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[AUTH] 401 Unauthorized - clearing tokens');
        tokenStorage.clear();
        
        // Redirect to login on client-side
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          // Return a promise that never resolves to prevent further execution
          return new Promise(() => {}) as Promise<UserResponse>;
        }
        
        throw new Error('Session expired. Please login again.');
      }
      const errorText = await response.text().catch(() => response.statusText);
      console.error('[AUTH] Failed to get user:', response.status, errorText);
      throw new Error(`Failed to get user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: ApiResponse<UserResponse> = await response.json();
    console.log('[AUTH] User info response:', result);
    
    if (!result.success || !result.data) {
      console.error('[AUTH] User info response indicates failure:', result.message);
      throw new Error(result.message || 'Failed to get user');
    }

    // Store user info
    console.log('[AUTH] Storing user info:', result.data);
    tokenStorage.setUser(result.data);

    return result.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${USER_SERVICE_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      tokenStorage.clear();
      throw new Error('Token refresh failed. Please login again.');
    }

    const result: ApiResponse<AuthResponse> = await response.json();
    
    if (!result.success || !result.data) {
      tokenStorage.clear();
      throw new Error(result.message || 'Token refresh failed');
    }

    // Store new tokens
    tokenStorage.setAccessToken(result.data.accessToken);
    tokenStorage.setRefreshToken(result.data.refreshToken);

    return result.data;
  },

  updateCurrentUser: async (data: { email?: string; phone?: string }, request?: Request): Promise<UserResponse> => {
    const token = tokenStorage.getAccessToken(request);
    
    if (!token) {
      throw new Error('No access token available');
    }

    // Use absolute URL for server-side requests, relative for client-side
    const baseUrl = request 
      ? 'http://localhost:8073/api/v1'
      : '/api/v1';

    const response = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        tokenStorage.clear();
        if (typeof window !== 'undefined' && !request) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          return new Promise(() => {}) as Promise<UserResponse>;
        }
        throw new Error('Session expired. Please login again.');
      }
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to update user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: ApiResponse<UserResponse> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to update user');
    }

    // Store updated user info
    tokenStorage.setUser(result.data);

    return result.data;
  },

  changePassword: async (currentPassword: string, newPassword: string, request?: Request): Promise<void> => {
    const token = tokenStorage.getAccessToken(request);
    
    if (!token) {
      throw new Error('No access token available');
    }

    // Use absolute URL for server-side requests, relative for client-side
    const baseUrl = request 
      ? 'http://localhost:8073/api/v1'
      : '/api/v1';

    const response = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        tokenStorage.clear();
        if (typeof window !== 'undefined' && !request) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          return new Promise(() => {});
        }
        throw new Error('Session expired. Please login again.');
      }
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to change password: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to change password');
    }
  },
};

