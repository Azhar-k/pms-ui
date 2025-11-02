const API_BASE_URL = 'http://localhost:8080/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
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
      throw new Error(`Network error: Unable to connect to API at ${url}. Please ensure the backend server is running.`);
    }
    throw error;
  }
}

// Room APIs
export const roomAPI = {
  getAll: () => fetchAPI<any[]>('/rooms'),
  getById: (id: number) => fetchAPI<any>(`/rooms/${id}`),
  getByNumber: (roomNumber: string) => fetchAPI<any>(`/rooms/number/${roomNumber}`),
  getByType: (roomTypeId: number) => fetchAPI<any[]>(`/rooms/type/${roomTypeId}`),
  getAvailable: () => fetchAPI<any[]>('/rooms/available'),
  getAvailableForDateRange: (checkInDate: string, checkOutDate: string) =>
    fetchAPI<any[]>(`/rooms/available/range?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`),
  create: (data: any) => fetchAPI<any>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI<void>(`/rooms/${id}`, { method: 'DELETE' }),
};

// Room Type APIs
export const roomTypeAPI = {
  getAll: () => fetchAPI<any[]>('/room-types'),
  getById: (id: number) => fetchAPI<any>(`/room-types/${id}`),
  getByName: (name: string) => fetchAPI<any>(`/room-types/name/${name}`),
  create: (data: any) => fetchAPI<any>('/room-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI<void>(`/room-types/${id}`, { method: 'DELETE' }),
};

// Rate Type APIs
export const rateTypeAPI = {
  getAll: () => fetchAPI<any[]>('/rate-types'),
  getById: (id: number) => fetchAPI<any>(`/rate-types/${id}`),
  getByName: (name: string) => fetchAPI<any>(`/rate-types/name/${name}`),
  create: (data: any) => fetchAPI<any>('/rate-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/rate-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI<void>(`/rate-types/${id}`, { method: 'DELETE' }),
  getRateForRoomType: (rateTypeId: number, roomTypeId: number) =>
    fetchAPI<number>(`/rate-types/${rateTypeId}/room-type-rates/${roomTypeId}`),
  updateRoomTypeRate: (rateTypeId: number, roomTypeId: number, rate: number) =>
    fetchAPI<any>(`/rate-types/${rateTypeId}/room-type-rates/${roomTypeId}?rate=${rate}`, { method: 'PUT' }),
  addRoomTypeRate: (rateTypeId: number, data: any) =>
    fetchAPI<any>(`/rate-types/${rateTypeId}/room-type-rates`, { method: 'POST', body: JSON.stringify(data) }),
  removeRoomTypeRate: (rateTypeId: number, roomTypeId: number) =>
    fetchAPI<void>(`/rate-types/${rateTypeId}/room-type-rates/${roomTypeId}`, { method: 'DELETE' }),
};

// Guest APIs
export const guestAPI = {
  getAll: () => fetchAPI<any[]>('/guests'),
  getById: (id: number) => fetchAPI<any>(`/guests/${id}`),
  getByEmail: (email: string) => fetchAPI<any>(`/guests/email/${email}`),
  create: (data: any) => fetchAPI<any>('/guests', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI<void>(`/guests/${id}`, { method: 'DELETE' }),
};

// Reservation APIs
export const reservationAPI = {
  getAll: () => fetchAPI<any[]>('/reservations'),
  getById: (id: number) => fetchAPI<any>(`/reservations/${id}`),
  getByNumber: (reservationNumber: string) => fetchAPI<any>(`/reservations/number/${reservationNumber}`),
  getByStatus: (status: string) => fetchAPI<any[]>(`/reservations/status/${status}`),
  getByGuest: (guestId: number) => fetchAPI<any[]>(`/reservations/guest/${guestId}`),
  getByDateRange: (startDate: string, endDate: string) =>
    fetchAPI<any[]>(`/reservations/date-range?startDate=${startDate}&endDate=${endDate}`),
  create: (data: any) => fetchAPI<any>('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  checkIn: (id: number) => fetchAPI<any>(`/reservations/${id}/check-in`, { method: 'POST' }),
  checkOut: (id: number) => fetchAPI<any>(`/reservations/${id}/check-out`, { method: 'POST' }),
  cancel: (id: number) => fetchAPI<any>(`/reservations/${id}/cancel`, { method: 'POST' }),
};

// Invoice APIs
export const invoiceAPI = {
  getAll: () => fetchAPI<any[]>('/invoices'),
  getById: (id: number) => fetchAPI<any>(`/invoices/${id}`),
  getByNumber: (invoiceNumber: string) => fetchAPI<any>(`/invoices/number/${invoiceNumber}`),
  getByStatus: (status: string) => fetchAPI<any[]>(`/invoices/status/${status}`),
  getByReservation: (reservationId: number) => fetchAPI<any[]>(`/invoices/reservation/${reservationId}`),
  generate: (reservationId: number) => fetchAPI<any>(`/invoices/generate/${reservationId}`, { method: 'POST' }),
  addItem: (invoiceId: number, data: any) =>
    fetchAPI<any>(`/invoices/${invoiceId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  markAsPaid: (invoiceId: number, paymentMethod: string) =>
    fetchAPI<any>(`/invoices/${invoiceId}/pay?paymentMethod=${encodeURIComponent(paymentMethod)}`, { method: 'POST' }),
};

