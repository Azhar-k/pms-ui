import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import Dashboard, { loader } from '../home';

describe('Home/Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard with stats', async () => {
    const mockData = {
      rooms: [
        { id: 1, status: 'READY' },
        { id: 2, status: 'READY' },
        { id: 3, status: 'MAINTENANCE' },
      ],
      guests: [{ id: 1 }, { id: 2 }],
      reservations: [
        { id: 1, status: 'PENDING' },
        { id: 2, status: 'CHECKED_IN' },
        { id: 3, status: 'CONFIRMED' },
      ],
      invoices: [
        { id: 1, status: 'PENDING', totalAmount: 100 },
        { id: 2, status: 'PAID', totalAmount: 200 },
        { id: 3, status: 'PAID', totalAmount: 300 },
      ],
    };

    mockAPI.roomAPI.getAll.mockResolvedValue({ content: mockData.rooms });
    mockAPI.guestAPI.getAll.mockResolvedValue({ content: mockData.guests });
    mockAPI.reservationAPI.getAll.mockResolvedValue({ content: mockData.reservations });
    mockAPI.invoiceAPI.getAll.mockResolvedValue({ content: mockData.invoices });

    const loaderData = await loader({ request: new Request('http://localhost/') } as any);

    await renderWithRouter(<Dashboard />, {
      routes: [
        {
          path: '/',
          Component: Dashboard,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/'],
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Rooms')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Guests')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('₹500.00')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.roomAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.guestAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.reservationAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.invoiceAPI.getAll.mockRejectedValue(new Error('API Error'));

    const loaderData = await loader({ request: new Request('http://localhost/') } as any);

    await renderWithRouter(<Dashboard />, {
      routes: [
        {
          path: '/',
          Component: Dashboard,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/'],
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Should show zeros when API fails
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render quick action links', async () => {
    mockAPI.roomAPI.getAll.mockResolvedValue({ content: [] });
    mockAPI.guestAPI.getAll.mockResolvedValue({ content: [] });
    mockAPI.reservationAPI.getAll.mockResolvedValue({ content: [] });
    mockAPI.invoiceAPI.getAll.mockResolvedValue({ content: [] });

    const loaderData = await loader({ request: new Request('http://localhost/') } as any);

    await renderWithRouter(<Dashboard />, {
      routes: [
        {
          path: '/',
          Component: Dashboard,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/'],
    });

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('➕ Create New Booking')).toBeInTheDocument();
    expect(screen.getByText('➕ Register New Guest')).toBeInTheDocument();
    expect(screen.getByText('➕ Add New Room')).toBeInTheDocument();
  });

  it('should render system status section', async () => {
    mockAPI.roomAPI.getAll.mockResolvedValue({ content: [] });
    mockAPI.guestAPI.getAll.mockResolvedValue({ content: [] });
    mockAPI.reservationAPI.getAll.mockResolvedValue({ content: [] });
    mockAPI.invoiceAPI.getAll.mockResolvedValue({ content: [] });

    const loaderData = await loader({ request: new Request('http://localhost/') } as any);

    await renderWithRouter(<Dashboard />, {
      routes: [
        {
          path: '/',
          Component: Dashboard,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/'],
    });

    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    expect(screen.getByText('API Connection')).toBeInTheDocument();
    expect(screen.getByText('Server Status')).toBeInTheDocument();
  });
});

