import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import NewBookingPage, { loader, action } from '../bookings.new';

describe('New Booking Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render new booking form', async () => {
    const mockGuests = [{ id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' }];
    const mockRateTypes = [{ id: 1, name: 'Standard' }];

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue(mockRateTypes);
    mockAPI.roomAPI.getAvailable.mockResolvedValue([]);

    const loaderData = await loader();

    await renderWithRouter(<NewBookingPage />, {
      routes: [
        {
          path: '/bookings/new',
          Component: NewBookingPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings/new'],
    });

    await waitFor(() => {
      expect(screen.getByText('Create New Booking')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Guest/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Check-in Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Check-out Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Room/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rate Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Guests/)).toBeInTheDocument();
  });

  it('should load guests and rate types', async () => {
    const mockGuests = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    ];
    const mockRateTypes = [
      { id: 1, name: 'Standard' },
      { id: 2, name: 'Premium' },
    ];

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue(mockRateTypes);
    mockAPI.roomAPI.getAvailable.mockResolvedValue([]);

    const loaderData = await loader();

    await renderWithRouter(<NewBookingPage />, {
      routes: [
        {
          path: '/bookings/new',
          Component: NewBookingPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings/new'],
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const mockGuests = [{ id: 1, firstName: 'John', lastName: 'Doe' }];
    const mockRateTypes = [{ id: 1, name: 'Standard' }];

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue(mockRateTypes);
    mockAPI.roomAPI.getAvailable.mockResolvedValue([]);
    mockAPI.reservationAPI.create.mockResolvedValue({ id: 1 });

    const formData = new FormData();
    formData.append('guestId', '1');
    formData.append('roomId', '1');
    formData.append('rateTypeId', '1');
    formData.append('checkInDate', '2024-01-01');
    formData.append('checkOutDate', '2024-01-05');
    formData.append('numberOfGuests', '2');

    const request = new Request('http://localhost/bookings/new', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: {} } as any);

    expect(mockAPI.reservationAPI.create).toHaveBeenCalled();
    expect(result).toHaveProperty('status', 302);
  });

  it('should handle API errors on submission', async () => {
    mockAPI.reservationAPI.create.mockRejectedValue(new Error('Failed to create'));

    const formData = new FormData();
    formData.append('guestId', '1');
    formData.append('roomId', '1');
    formData.append('rateTypeId', '1');
    formData.append('checkInDate', '2024-01-01');
    formData.append('checkOutDate', '2024-01-05');
    formData.append('numberOfGuests', '2');

    const request = new Request('http://localhost/bookings/new', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: {} } as any);

    expect(result).toHaveProperty('error');
  });

  it('should handle loader errors gracefully', async () => {
    mockAPI.guestAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.rateTypeAPI.getAll.mockRejectedValue(new Error('API Error'));

    const loaderData = await loader();

    await renderWithRouter(<NewBookingPage />, {
      routes: [
        {
          path: '/bookings/new',
          Component: NewBookingPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings/new'],
    });

    await waitFor(() => {
      expect(screen.getByText('Create New Booking')).toBeInTheDocument();
    });
  });
});

