import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import BookingDetailPage, { loader, action } from '../bookings.$id';

describe('Booking Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render booking details', async () => {
    const mockReservation = {
      id: 1,
      reservationNumber: 'RES-001',
      guest: { id: 1, firstName: 'John', lastName: 'Doe' },
      room: { id: 1, roomNumber: '101' },
      checkInDate: '2024-01-01',
      checkOutDate: '2024-01-05',
      status: 'CONFIRMED',
      numberOfGuests: 2,
      totalAmount: 500,
    };

    mockAPI.reservationAPI.getById.mockResolvedValue(mockReservation);

    const loaderData = await loader({ params: { id: '1' } } as any);

    await renderWithRouter(<BookingDetailPage />, {
      routes: [
        {
          path: '/bookings/:id',
          Component: BookingDetailPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings/1'],
    });

    await waitFor(() => {
      expect(screen.getByText(/Booking RES-001/)).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('should render action buttons based on status', async () => {
    const mockReservation = {
      id: 1,
      reservationNumber: 'RES-001',
      guest: { id: 1, firstName: 'John', lastName: 'Doe' },
      room: { id: 1, roomNumber: '101' },
      checkInDate: '2024-01-01',
      checkOutDate: '2024-01-05',
      status: 'CONFIRMED',
      numberOfGuests: 2,
      totalAmount: 500,
    };

    mockAPI.reservationAPI.getById.mockResolvedValue(mockReservation);

    const loaderData = await loader({ params: { id: '1' } } as any);

    await renderWithRouter(<BookingDetailPage />, {
      routes: [
        {
          path: '/bookings/:id',
          Component: BookingDetailPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/bookings/1'],
    });

    await waitFor(() => {
      expect(screen.getByText('Check In')).toBeInTheDocument();
      expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    });
  });

  it('should handle check-in action', async () => {
    mockAPI.reservationAPI.checkIn.mockResolvedValue({});

    const formData = new FormData();
    formData.append('action', 'checkIn');

    const request = new Request('http://localhost/bookings/1', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: { id: '1' } } as any);

    expect(mockAPI.reservationAPI.checkIn).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('status', 302);
  });

  it('should handle check-out action', async () => {
    mockAPI.reservationAPI.checkOut.mockResolvedValue({});

    const formData = new FormData();
    formData.append('action', 'checkOut');

    const request = new Request('http://localhost/bookings/1', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: { id: '1' } } as any);

    expect(mockAPI.reservationAPI.checkOut).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('status', 302);
  });

  it('should handle cancel action', async () => {
    mockAPI.reservationAPI.cancel.mockResolvedValue({});

    const formData = new FormData();
    formData.append('action', 'cancel');

    const request = new Request('http://localhost/bookings/1', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: { id: '1' } } as any);

    expect(mockAPI.reservationAPI.cancel).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('status', 302);
  });

  it('should handle generate invoice action', async () => {
    const mockInvoice = { id: 1 };
    mockAPI.invoiceAPI.generate.mockResolvedValue(mockInvoice);

    const formData = new FormData();
    formData.append('action', 'generateInvoice');

    const request = new Request('http://localhost/bookings/1', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: { id: '1' } } as any);

    expect(mockAPI.invoiceAPI.generate).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('status', 302);
  });

  it('should throw 404 when booking not found', async () => {
    mockAPI.reservationAPI.getById.mockRejectedValue(new Error('Not found'));

    await expect(loader({ params: { id: '999' } } as any)).rejects.toThrow();
  });
});

