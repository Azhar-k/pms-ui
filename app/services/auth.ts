const USER_SERVICE_BASE_URL = 'http://localhost:8073/api/v1';

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

  getCurrentUser: async (): Promise<UserResponse> => {
    console.log('[AUTH] getCurrentUser called');
    const token = tokenStorage.getAccessToken();
    console.log('[AUTH] Token from storage:', { hasToken: !!token, tokenLength: token?.length || 0 });
    
    if (!token) {
      console.error('[AUTH] No access token available');
      throw new Error('No access token available');
    }

    console.log('[AUTH] Fetching user info from:', `${USER_SERVICE_BASE_URL}/users/me`);
    const response = await fetch(`${USER_SERVICE_BASE_URL}/users/me`, {
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
};

