import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import BookingsPage, { loader } from "../../bookings/bookings";
import { reservationAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  reservationAPI: {
    getAll: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../../components/Button", () => ({
  Button: ({ to, children, ...props }: any) => {
    if (to) {
      return <a href={to}>{children}</a>;
    }
    return <button {...props}>{children}</button>;
  },
}));

// Mock the Pagination component
vi.mock("../../../components/Pagination", () => ({
  Pagination: ({ currentPage, totalPages, totalElements, pageSize }: any) => {
    if (totalPages <= 1) return null;
    return (
      <div data-testid="pagination">
        <span>Page {currentPage + 1} of {totalPages}</span>
        <span>Total: {totalElements}</span>
      </div>
    );
  },
}));

// Mock the DateInput component
vi.mock("../../../components/DateInput", () => ({
  DateInput: ({ label, id, name, defaultValue, ...props }: any) => (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <input type="date" id={id} name={name} defaultValue={defaultValue} {...props} />
    </div>
  ),
}));

// Mock the dateFormat utility
vi.mock("../../../utils/dateFormat", () => ({
  formatDisplayDate: (date: string | Date) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },
}));

// Mock handleAPIError to allow testing error handling
vi.mock("../../../utils/auth", async () => {
  const actual = await vi.importActual("../../../utils/auth");
  return {
    ...actual,
    handleAPIError: vi.fn((error, request) => {
      // In tests, we want to allow the loader to return empty data
      // So we don't throw here for the error handling test
      if (error instanceof Error && error.message === "API Error") {
        return; // Don't throw for this specific test
      }
      // For other cases, use the actual implementation
      return (actual as any).handleAPIError(error, request);
    }),
  };
});

const mockReservations = [
  {
    id: 1,
    reservationNumber: "RES-001",
    guest: { id: 1, firstName: "John", lastName: "Doe" },
    guestId: 1,
    room: { id: 1, roomNumber: "101" },
    roomId: 1,
    checkInDate: "2024-01-15",
    checkOutDate: "2024-01-20",
    status: "CONFIRMED",
    totalAmount: 5000.00,
  },
  {
    id: 2,
    reservationNumber: "RES-002",
    guest: { id: 2, firstName: "Jane", lastName: "Smith" },
    guestId: 2,
    room: { id: 2, roomNumber: "202" },
    roomId: 2,
    checkInDate: "2024-01-16",
    checkOutDate: "2024-01-18",
    status: "CHECKED_IN",
    totalAmount: 3000.00,
  },
  {
    id: 3,
    reservationNumber: null,
    guest: null,
    guestId: 3,
    room: null,
    roomId: 3,
    checkInDate: "2024-01-20",
    checkOutDate: "2024-01-22",
    status: "PENDING",
    totalAmount: 2000.00,
  },
];

const mockPaginatedResponse = {
  content: mockReservations,
  totalElements: 3,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

describe("BookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/bookings"]) => {
    return createMemoryRouter(
      [
        {
          path: "/bookings",
          element: <BookingsPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load bookings successfully", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/bookings");
      const result = await loader({ request });

      expect(result.reservationsData.content).toHaveLength(3);
      expect(result.reservationsData.totalElements).toBe(3);
      expect(reservationAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 0,
          size: 10,
          sortDir: "desc",
        }),
        expect.any(Request)
      );
    });

    it("should handle search parameters", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/bookings?page=1&size=20&sortBy=checkInDate&sortDir=asc&status=CONFIRMED&guestId=1");
      const result = await loader({ request });

      expect(reservationAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 20,
          sortBy: "checkInDate",
          sortDir: "asc",
          status: "CONFIRMED",
          guestId: 1,
        }),
        expect.any(Request)
      );
    });

    it("should handle API errors gracefully", async () => {
      // Mock handleAPIError to not throw - the loader catches and returns empty data
      vi.mocked(reservationAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/bookings");
      const result = await loader({ request });

      expect(result.reservationsData.content).toEqual([]);
      expect(result.reservationsData.totalElements).toBe(0);
    });

    it("should handle array response for backward compatibility", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockReservations);

      const request = new Request("http://localhost/bookings");
      const result = await loader({ request });

      expect(result.reservationsData.content).toHaveLength(3);
      expect(result.reservationsData.totalElements).toBe(3);
      expect(result.reservationsData.totalPages).toBe(1);
    });
  });

  describe("Rendering", () => {
    it("should render the bookings page with title and description", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Bookings")).toBeInTheDocument();
        expect(screen.getByText("Manage hotel bookings")).toBeInTheDocument();
      });
    });

    it("should render 'Create New Booking' button", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const createButton = screen.getByText("Create New Booking");
        expect(createButton).toBeInTheDocument();
        expect(createButton.closest("a")).toHaveAttribute("href", "/bookings/new");
      });
    });

    it("should render filter form with all filter fields", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Search")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
        expect(screen.getByLabelText("Check-in From")).toBeInTheDocument();
        expect(screen.getByLabelText("Check-in To")).toBeInTheDocument();
        expect(screen.getByLabelText("Check-out From")).toBeInTheDocument();
        expect(screen.getByLabelText("Check-out To")).toBeInTheDocument();
        expect(screen.getByLabelText("Payment Status")).toBeInTheDocument();
        expect(screen.getByLabelText("Page Size")).toBeInTheDocument();
      });
    });

    it("should render bookings table with correct headers", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Booking #")).toBeInTheDocument();
        expect(screen.getByText("Guest")).toBeInTheDocument();
        expect(screen.getByText("Room")).toBeInTheDocument();
        // Dates, Status, and Total Amount are in sortable headers with icons, so use a flexible matcher
        // Look for them within table headers (th elements)
        const datesHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Dates');
        });
        expect(datesHeader).toBeInTheDocument();
        
        const statusHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Status') && !content.includes('Payment Status') && !content.includes('All Statuses');
        });
        expect(statusHeader).toBeInTheDocument();
        
        const totalAmountHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Total Amount');
        });
        expect(totalAmountHeader).toBeInTheDocument();
        
        expect(screen.getByText("Actions")).toBeInTheDocument();
      });
    });

    it("should render booking data in table rows", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("RES-001")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Room 101")).toBeInTheDocument();
        expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
        expect(screen.getByText("₹5000.00")).toBeInTheDocument();
      });
    });

    it("should render booking number fallback when reservationNumber is null", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("#3")).toBeInTheDocument();
      });
    });

    it("should render guest fallback when guest is null", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Guest #3")).toBeInTheDocument();
      });
    });

    it("should render room fallback when room is null", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Room #3")).toBeInTheDocument();
      });
    });

    it("should render empty state when no bookings", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
      });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No bookings found/)).toBeInTheDocument();
        expect(screen.getByText(/Create your first booking!/)).toBeInTheDocument();
      });
    });

    it("should render empty state with filter message when filters are applied", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
      });

      const router = createRouter(["/bookings?status=CONFIRMED"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No bookings found/)).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
      });
    });
  });

  describe("Sorting", () => {
    it("should display sort icon for sortable columns", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Find the Dates header using a flexible matcher since it's in a div with the sort icon
        const datesHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Dates');
        }).closest("th");
        expect(datesHeader).toBeInTheDocument();
        expect(datesHeader?.textContent).toContain("⇅");
      });
    });

    it("should change sort direction when clicking same column", async () => {
      const user = userEvent.setup();
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/bookings?sortBy=checkInDate&sortDir=desc"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Find the Dates header using a flexible matcher
        const datesHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Dates');
        }).closest("th");
        expect(datesHeader).toBeInTheDocument();
      });

      const datesHeader = screen.getByText((content, element) => {
        return element?.closest('th') !== null && content.includes('Dates');
      }).closest("th")!;
      await user.click(datesHeader);

      await waitFor(() => {
        expect(router.state.location.search).toContain("sortDir=asc");
      });
    });

    it("should set new sort column when clicking different column", async () => {
      const user = userEvent.setup();
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/bookings?sortBy=checkInDate"]);
      render(<RouterProvider router={router} />);

      // Wait for the table to render
      await waitFor(() => {
        expect(screen.getByText("Booking #")).toBeInTheDocument();
        // Find Status header using flexible matcher to avoid matching filter field
        const statusHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Status') && !content.includes('Payment Status') && !content.includes('All Statuses');
        });
        expect(statusHeader).toBeInTheDocument();
      });

      const statusHeader = screen.getByText((content, element) => {
        return element?.closest('th') !== null && content.includes('Status') && !content.includes('Payment Status') && !content.includes('All Statuses');
      }).closest("th");
      expect(statusHeader).toBeInTheDocument();
      
      if (statusHeader) {
        await user.click(statusHeader);

        await waitFor(() => {
          expect(router.state.location.search).toContain("sortBy=status");
          expect(router.state.location.search).toContain("sortDir=desc");
        });
      }
    });

    it("should reset to page 0 when sorting", async () => {
      const user = userEvent.setup();
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/bookings?page=2&sortBy=checkInDate"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Find the Dates header using a flexible matcher
        const datesHeader = screen.getByText((content, element) => {
          return element?.closest('th') !== null && content.includes('Dates');
        }).closest("th");
        expect(datesHeader).toBeInTheDocument();
      });

      const datesHeader = screen.getByText((content, element) => {
        return element?.closest('th') !== null && content.includes('Dates');
      }).closest("th")!;
      await user.click(datesHeader);

      await waitFor(() => {
        expect(router.state.location.search).toContain("page=0");
      });
    });
  });

  describe("Filtering", () => {
    it("should pre-fill filter inputs with search params", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/bookings?searchTerm=test&status=CONFIRMED&paymentStatus=PAID"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const searchInput = screen.getByLabelText("Search") as HTMLInputElement;
        const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
        const paymentStatusInput = screen.getByLabelText("Payment Status") as HTMLInputElement;

        expect(searchInput.value).toBe("test");
        expect(statusSelect.value).toBe("CONFIRMED");
        expect(paymentStatusInput.value).toBe("PAID");
      });
    });

    it("should have default page size of 10", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const pageSizeSelect = screen.getByLabelText("Page Size") as HTMLSelectElement;
        expect(pageSizeSelect.value).toBe("10");
      });
    });

    it("should render status dropdown with all options", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
        expect(statusSelect).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "All Statuses" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Confirmed" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Checked In" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Checked Out" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Cancelled" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "No Show" })).toBeInTheDocument();
      });
    });
  });

  describe("Status Colors", () => {
    it("should apply correct status color classes", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const confirmedStatus = screen.getByText("CONFIRMED");
        expect(confirmedStatus).toHaveClass("bg-blue-100", "text-blue-800");
      });
    });
  });

  describe("Pagination", () => {
    it("should render pagination when totalPages > 1", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue({
        content: mockReservations,
        totalElements: 25,
        totalPages: 3,
        size: 10,
        number: 0,
        first: true,
        last: false,
      });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByTestId("pagination")).toBeInTheDocument();
      });
    });

    it("should not render pagination when totalPages <= 1", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
      });
    });
  });

  describe("Actions", () => {
    it("should render View link for each booking", async () => {
      vi.mocked(reservationAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewLinks = screen.getAllByText("View");
        expect(viewLinks).toHaveLength(3);
        expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/bookings/1");
      });
    });
  });
});

