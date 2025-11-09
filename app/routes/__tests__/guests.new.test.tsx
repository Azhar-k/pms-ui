import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import NewGuestPage, { action } from '../guests.new';

describe('New Guest Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render new guest form', async () => {
    await renderWithRouter(<NewGuestPage />, {
      routes: [
        {
          path: '/guests/new',
          Component: NewGuestPage,
        },
      ],
      initialEntries: ['/guests/new'],
    });

    await waitFor(() => {
      expect(screen.getByText('Register New Guest')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    mockAPI.guestAPI.create.mockResolvedValue({ id: 1 });

    const formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');
    formData.append('email', 'john@example.com');
    formData.append('phoneNumber', '123-456-7890');

    const request = new Request('http://localhost/guests/new', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: {} } as any);

    expect(mockAPI.guestAPI.create).toHaveBeenCalled();
    expect(result).toHaveProperty('status', 302);
  });

  it('should handle API errors on submission', async () => {
    mockAPI.guestAPI.create.mockRejectedValue(new Error('Failed to create'));

    const formData = new FormData();
    formData.append('firstName', 'John');
    formData.append('lastName', 'Doe');

    const request = new Request('http://localhost/guests/new', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request, params: {} } as any);

    expect(result).toHaveProperty('error');
  });
});

