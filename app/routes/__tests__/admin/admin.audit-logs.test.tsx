import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import AdminAuditLogsPage, { loader } from "../../admin/admin.audit-logs";
import { userManagementAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  userManagementAPI: {
    getAuditLogs: vi.fn(),
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
  FilterField: ({ label, name, type, defaultValue }: any) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input type={type} id={name} name={name} defaultValue={defaultValue} />
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

// Mock requireAdmin and handleAPIError
vi.mock("../../../utils/auth", () => ({
  requireAdmin: vi.fn(),
  handleAPIError: vi.fn(),
}));

const mockAuditLogs = [
  {
    id: 1,
    userId: 1,
    action: "CREATE",
    entityType: "USER",
    entityId: 2,
    timestamp: "2024-01-15T10:00:00Z",
    details: "Created user",
  },
  {
    id: 2,
    userId: 1,
    action: "UPDATE",
    entityType: "ROLE",
    entityId: 1,
    timestamp: "2024-01-16T11:00:00Z",
    details: "Updated role",
  },
];

const mockPaginatedResponse = {
  data: {
    content: mockAuditLogs,
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
  },
};

describe("AdminAuditLogsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/admin/audit-logs"]) => {
    return createMemoryRouter(
      [
        {
          path: "/admin/audit-logs",
          element: <AdminAuditLogsPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load audit logs successfully", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/admin/audit-logs");
      const result = await loader({ request });

      expect(result.auditLogsData.content).toHaveLength(2);
      expect(result.auditLogsData.totalElements).toBe(2);
      expect(userManagementAPI.getAuditLogs).toHaveBeenCalled();
    });

    it("should handle search parameters", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/admin/audit-logs?page=1&size=20&userId=1&action=CREATE&startDate=2024-01-01&endDate=2024-01-31");
      const result = await loader({ request });

      expect(userManagementAPI.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 20,
          userId: 1,
          action: "CREATE",
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-01-31T23:59:59.999Z",
        }),
        expect.any(Request)
      );
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/admin/audit-logs");
      const result = await loader({ request });

      expect(result.auditLogsData.content).toEqual([]);
      expect(result.auditLogsData.totalElements).toBe(0);
    });
  });

  describe("Rendering", () => {
    it("should render audit logs page with title and description", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Audit Logs")).toBeInTheDocument();
        expect(screen.getByText("View system audit logs")).toBeInTheDocument();
      });
    });

    it("should render filter form", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-form")).toBeInTheDocument();
        expect(screen.getByLabelText("User ID")).toBeInTheDocument();
        expect(screen.getByLabelText("Action")).toBeInTheDocument();
        expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
        expect(screen.getByLabelText("End Date")).toBeInTheDocument();
      });
    });

    it("should render audit logs table", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("CREATE")).toBeInTheDocument();
        expect(screen.getByText("UPDATE")).toBeInTheDocument();
      });
    });

    it("should render empty state when no audit logs", async () => {
      vi.mocked(userManagementAPI.getAuditLogs).mockResolvedValue({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
          first: true,
          last: true,
        },
      });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No audit logs found/)).toBeInTheDocument();
      });
    });
  });
});

