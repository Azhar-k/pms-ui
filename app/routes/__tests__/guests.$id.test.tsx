import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import GuestDetailPage, { loader } from '../guests.$id';

describe('Guest Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render guest details', async () => {
    const mockGuest = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '123-456-7890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
    };

    mockAPI.guestAPI.getById.mockResolvedValue(mockGuest);

    const loaderData = await loader({ params: { id: '1' } } as any);

    await renderWithRouter(<GuestDetailPage />, {
      routes: [
        {
          path: '/guests/:id',
          Component: GuestDetailPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests/1'],
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('should render quick action links', async () => {
    const mockGuest = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
    };

    mockAPI.guestAPI.getById.mockResolvedValue(mockGuest);

    const loaderData = await loader({ params: { id: '1' } } as any);

    await renderWithRouter(<GuestDetailPage />, {
      routes: [
        {
          path: '/guests/:id',
          Component: GuestDetailPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests/1'],
    });

    await waitFor(() => {
      expect(screen.getByText('Create Booking')).toBeInTheDocument();
      expect(screen.getByText('View Bookings')).toBeInTheDocument();
    });
  });

  it('should throw 404 when guest not found', async () => {
    mockAPI.guestAPI.getById.mockRejectedValue(new Error('Not found'));

    await expect(loader({ params: { id: '999' } } as any)).rejects.toThrow();
  });
});

