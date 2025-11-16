import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import InvoicesPage, { loader } from "../../invoices/invoices";
import { invoiceAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  invoiceAPI: {
    getAll: vi.fn(),
  },
}));

// Mock the FilterForm and FilterField components
vi.mock("../../../components/FilterForm", () => ({
  FilterForm: ({ children, clearUrl }: any) => (
    <form data-testid="filter-form" action={clearUrl}>
      {children}
    </form>
  ),
}));

vi.mock("../../../components/FilterField", () => ({
  FilterField: ({ label, name, type, defaultValue, options }: any) => (
    <div>
      <label htmlFor={name}>{label}</label>
      {type === "select" ? (
        <select id={name} name={name} defaultValue={defaultValue}>
          {options?.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input type={type} id={name} name={name} defaultValue={defaultValue} />
      )}
    </div>
  ),
}));

// Mock the DataTable component
vi.mock("../../../components/DataTable", () => ({
  DataTable: ({ data, columns, emptyMessage }: any) => {
    if (data.length === 0) {
      return <div>{emptyMessage}</div>;
    }
    return (
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, idx: number) => (
            <tr key={item.id || idx}>
              {columns.map((col: any) => (
                <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

// Mock the StatusBadge component
vi.mock("../../../components/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
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

// Mock handleAPIError
vi.mock("../../../utils/auth", () => ({
  handleAPIError: vi.fn(),
}));

const mockInvoices = [
  {
    id: 1,
    invoiceNumber: "INV-001",
    reservationId: 1,
    reservation: { id: 1 },
    status: "PENDING",
    issuedDate: "2024-01-15",
    dueDate: "2024-01-20",
    totalAmount: 5000.00,
  },
  {
    id: 2,
    invoiceNumber: "INV-002",
    reservationId: 2,
    reservation: { id: 2 },
    status: "PAID",
    issuedDate: "2024-01-16",
    dueDate: "2024-01-21",
    totalAmount: 3000.00,
  },
];

const mockPaginatedResponse = {
  content: mockInvoices,
  totalElements: 2,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

describe("InvoicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/invoices"]) => {
    return createMemoryRouter(
      [
        {
          path: "/invoices",
          element: <InvoicesPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load invoices successfully", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/invoices");
      const result = await loader({ request });

      expect(result.invoicesData.content).toHaveLength(2);
      expect(result.invoicesData.totalElements).toBe(2);
      expect(invoiceAPI.getAll).toHaveBeenCalled();
    });

    it("should handle search parameters", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/invoices?page=1&size=20&status=PENDING&sortBy=issuedDate&sortDir=asc");
      const result = await loader({ request });

      expect(invoiceAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 20,
          status: "PENDING",
          sortBy: "issuedDate",
          sortDir: "asc",
        }),
        expect.any(Request)
      );
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(invoiceAPI.getAll).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/invoices");
      const result = await loader({ request });

      expect(result.invoicesData.content).toEqual([]);
      expect(result.invoicesData.totalElements).toBe(0);
    });

    it("should handle array response for backward compatibility", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockInvoices);

      const request = new Request("http://localhost/invoices");
      const result = await loader({ request });

      expect(result.invoicesData.content).toHaveLength(2);
      expect(result.invoicesData.totalElements).toBe(2);
    });
  });

  describe("Rendering", () => {
    it("should render invoices page with title and description", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Invoices")).toBeInTheDocument();
        expect(screen.getByText("Manage hotel invoices")).toBeInTheDocument();
      });
    });

    it("should render filter form with all filter fields", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-form")).toBeInTheDocument();
        expect(screen.getByLabelText("Search")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
        expect(screen.getByLabelText("Issued Date From")).toBeInTheDocument();
        expect(screen.getByLabelText("Issued Date To")).toBeInTheDocument();
        expect(screen.getByLabelText("Due Date From")).toBeInTheDocument();
        expect(screen.getByLabelText("Due Date To")).toBeInTheDocument();
        expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
      });
    });

    it("should render invoices table with correct headers", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const table = screen.getByRole("table");
        const withinTable = within(table);
        
        expect(withinTable.getByText("Invoice #")).toBeInTheDocument();
        expect(withinTable.getByText("Booking")).toBeInTheDocument();
        expect(withinTable.getByText("Issue Date")).toBeInTheDocument();
        expect(withinTable.getByText("Due Date")).toBeInTheDocument();
        expect(withinTable.getByText("Status")).toBeInTheDocument();
        expect(withinTable.getByText("Total Amount")).toBeInTheDocument();
        expect(withinTable.getByText("Actions")).toBeInTheDocument();
      });
    });

    it("should render invoice data in table", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("INV-001")).toBeInTheDocument();
        expect(screen.getByText("PENDING")).toBeInTheDocument();
        expect(screen.getByText("₹5000.00")).toBeInTheDocument();
      });
    });

    it("should render empty state when no invoices", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue({
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
        expect(screen.getByText(/No invoices found/)).toBeInTheDocument();
      });
    });

    it("should render View link for each invoice", async () => {
      vi.mocked(invoiceAPI.getAll).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewLinks = screen.getAllByText("View");
        expect(viewLinks).toHaveLength(2);
        expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/invoices/1");
      });
    });
  });
});

