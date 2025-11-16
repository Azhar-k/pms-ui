import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import GuestsPage, { loader } from "./guests";
import { guestAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  guestAPI: {
    getAll: vi.fn(),
  },
}));

// Mock the Button component
vi.mock("../../components/Button", () => ({
  Button: ({ to, children, ...props }: any) => {
    if (to) {
      return <a href={to}>{children}</a>;
    }
    return <button {...props}>{children}</button>;
  },
}));

// Mock the Pagination component
vi.mock("../../components/Pagination", () => ({
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

const mockGuests = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phoneNumber: "+1234567890",
    city: "New York",
    state: "NY",
    country: "USA",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phoneNumber: "+0987654321",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
  },
  {
    id: 3,
    firstName: "Bob",
    lastName: "Johnson",
    email: null,
    phoneNumber: null,
    city: "Chicago",
    state: "IL",
    country: "USA",
  },
];

const mockPaginatedResponse = {
  content: mockGuests,
  totalElements: 3,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

describe("GuestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/guests"]) => {
    return createMemoryRouter(
      [
        {
          path: "/guests",
          element: <GuestsPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load guests successfully", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/guests");
      const result = await loader({ request });

      expect(result.guestsData.content).toHaveLength(3);
      expect(result.guestsData.totalElements).toBe(3);
      expect(guestAPI.getAll).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        sortDir: "asc",
      });
    });

    it("should handle search parameters", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/guests?page=1&size=20&sortBy=lastName&sortDir=desc&email=test@example.com");
      const result = await loader({ request });

      expect(guestAPI.getAll).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        sortBy: "lastName",
        sortDir: "desc",
        email: "test@example.com",
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        city: undefined,
        state: undefined,
        country: undefined,
        identificationType: undefined,
        searchTerm: undefined,
      });
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(guestAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/guests");
      const result = await loader({ request });

      expect(result.guestsData.content).toEqual([]);
      expect(result.guestsData.totalElements).toBe(0);
    });

    it("should handle array response for backward compatibility", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockGuests);

      const request = new Request("http://localhost/guests");
      const result = await loader({ request });

      expect(result.guestsData.content).toHaveLength(3);
      expect(result.guestsData.totalElements).toBe(3);
      expect(result.guestsData.totalPages).toBe(1);
    });
  });

  describe("Rendering", () => {
    it("should render the guests page with title and description", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Guests")).toBeInTheDocument();
        expect(screen.getByText("Manage hotel guests")).toBeInTheDocument();
      });
    });

    it("should render 'Add New Guest' button", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const addButton = screen.getByText("Add New Guest");
        expect(addButton).toBeInTheDocument();
        expect(addButton.closest("a")).toHaveAttribute("href", "/guests/new");
      });
    });

    it("should render filter form with all filter fields", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Search")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("City")).toBeInTheDocument();
        expect(screen.getByLabelText("Page Size")).toBeInTheDocument();
      });
    });

    it("should render guests table with correct headers", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Contact")).toBeInTheDocument();
        expect(screen.getByText("Location")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
      });
    });

    it("should render guest data in table rows", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
        expect(screen.getByText("+1234567890")).toBeInTheDocument();
        expect(screen.getByText("New York, NY")).toBeInTheDocument();
        expect(screen.getByText("USA")).toBeInTheDocument();
      });
    });

    it("should render 'N/A' for missing email", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const rows = screen.getAllByRole("row");
        const bobRow = rows.find((row) => row.textContent?.includes("Bob Johnson"));
        expect(bobRow).toBeInTheDocument();
        expect(within(bobRow!).getByText("N/A")).toBeInTheDocument();
      });
    });

    it("should render empty state when no guests", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue({
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
        expect(screen.getByText(/No guests found/)).toBeInTheDocument();
        expect(screen.getByText(/Register your first guest!/)).toBeInTheDocument();
      });
    });

    it("should render empty state with filter message when filters are applied", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
      });

      const router = createRouter(["/guests?email=test@example.com"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No guests found/)).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
      });
    });
  });

  describe("Sorting", () => {
    it("should display sort icon for sortable columns", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const nameHeader = screen.getByText("Name").closest("th");
        expect(nameHeader).toBeInTheDocument();
        expect(nameHeader?.textContent).toContain("⇅");
      });
    });

    it("should change sort direction when clicking same column", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/guests?sortBy=lastName&sortDir=asc"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const nameHeader = screen.getByText("Name").closest("th");
        expect(nameHeader).toBeInTheDocument();
      });

      const nameHeader = screen.getByText("Name").closest("th")!;
      await user.click(nameHeader);

      await waitFor(() => {
        expect(router.state.location.search).toContain("sortDir=desc");
      });
    });

    it("should set new sort column when clicking different column", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/guests?sortBy=lastName"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const contactHeader = screen.getByText("Contact").closest("th");
        expect(contactHeader).toBeInTheDocument();
      });

      const contactHeader = screen.getByText("Contact").closest("th")!;
      await user.click(contactHeader);

      await waitFor(() => {
        expect(router.state.location.search).toContain("sortBy=email");
        expect(router.state.location.search).toContain("sortDir=asc");
      });
    });

    it("should reset to page 0 when sorting", async () => {
      const user = userEvent.setup();
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/guests?page=2&sortBy=lastName"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const nameHeader = screen.getByText("Name").closest("th");
        expect(nameHeader).toBeInTheDocument();
      });

      const nameHeader = screen.getByText("Name").closest("th")!;
      await user.click(nameHeader);

      await waitFor(() => {
        expect(router.state.location.search).toContain("page=0");
      });
    });
  });

  describe("Filtering", () => {
    it("should pre-fill filter inputs with search params", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter(["/guests?searchTerm=test&email=test@example.com&city=New York"]);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const searchInput = screen.getByLabelText("Search") as HTMLInputElement;
        const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
        const cityInput = screen.getByLabelText("City") as HTMLInputElement;

        expect(searchInput.value).toBe("test");
        expect(emailInput.value).toBe("test@example.com");
        expect(cityInput.value).toBe("New York");
      });
    });

    it("should have default page size of 10", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const pageSizeSelect = screen.getByLabelText("Page Size") as HTMLSelectElement;
        expect(pageSizeSelect.value).toBe("10");
      });
    });
  });

  describe("Pagination", () => {
    it("should render pagination when totalPages > 1", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue({
        content: mockGuests,
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
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
      });
    });
  });

  describe("Actions", () => {
    it("should render View and Edit links for each guest", async () => {
      vi.mocked(guestAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewLinks = screen.getAllByText("View");
        const editLinks = screen.getAllByText("Edit");

        expect(viewLinks).toHaveLength(3);
        expect(editLinks).toHaveLength(3);

        expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/guests/1");
        expect(editLinks[0].closest("a")).toHaveAttribute("href", "/guests/1/edit");
      });
    });
  });
});

