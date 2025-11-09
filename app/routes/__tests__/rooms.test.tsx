import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import RoomsPage, { loader } from '../rooms';

describe('Rooms Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render rooms list', async () => {
    const mockRooms = {
      content: [
        {
          id: 1,
          roomNumber: '101',
          roomType: { name: 'Standard' },
          status: 'READY',
          maxOccupancy: 2,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.roomAPI.getAll.mockResolvedValue(mockRooms);
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);

    const request = new Request('http://localhost/rooms');
    const loaderData = await loader({ request });

    await renderWithRouter(<RoomsPage />, {
      routes: [
        {
          path: '/rooms',
          Component: RoomsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rooms'],
    });

    await waitFor(() => {
      expect(screen.getByText('Rooms')).toBeInTheDocument();
    });

    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
  });

  it('should render empty state when no rooms', async () => {
    const mockRooms = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.roomAPI.getAll.mockResolvedValue(mockRooms);
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);

    const request = new Request('http://localhost/rooms');
    const loaderData = await loader({ request });

    await renderWithRouter(<RoomsPage />, {
      routes: [
        {
          path: '/rooms',
          Component: RoomsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rooms'],
    });

    await waitFor(() => {
      expect(screen.getByText(/No rooms found/)).toBeInTheDocument();
    });
  });

  it('should render filter form', async () => {
    const mockRooms = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.roomAPI.getAll.mockResolvedValue(mockRooms);
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);

    const request = new Request('http://localhost/rooms');
    const loaderData = await loader({ request });

    await renderWithRouter(<RoomsPage />, {
      routes: [
        {
          path: '/rooms',
          Component: RoomsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rooms'],
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Search/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room Type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    });
  });

  it('should render add new room button', async () => {
    const mockRooms = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.roomAPI.getAll.mockResolvedValue(mockRooms);
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);

    const request = new Request('http://localhost/rooms');
    const loaderData = await loader({ request });

    await renderWithRouter(<RoomsPage />, {
      routes: [
        {
          path: '/rooms',
          Component: RoomsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rooms'],
    });

    await waitFor(() => {
      expect(screen.getByText('Add New Room')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.roomAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);

    const request = new Request('http://localhost/rooms');
    const loaderData = await loader({ request });

    await renderWithRouter(<RoomsPage />, {
      routes: [
        {
          path: '/rooms',
          Component: RoomsPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rooms'],
    });

    await waitFor(() => {
      expect(screen.getByText('Rooms')).toBeInTheDocument();
    });

    expect(screen.getByText(/No rooms found/)).toBeInTheDocument();
  });
});

