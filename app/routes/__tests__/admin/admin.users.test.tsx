import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import AdminUsersPage, { loader } from "../../admin/admin.users";
import { userManagementAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  userManagementAPI: {
    getAllUsers: vi.fn(),
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

// Mock the StatusBadge component
vi.mock("../../../components/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}));

// Mock requireAdmin and handleAPIError
vi.mock("../../../utils/auth", () => ({
  requireAdmin: vi.fn(),
  handleAPIError: vi.fn(),
}));

const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    status: "ACTIVE",
    roles: ["ADMIN"],
  },
  {
    id: 2,
    username: "user1",
    email: "user1@example.com",
    status: "ACTIVE",
    roles: ["USER"],
  },
];

const mockPaginatedResponse = {
  data: {
    content: mockUsers,
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
  },
};

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/admin/users"]) => {
    return createMemoryRouter(
      [
        {
          path: "/admin/users",
          element: <AdminUsersPage />,
          loader: loader,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load users successfully", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/admin/users");
      const result = await loader({ request });

      expect(result.usersData.content).toHaveLength(2);
      expect(result.usersData.totalElements).toBe(2);
      expect(userManagementAPI.getAllUsers).toHaveBeenCalled();
    });

    it("should handle search parameters", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue(mockPaginatedResponse);

      const request = new Request("http://localhost/admin/users?page=1&size=20&username=admin&status=ACTIVE");
      const result = await loader({ request });

      expect(userManagementAPI.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          size: 20,
          username: "admin",
          status: "ACTIVE",
        }),
        expect.any(Request)
      );
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/admin/users");
      const result = await loader({ request });

      expect(result.usersData.content).toEqual([]);
      expect(result.usersData.totalElements).toBe(0);
    });
  });

  describe("Rendering", () => {
    it("should render admin users page with title and description", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("User Management")).toBeInTheDocument();
        expect(screen.getByText("Manage system users")).toBeInTheDocument();
      });
    });

    it("should render 'Create New User' button", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const createButton = screen.getByText("Create New User");
        expect(createButton).toBeInTheDocument();
        expect(createButton.closest("a")).toHaveAttribute("href", "/admin/users/new");
      });
    });

    it("should render filter form", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-form")).toBeInTheDocument();
        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
      });
    });

    it("should render users table", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue(mockPaginatedResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("admin")).toBeInTheDocument();
        expect(screen.getByText("user1")).toBeInTheDocument();
      });
    });

    it("should render empty state when no users", async () => {
      vi.mocked(userManagementAPI.getAllUsers).mockResolvedValue({
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
        expect(screen.getByText(/No users found/)).toBeInTheDocument();
      });
    });
  });
});

