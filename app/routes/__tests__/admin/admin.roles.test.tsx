import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import AdminRolesPage, { loader, action } from "../../admin/admin.roles";
import { userManagementAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  userManagementAPI: {
    getAllRoles: vi.fn(),
    deleteRole: vi.fn(),
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

// Mock requireAdmin and handleAPIError
vi.mock("../../../utils/auth", () => ({
  requireAdmin: vi.fn(),
  handleAPIError: vi.fn(),
}));

const mockRoles = [
  {
    id: 1,
    name: "ADMIN",
    description: "Administrator role",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "USER",
    description: "Regular user role",
    createdAt: "2024-01-02T00:00:00Z",
  },
];

const mockResponse = {
  data: mockRoles,
};

describe("AdminRolesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/admin/roles"]) => {
    return createMemoryRouter(
      [
        {
          path: "/admin/roles",
          element: <AdminRolesPage />,
          loader: loader,
          action: action,
        },
      ],
      {
        initialEntries,
      }
    );
  };

  describe("Loader", () => {
    it("should load roles successfully", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockResolvedValue(mockResponse);

      const request = new Request("http://localhost/admin/roles");
      const result = await loader({ request });

      expect(result.roles).toHaveLength(2);
      expect(userManagementAPI.getAllRoles).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/admin/roles");
      const result = await loader({ request });

      expect(result.roles).toEqual([]);
    });
  });

  describe("Action", () => {
    it("should delete role successfully", async () => {
      vi.mocked(userManagementAPI.deleteRole).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", "1");

      const request = new Request("http://localhost/admin/roles", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(userManagementAPI.deleteRole).toHaveBeenCalledWith(1, expect.any(Request));
      expect(result).toHaveProperty("status", 302);
      expect(result.headers.get("Location")).toBe("/admin/roles");
    });

    it("should return error on delete failure", async () => {
      vi.mocked(userManagementAPI.deleteRole).mockRejectedValue(new Error("Delete failed"));

      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", "1");

      const request = new Request("http://localhost/admin/roles", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        error: "Failed to delete role",
      });
    });
  });

  describe("Rendering", () => {
    it("should render admin roles page with title and description", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockResolvedValue(mockResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
        expect(screen.getByText("Manage system roles")).toBeInTheDocument();
      });
    });

    it("should render 'Create New Role' button", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockResolvedValue(mockResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const createButton = screen.getByText("Create New Role");
        expect(createButton).toBeInTheDocument();
        expect(createButton.closest("a")).toHaveAttribute("href", "/admin/roles/new");
      });
    });

    it("should render roles table", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockResolvedValue(mockResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("ADMIN")).toBeInTheDocument();
        expect(screen.getByText("USER")).toBeInTheDocument();
        expect(screen.getByText("Administrator role")).toBeInTheDocument();
        expect(screen.getByText("Regular user role")).toBeInTheDocument();
      });
    });

    it("should render empty state when no roles", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockResolvedValue({ data: [] });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText(/No roles found. Create your first role!/)).toBeInTheDocument();
      });
    });

    it("should render View and Edit links for each role", async () => {
      vi.mocked(userManagementAPI.getAllRoles).mockResolvedValue(mockResponse);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const viewLinks = screen.getAllByText("View");
        const editLinks = screen.getAllByText("Edit");

        expect(viewLinks).toHaveLength(2);
        expect(editLinks).toHaveLength(2);

        expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/admin/roles/1");
        expect(editLinks[0].closest("a")).toHaveAttribute("href", "/admin/roles/1/edit");
      });
    });
  });
});

