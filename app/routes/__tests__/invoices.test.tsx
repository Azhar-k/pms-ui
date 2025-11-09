import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import InvoicesPage, { loader } from '../invoices';

describe('Invoices Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render invoices list', async () => {
    const mockInvoices = {
      content: [
        {
          id: 1,
          invoiceNumber: 'INV-001',
          reservation: { id: 1 },
          reservationId: 1,
          issuedDate: '2024-01-01',
          dueDate: '2024-01-15',
          status: 'PENDING',
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

    mockAPI.invoiceAPI.getAll.mockResolvedValue(mockInvoices);

    const request = new Request('http://localhost/invoices');
    const loaderData = await loader({ request });

    await renderWithRouter(<InvoicesPage />, {
      routes: [
        {
          path: '/invoices',
          Component: InvoicesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/invoices'],
    });

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should render empty state when no invoices', async () => {
    const mockInvoices = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.invoiceAPI.getAll.mockResolvedValue(mockInvoices);

    const request = new Request('http://localhost/invoices');
    const loaderData = await loader({ request });

    await renderWithRouter(<InvoicesPage />, {
      routes: [
        {
          path: '/invoices',
          Component: InvoicesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/invoices'],
    });

    await waitFor(() => {
      expect(screen.getByText(/No invoices found/)).toBeInTheDocument();
    });
  });

  it('should render filter form', async () => {
    const mockInvoices = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    mockAPI.invoiceAPI.getAll.mockResolvedValue(mockInvoices);

    const request = new Request('http://localhost/invoices');
    const loaderData = await loader({ request });

    await renderWithRouter(<InvoicesPage />, {
      routes: [
        {
          path: '/invoices',
          Component: InvoicesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/invoices'],
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Search/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAPI.invoiceAPI.getAll.mockRejectedValue(new Error('API Error'));

    const request = new Request('http://localhost/invoices');
    const loaderData = await loader({ request });

    await renderWithRouter(<InvoicesPage />, {
      routes: [
        {
          path: '/invoices',
          Component: InvoicesPage,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/invoices'],
    });

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    expect(screen.getByText(/No invoices found/)).toBeInTheDocument();
  });
});

