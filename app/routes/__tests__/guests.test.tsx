import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import GuestsPage, { loader } from '../guests';

describe('Guests Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render guests list', async () => {
    const mockGuests = {
      content: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '123-456-7890',
          city: 'New York',
          state: 'NY',
          country: 'USA',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);

    const request = new Request('http://localhost/guests');
    const loaderData = await loader({ request });

    await renderWithRouter(<GuestsPage />, {
      routes: [
        {
          path: '/guests',
          Component: GuestsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests'],
    });

    await waitFor(() => {
      expect(screen.getByText('Guests')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render empty state when no guests', async () => {
    const mockGuests = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);

    const request = new Request('http://localhost/guests');
    const loaderData = await loader({ request });

    await renderWithRouter(<GuestsPage />, {
      routes: [
        {
          path: '/guests',
          Component: GuestsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests'],
    });

    await waitFor(() => {
      expect(screen.getByText(/No guests found/)).toBeInTheDocument();
    });
  });

  it('should render filter form', async () => {
    const mockGuests = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);

    const request = new Request('http://localhost/guests');
    const loaderData = await loader({ request });

    await renderWithRouter(<GuestsPage />, {
      routes: [
        {
          path: '/guests',
          Component: GuestsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests'],
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Search/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    });
  });

  it('should render add new guest button', async () => {
    const mockGuests = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.guestAPI.getAll.mockResolvedValue(mockGuests);

    const request = new Request('http://localhost/guests');
    const loaderData = await loader({ request });

    await renderWithRouter(<GuestsPage />, {
      routes: [
        {
          path: '/guests',
          Component: GuestsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests'],
    });

    await waitFor(() => {
      expect(screen.getByText('Add New Guest')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.guestAPI.getAll.mockRejectedValue(new Error('API Error'));

    const request = new Request('http://localhost/guests');
    const loaderData = await loader({ request });

    await renderWithRouter(<GuestsPage />, {
      routes: [
        {
          path: '/guests',
          Component: GuestsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/guests'],
    });

    await waitFor(() => {
      expect(screen.getByText('Guests')).toBeInTheDocument();
    });

    expect(screen.getByText(/No guests found/)).toBeInTheDocument();
  });
});

