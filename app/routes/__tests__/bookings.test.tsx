import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import BookingsPage, { loader } from '../bookings';

describe('Bookings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render bookings list', async () => {
    const mockReservations = {
      content: [
        {
          id: 1,
          reservationNumber: 'RES-001',
          guest: { firstName: 'John', lastName: 'Doe' },
          room: { roomNumber: '101' },
          checkInDate: '2024-01-01',
          checkOutDate: '2024-01-05',
          status: 'CONFIRMED',
          totalAmount: 500,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.reservationAPI.getAll.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/bookings');
    const loaderData = await loader({ request });

    await renderWithRouter(<BookingsPage />, {
      routes: [
        {
          path: '/bookings',
          Component: BookingsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings'],
    });

    await waitFor(() => {
      expect(screen.getByText('Bookings')).toBeInTheDocument();
    });

    expect(screen.getByText('RES-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('should render empty state when no bookings', async () => {
    const mockReservations = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.reservationAPI.getAll.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/bookings');
    const loaderData = await loader({ request });

    await renderWithRouter(<BookingsPage />, {
      routes: [
        {
          path: '/bookings',
          Component: BookingsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings'],
    });

    await waitFor(() => {
      expect(screen.getByText(/No bookings found/)).toBeInTheDocument();
    });
  });

  it('should render filter form', async () => {
    const mockReservations = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.reservationAPI.getAll.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/bookings');
    const loaderData = await loader({ request });

    await renderWithRouter(<BookingsPage />, {
      routes: [
        {
          path: '/bookings',
          Component: BookingsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings'],
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Search/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    });
  });

  it('should render create booking button', async () => {
    const mockReservations = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.reservationAPI.getAll.mockResolvedValue(mockReservations);

    const request = new Request('http://localhost/bookings');
    const loaderData = await loader({ request });

    await renderWithRouter(<BookingsPage />, {
      routes: [
        {
          path: '/bookings',
          Component: BookingsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings'],
    });

    await waitFor(() => {
      expect(screen.getByText('Create New Booking')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.reservationAPI.getAll.mockRejectedValue(new Error('API Error'));

    const request = new Request('http://localhost/bookings');
    const loaderData = await loader({ request });

    await renderWithRouter(<BookingsPage />, {
      routes: [
        {
          path: '/bookings',
          Component: BookingsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings'],
    });

    await waitFor(() => {
      expect(screen.getByText('Bookings')).toBeInTheDocument();
    });

    expect(screen.getByText(/No bookings found/)).toBeInTheDocument();
  });
});

