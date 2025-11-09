import { render, RenderOptions, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';

// Create mock API functions - these will be used in the mock
const mockRoomAPI = {
  getAll: vi.fn(),
  getById: vi.fn(),
  getAvailable: vi.fn(),
  getAvailableForDateRange: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockRoomTypeAPI = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockRateTypeAPI = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockGuestAPI = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockReservationAPI = {
  getAll: vi.fn(),
  getById: vi.fn(),
  getByDateRange: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  checkIn: vi.fn(),
  checkOut: vi.fn(),
  cancel: vi.fn(),
};

const mockInvoiceAPI = {
  getAll: vi.fn(),
  getById: vi.fn(),
  generate: vi.fn(),
  markAsPaid: vi.fn(),
};

// Export mock API for use in tests
export const mockAPI = {
  roomAPI: mockRoomAPI,
  roomTypeAPI: mockRoomTypeAPI,
  rateTypeAPI: mockRateTypeAPI,
  guestAPI: mockGuestAPI,
  reservationAPI: mockReservationAPI,
  invoiceAPI: mockInvoiceAPI,
};

// Mock the API module - vi.mock is hoisted, so we reference the functions directly
vi.mock('../app/services/api', () => ({
  roomAPI: mockRoomAPI,
  roomTypeAPI: mockRoomTypeAPI,
  rateTypeAPI: mockRateTypeAPI,
  guestAPI: mockGuestAPI,
  reservationAPI: mockReservationAPI,
  invoiceAPI: mockInvoiceAPI,
  PaginatedResponse: {},
}));

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routes?: Array<{
    path: string;
    Component: React.ComponentType;
    loader?: (args: any) => Promise<any>;
    action?: (args: any) => Promise<any>;
  }>;
  initialEntries?: string[];
}

export async function renderWithRouter(
  ui: ReactElement,
  { route = '/', routes, initialEntries, ...renderOptions }: CustomRenderOptions = {}
) {
  const router = createMemoryRouter(
    routes || [
      {
        path: route,
        Component: () => ui,
      },
    ],
    {
      initialEntries: initialEntries || [route],
    }
  );

  const result = render(<RouterProvider router={router} />, renderOptions);
  
  // Wait for router to be ready
  await waitFor(() => {
    expect(router.state).toBeDefined();
  });

  return {
    ...result,
    router,
  };
}

export * from '@testing-library/react';
export { waitFor };

