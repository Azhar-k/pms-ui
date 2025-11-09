# Testing Guide

This project uses Vitest and React Testing Library for unit testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located in `app/routes/__tests__/` directory, mirroring the route structure.

## Test Utilities

The `tests/test-utils.tsx` file provides:
- `renderWithRouter`: Helper to render components with React Router
- `mockAPI`: Mocked API functions for testing
- All exports from `@testing-library/react`

## Writing Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockAPI } from '../../../tests/test-utils';
import MyComponent, { loader } from '../my-component';

describe('My Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', async () => {
    mockAPI.someAPI.getAll.mockResolvedValue({ content: [] });
    
    const loaderData = await loader({ request: new Request('http://localhost') });
    
    await renderWithRouter(<MyComponent />, {
      routes: [
        {
          path: '/my-route',
          Component: MyComponent,
          loader: () => Promise.resolve(loaderData),
        },
      ],
      initialEntries: ['/my-route'],
    });

    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

## Mocking API Calls

All API calls are automatically mocked through `mockAPI`. Set up mock responses in your tests:

```typescript
mockAPI.guestAPI.getAll.mockResolvedValue({
  content: [{ id: 1, name: 'John Doe' }],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
});
```

