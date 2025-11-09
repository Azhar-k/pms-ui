import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import RateTypesPage, { loader } from '../rate-types';

describe('Rate Types Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render rate types list', async () => {
    const mockRoomTypes = [];
    const mockRateTypes = [
      {
        id: 1,
        name: 'Standard Rate',
        description: 'Standard pricing',
        roomTypeRates: [
          { id: 1, roomTypeId: 1, roomTypeName: 'Standard', rate: 100 },
        ],
      },
    ];

    mockAPI.roomTypeAPI.getAll.mockResolvedValue(mockRoomTypes);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue(mockRateTypes);

    const loaderData = await loader();

    await renderWithRouter(<RateTypesPage />, {
      routes: [
        {
          path: '/rate-types',
          Component: RateTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rate-types'],
    });

    await waitFor(() => {
      expect(screen.getByText('Rate Types')).toBeInTheDocument();
    });

    expect(screen.getByText('Standard Rate')).toBeInTheDocument();
  });

  it('should render empty state when no rate types', async () => {
    mockAPI.roomTypeAPI.getAll.mockResolvedValue([]);
    mockAPI.rateTypeAPI.getAll.mockResolvedValue([]);

    const loaderData = await loader();

    await renderWithRouter(<RateTypesPage />, {
      routes: [
        {
          path: '/rate-types',
          Component: RateTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rate-types'],
    });

    await waitFor(() => {
      expect(screen.getByText(/No rate types found/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.roomTypeAPI.getAll.mockRejectedValue(new Error('API Error'));
    mockAPI.rateTypeAPI.getAll.mockRejectedValue(new Error('API Error'));

    const loaderData = await loader();

    await renderWithRouter(<RateTypesPage />, {
      routes: [
        {
          path: '/rate-types',
          Component: RateTypesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/rate-types'],
    });

    await waitFor(() => {
      expect(screen.getByText('Rate Types')).toBeInTheDocument();
    });
  });
});

