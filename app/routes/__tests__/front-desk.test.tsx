import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import FrontDeskPage, { loader, action } from '../front-desk';

describe('Front Desk Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render front desk calendar', async () => {
    const mockReservations = [
      {
        id: 1,
        reservationNumber: 'RES-001',
        guest: { firstName: 'John', lastName: 'Doe' },
        room: { roomNumber: '101' },
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
        status: 'CONFIRMED',
      },
    ];

    mockAPI.reservationAPI.getByDateRange.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/front-desk?view=month&date=2024-01-01');
    const loaderData = await loader({ request });

    await renderWithRouter(<FrontDeskPage />, {
      routes: [
        {
          path: '/front-desk',
          Component: FrontDeskPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/front-desk?view=month&date=2024-01-01'],
    });

    await waitFor(() => {
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });
  });

  it('should render month view by default', async () => {
    const mockReservations = [];

    mockAPI.reservationAPI.getByDateRange.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/front-desk');
    const loaderData = await loader({ request });

    await renderWithRouter(<FrontDeskPage />, {
      routes: [
        {
          path: '/front-desk',
          Component: FrontDeskPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/front-desk'],
    });

    await waitFor(() => {
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });
  });

  it('should render week view', async () => {
    const mockReservations = [];

    mockAPI.reservationAPI.getByDateRange.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/front-desk?view=week&date=2024-01-01');
    const loaderData = await loader({ request });

    await renderWithRouter(<FrontDeskPage />, {
      routes: [
        {
          path: '/front-desk',
          Component: FrontDeskPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/front-desk?view=week&date=2024-01-01'],
    });

    await waitFor(() => {
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });
  });

  it('should handle check-in action', async () => {
    mockAPI.reservationAPI.checkIn.mockResolvedValue({});

    const formData = new FormData();
    formData.append('action', 'checkIn');
    formData.append('reservationId', '1');
    formData.append('redirectTo', '/front-desk');

    const request = new Request('http://localhost/front-desk', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: {} } as any);

    expect(mockAPI.reservationAPI.checkIn).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('status', 302);
  });

  it('should handle check-out action', async () => {
    mockAPI.reservationAPI.checkOut.mockResolvedValue({});

    const formData = new FormData();
    formData.append('action', 'checkOut');
    formData.append('reservationId', '1');
    formData.append('redirectTo', '/front-desk');

    const request = new Request('http://localhost/front-desk', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: {} } as any);

    expect(mockAPI.reservationAPI.checkOut).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('status', 302);
  });

  it('should render summary stats', async () => {
    const mockReservations = [
      {
        id: 1,
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date().toISOString().split('T')[0],
        status: 'CONFIRMED',
      },
    ];

    mockAPI.reservationAPI.getByDateRange.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/front-desk');
    const loaderData = await loader({ request });

    await renderWithRouter(<FrontDeskPage />, {
      routes: [
        {
          path: '/front-desk',
          Component: FrontDeskPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/front-desk'],
    });

    await waitFor(() => {
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.reservationAPI.getByDateRange.mockRejectedValue(new Error('API Error'));

    const request = new Request('http://localhost/front-desk');
    const loaderData = await loader({ request });

    await renderWithRouter(<FrontDeskPage />, {
      routes: [
        {
          path: '/front-desk',
          Component: FrontDeskPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/front-desk'],
    });

    await waitFor(() => {
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });
  });
});

