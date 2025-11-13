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

// Token management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  getUser: (): UserResponse | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  setUser: (user: UserResponse): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};

// Auth API
export const authAPI = {
  login: async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: ApiResponse<AuthResponse> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Login failed');
    }

    // Only store tokens if we're on the client side (localStorage is available)
    if (typeof window !== 'undefined') {
      // Store tokens
      tokenStorage.setAccessToken(result.data.accessToken);
      tokenStorage.setRefreshToken(result.data.refreshToken);

      // Verify token was stored
      const storedToken = tokenStorage.getAccessToken();
      if (!storedToken) {
        throw new Error('Failed to store access token');
      }

      // Fetch user info (optional - don't fail login if this fails)
      try {
        await authAPI.getCurrentUser();
      } catch (error) {
        // Log error but don't fail login - user info can be fetched later
        console.warn('Failed to fetch user info after login:', error);
        // User info will be fetched when they navigate to a protected route
      }
    }

    return result.data;
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
    const token = tokenStorage.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${USER_SERVICE_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        tokenStorage.clear();
        throw new Error('Session expired. Please login again.');
      }
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to get user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: ApiResponse<UserResponse> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to get user');
    }

    // Store user info
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

