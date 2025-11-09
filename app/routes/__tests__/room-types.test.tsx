import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import RoomTypesPage, { loader } from '../room-types';

describe('Room Types Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render room types list', async () => {
    const mockRoomTypes = [
      {
        id: 1,
        name: 'Standard',
        basePricePerNight: 100,
        maxOccupancy: 2,
        description: 'Standard room',
        hasBalcony: true,
        hasView: false,
      },
    ];
    const mockRateTypes = [];

    mockAPI.roomTypeAPI.getAll.mockResolvedValue(mockRoomTypes);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue(mockRateTypes);

    const loaderData = await loader();

    await renderWithRouter(<RoomTypesPage />, {
      routes: [
        {
          path: '/room-types',
          Component: RoomTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/room-types'],
    });

    await waitFor(() => {
      expect(screen.getByText('Room Types')).toBeInTheDocument();
    });

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('₹100.00 / night')).toBeInTheDocument();
  });

  it('should render empty state when no room types', async () => {
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue([]);

    const loaderData = await loader();

    await renderWithRouter(<RoomTypesPage />, {
      routes: [
        {
          path: '/room-types',
          Component: RoomTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/room-types'],
    });

    await waitFor(() => {
      expect(screen.getByText(/No room types found/)).toBeInTheDocument();
    });
  });

  it('should render rate types section', async () => {
    const mockRoomTypes = [];
    const mockRateTypes = [
      {
        id: 1,
        name: 'Standard Rate',
        description: 'Standard pricing',
        roomTypeRates: [],
      },
    ];

    mockAPI.roomTypeAPI.getAll.mockResolvedValue(mockRoomTypes);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue(mockRateTypes);

    const loaderData = await loader();

    await renderWithRouter(<RoomTypesPage />, {
      routes: [
        {
          path: '/room-types',
          Component: RoomTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/room-types'],
    });

    await waitFor(() => {
      expect(screen.getByText('Rate Types')).toBeInTheDocument();
    });

    expect(screen.getByText('Standard Rate')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.roomTypeAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.rateTypeAPI.getAll.mockRejectedValue(new Error('API Error'));

    const loaderData = await loader();

    await renderWithRouter(<RoomTypesPage />, {
      routes: [
        {
          path: '/room-types',
          Component: RoomTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/room-types'],
    });

    await waitFor(() => {
      expect(screen.getByText('Room Types')).toBeInTheDocument();
    });
  });
});

