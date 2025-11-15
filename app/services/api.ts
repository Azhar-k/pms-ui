import { tokenStorage } from './auth';

// Use relative URL for client-side requests (Vite proxy handles it in dev)
// Use absolute URL for server-side requests (loaders/actions) or production
const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? '/api'  // Client-side: Use Vite proxy in development
  : 'http://localhost:8080/api';  // Server-side or production: Use absolute URL

// User Service API Base URL
const USER_SERVICE_API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? '/api/v1'  // Client-side: Use Vite proxy in development
  : 'http://localhost:8073/api/v1';  // Server-side or production: Use absolute URL

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  request?: Request
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get access token (from cookies if request is provided, otherwise from cookies on client)
  const token = tokenStorage.getAccessToken(request);
  
  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        tokenStorage.clear();
        
        // For client-side requests, redirect to login immediately
        if (typeof window !== 'undefined' && !request) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          // Return a promise that never resolves to prevent further execution
          return new Promise(() => {});
        }
        
        // For server-side requests, throw error so route protection can handle it
        throw new Error('UNAUTHORIZED');
      }
      
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new Error(`CORS error: Unable to connect to API at ${url}. Please ensure the backend server is running and CORS is properly configured, or restart the Vite dev server to enable the proxy.`);
      }
      throw new Error(`Network error: Unable to connect to API at ${url}. Please ensure the backend server is running.`);
    }
    throw error;
  }
}

async function fetchUserServiceAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  request?: Request
): Promise<T> {
  const url = `${USER_SERVICE_API_BASE_URL}${endpoint}`;
  
  // Get access token (from cookies if request is provided, otherwise from cookies on client)
  const token = tokenStorage.getAccessToken(request);
  
  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        tokenStorage.clear();
        
        // For client-side requests, redirect to login immediately
        if (typeof window !== 'undefined' && !request) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          // Return a promise that never resolves to prevent further execution
          return new Promise(() => {});
        }
        
        // For server-side requests, throw error so route protection can handle it
        throw new Error('UNAUTHORIZED');
      }
      
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new Error(`CORS error: Unable to connect to API at ${url}. Please ensure the backend server is running and CORS is properly configured, or restart the Vite dev server to enable the proxy.`);
      }
      throw new Error(`Network error: Unable to connect to API at ${url}. Please ensure the backend server is running.`);
    }
    throw error;
  }
}

// Type for paginated response
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Room APIs
export const roomAPI = {
  getAll: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    roomNumber?: string;
    roomTypeId?: number;
    status?: string;
    minMaxOccupancy?: number;
    maxMaxOccupancy?: number;
    floor?: number;
    hasBalcony?: boolean;
    hasView?: boolean;
    searchTerm?: string;
  }, request?: Request) => {
    const queryString = params ? buildQueryString(params) : '';
    return fetchAPI<PaginatedResponse<any>>(`/rooms${queryString}`, {}, request);
  },
  getById: (id: number, request?: Request) => fetchAPI<any>(`/rooms/${id}`, {}, request),
  getByNumber: (roomNumber: string, request?: Request) => fetchAPI<any>(`/rooms/number/${roomNumber}`, {}, request),
  getByType: (roomTypeId: number, request?: Request) => fetchAPI<any[]>(`/rooms/type/${roomTypeId}`, {}, request),
  getAvailable: (request?: Request) => fetchAPI<any[]>('/rooms/available', {}, request),
  getAvailableForDateRange: (checkInDate: string, checkOutDate: string, request?: Request) =>
    fetchAPI<any[]>(`/rooms/available/range?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`, {}, request),
  create: (data: any, request?: Request) => fetchAPI<any>('/rooms', { method: 'POST', body: JSON.stringify(data) }, request),
  update: (id: number, data: any, request?: Request) => fetchAPI<any>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  delete: (id: number, request?: Request) => fetchAPI<void>(`/rooms/${id}`, { method: 'DELETE' }, request),
};

// Room Type APIs
export const roomTypeAPI = {
  getAll: (request?: Request) => fetchAPI<any[]>('/room-types', {}, request),
  getById: (id: number, request?: Request) => fetchAPI<any>(`/room-types/${id}`, {}, request),
  getByName: (name: string, request?: Request) => fetchAPI<any>(`/room-types/name/${name}`, {}, request),
  create: (data: any, request?: Request) => fetchAPI<any>('/room-types', { method: 'POST', body: JSON.stringify(data) }, request),
  update: (id: number, data: any, request?: Request) => fetchAPI<any>(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  delete: (id: number, request?: Request) => fetchAPI<void>(`/room-types/${id}`, { method: 'DELETE' }, request),
};

// Rate Type APIs
export const rateTypeAPI = {
  getAll: (request?: Request) => fetchAPI<any[]>('/rate-types', {}, request),
  getById: (id: number, request?: Request) => fetchAPI<any>(`/rate-types/${id}`, {}, request),
  getByName: (name: string, request?: Request) => fetchAPI<any>(`/rate-types/name/${name}`, {}, request),
  create: (data: any, request?: Request) => fetchAPI<any>('/rate-types', { method: 'POST', body: JSON.stringify(data) }, request),
  update: (id: number, data: any, request?: Request) => fetchAPI<any>(`/rate-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  delete: (id: number, request?: Request) => fetchAPI<void>(`/rate-types/${id}`, { method: 'DELETE' }, request),
  getRateForRoomType: (rateTypeId: number, roomTypeId: number, request?: Request) =>
    fetchAPI<number>(`/rate-types/${rateTypeId}/room-type-rates/${roomTypeId}`, {}, request),
  updateRoomTypeRate: (rateTypeId: number, roomTypeId: number, rate: number, request?: Request) =>
    fetchAPI<any>(`/rate-types/${rateTypeId}/room-type-rates/${roomTypeId}?rate=${rate}`, { method: 'PUT' }, request),
  addRoomTypeRate: (rateTypeId: number, data: any, request?: Request) =>
    fetchAPI<any>(`/rate-types/${rateTypeId}/room-type-rates`, { method: 'POST', body: JSON.stringify(data) }, request),
  removeRoomTypeRate: (rateTypeId: number, roomTypeId: number, request?: Request) =>
    fetchAPI<void>(`/rate-types/${rateTypeId}/room-type-rates/${roomTypeId}`, { method: 'DELETE' }, request),
};

// Guest APIs
export const guestAPI = {
  getAll: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    city?: string;
    state?: string;
    country?: string;
    identificationType?: string;
    searchTerm?: string;
  }, request?: Request) => {
    const queryString = params ? buildQueryString(params) : '';
    return fetchAPI<PaginatedResponse<any>>(`/guests${queryString}`, {}, request);
  },
  getById: (id: number, request?: Request) => fetchAPI<any>(`/guests/${id}`, {}, request),
  getByEmail: (email: string, request?: Request) => fetchAPI<any>(`/guests/email/${email}`, {}, request),
  create: (data: any, request?: Request) => fetchAPI<any>('/guests', { method: 'POST', body: JSON.stringify(data) }, request),
  update: (id: number, data: any, request?: Request) => fetchAPI<any>(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  delete: (id: number, request?: Request) => fetchAPI<void>(`/guests/${id}`, { method: 'DELETE' }, request),
};

// Reservation APIs
export const reservationAPI = {
  getAll: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    reservationNumber?: string;
    guestId?: number;
    roomId?: number;
    rateTypeId?: number;
    status?: string;
    checkInDateFrom?: string;
    checkInDateTo?: string;
    checkOutDateFrom?: string;
    checkOutDateTo?: string;
    minNumberOfGuests?: number;
    maxNumberOfGuests?: number;
    paymentStatus?: string;
    searchTerm?: string;
  }, request?: Request) => {
    const queryString = params ? buildQueryString(params) : '';
    return fetchAPI<PaginatedResponse<any>>(`/reservations${queryString}`, {}, request);
  },
  getById: (id: number, request?: Request) => fetchAPI<any>(`/reservations/${id}`, {}, request),
  getByNumber: (reservationNumber: string, request?: Request) => fetchAPI<any>(`/reservations/number/${reservationNumber}`, {}, request),
  getByStatus: (status: string, request?: Request) => fetchAPI<any[]>(`/reservations/status/${status}`, {}, request),
  getByGuest: (guestId: number, request?: Request) => fetchAPI<any[]>(`/reservations/guest/${guestId}`, {}, request),
  getByDateRange: (startDate: string, endDate: string, request?: Request) =>
    fetchAPI<any[]>(`/reservations/date-range?startDate=${startDate}&endDate=${endDate}`, {}, request),
  create: (data: any, request?: Request) => fetchAPI<any>('/reservations', { method: 'POST', body: JSON.stringify(data) }, request),
  update: (id: number, data: any, request?: Request) => fetchAPI<any>(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  checkIn: (id: number, request?: Request) => fetchAPI<any>(`/reservations/${id}/check-in`, { method: 'POST' }, request),
  checkOut: (id: number, request?: Request) => fetchAPI<any>(`/reservations/${id}/check-out`, { method: 'POST' }, request),
  cancel: (id: number, request?: Request) => fetchAPI<any>(`/reservations/${id}/cancel`, { method: 'POST' }, request),
};

// Invoice APIs
export const invoiceAPI = {
  getAll: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    invoiceNumber?: string;
    reservationId?: number;
    status?: string;
    issuedDateFrom?: string;
    issuedDateTo?: string;
    paidDateFrom?: string;
    paidDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    paymentMethod?: string;
    searchTerm?: string;
  }, request?: Request) => {
    const queryString = params ? buildQueryString(params) : '';
    return fetchAPI<PaginatedResponse<any>>(`/invoices${queryString}`, {}, request);
  },
  getById: (id: number, request?: Request) => fetchAPI<any>(`/invoices/${id}`, {}, request),
  getByNumber: (invoiceNumber: string, request?: Request) => fetchAPI<any>(`/invoices/number/${invoiceNumber}`, {}, request),
  getByStatus: (status: string, request?: Request) => fetchAPI<any[]>(`/invoices/status/${status}`, {}, request),
  getByReservation: (reservationId: number, request?: Request) => fetchAPI<any[]>(`/invoices/reservation/${reservationId}`, {}, request),
  generate: (reservationId: number, request?: Request) => fetchAPI<any>(`/invoices/generate/${reservationId}`, { method: 'POST' }, request),
  addItem: (invoiceId: number, data: any, request?: Request) =>
    fetchAPI<any>(`/invoices/${invoiceId}/items`, { method: 'POST', body: JSON.stringify(data) }, request),
  removeItem: (invoiceId: number, itemId: number, request?: Request) =>
    fetchAPI<any>(`/invoices/${invoiceId}/items/${itemId}`, { method: 'DELETE' }, request),
  markAsPaid: (invoiceId: number, paymentMethod: string, request?: Request) =>
    fetchAPI<any>(`/invoices/${invoiceId}/pay?paymentMethod=${encodeURIComponent(paymentMethod)}`, { method: 'POST' }, request),
};

// User Management APIs (User Service)

export const userManagementAPI = {
  // Users
  getAllUsers: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    username?: string;
    email?: string;
    status?: string;
  }, request?: Request) => {
    const queryString = params ? buildQueryString(params) : '';
    return fetchUserServiceAPI<{ success: boolean; data: PaginatedResponse<any> }>(`/users${queryString}`, {}, request);
  },
  getUserById: (id: number, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/users/${id}`, {}, request),
  createUser: (data: any, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/admin/users`, { method: 'POST', body: JSON.stringify(data) }, request),
  updateUser: (id: number, data: any, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  deleteUser: (id: number, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }, request),
  updateUserStatus: (id: number, status: string, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, request),
  assignRole: (userId: number, roleName: string, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/admin/users/${userId}/roles?roleName=${encodeURIComponent(roleName)}`, { method: 'POST' }, request),
  removeRole: (userId: number, roleName: string, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/admin/users/${userId}/roles?roleName=${encodeURIComponent(roleName)}`, { method: 'DELETE' }, request),
  resetPassword: (userId: number, newPassword: string, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean }>(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }, request),
  
  // Roles
  getAllRoles: (request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any[] }>(`/roles`, {}, request),
  getRoleById: (id: number, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/roles/${id}`, {}, request),
  getRoleByName: (name: string, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/roles/name/${encodeURIComponent(name)}`, {}, request),
  createRole: (data: any, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/roles`, { method: 'POST', body: JSON.stringify(data) }, request),
  updateRole: (id: number, data: any, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean; data: any }>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }, request),
  deleteRole: (id: number, request?: Request) => 
    fetchUserServiceAPI<{ success: boolean }>(`/roles/${id}`, { method: 'DELETE' }, request),
  
  // Audit Logs
  getAuditLogs: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    userId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
  }, request?: Request) => {
    const queryString = params ? buildQueryString(params) : '';
    return fetchUserServiceAPI<{ success: boolean; data: PaginatedResponse<any> }>(`/admin/audit-logs${queryString}`, {}, request);
  },
};

