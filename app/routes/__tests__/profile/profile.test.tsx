import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import ProfilePage, { loader, action } from "../../profile/profile";
import { authAPI } from "../../../services/auth";

// Mock the API
vi.mock("../../../services/auth", () => ({
  authAPI: {
    getCurrentUser: vi.fn(),
    updateCurrentUser: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock requireAuth
vi.mock("../../../utils/auth", async () => {
  const actual = await vi.importActual("../../../utils/auth");
  return {
    ...actual,
    requireAuth: vi.fn(),
    handleAPIError: vi.fn((error, request) => {
      // Don't throw in tests - let the action handle errors and return error objects
      // Only throw for specific test cases that need it
      if (error instanceof Error && error.message === "API Error") {
        throw error;
      }
      // For other errors, don't throw - just let the action return the error
      return;
    }),
  };
});

const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  phone: "+1234567890",
  status: "ACTIVE",
  roles: ["USER", "ADMIN"],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/profile"]) => {
    return createMemoryRouter(
      [
        {
          path: "/profile",
          element: <ProfilePage />,
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
    it("should load user profile successfully", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const request = new Request("http://localhost/profile");
      const result = await loader({ request });

      expect(result.user).toEqual(mockUser);
      expect(authAPI.getCurrentUser).toHaveBeenCalledWith(expect.any(Request));
    });

    it("should handle API errors", async () => {
      vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error("API Error"));

      const request = new Request("http://localhost/profile");
      
      await expect(loader({ request })).rejects.toThrow();
    });
  });

  describe("Rendering", () => {
    it("should render profile page with title", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("My Profile")).toBeInTheDocument();
        expect(screen.getByText("View and manage your account information")).toBeInTheDocument();
      });
    });

    it("should render user information", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("User Information")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument(); // ID
        expect(screen.getByText("testuser")).toBeInTheDocument(); // Username
        expect(screen.getByText("test@example.com")).toBeInTheDocument(); // Email
        expect(screen.getByText("+1234567890")).toBeInTheDocument(); // Phone
        expect(screen.getByText("ACTIVE")).toBeInTheDocument(); // Status
      });
    });

    it("should render user roles", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("USER")).toBeInTheDocument();
        expect(screen.getByText("ADMIN")).toBeInTheDocument();
      });
    });

    it("should render update profile form", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Check for the heading specifically
        expect(screen.getByRole("heading", { name: "Update Profile" })).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Phone")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Update Profile" })).toBeInTheDocument();
      });
    });

    it("should pre-fill form with user data", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
        const phoneInput = screen.getByLabelText("Phone") as HTMLInputElement;

        expect(emailInput.value).toBe("test@example.com");
        expect(phoneInput.value).toBe("+1234567890");
      });
    });

    it("should render change password section", async () => {
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        // Check for the heading specifically
        expect(screen.getByRole("heading", { name: "Change Password" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Change Password" })).toBeInTheDocument();
      });
    });

    it("should show password form when Change Password is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Change Password" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      });
    });
  });

  describe("Action", () => {
    it("should update profile successfully", async () => {
      vi.mocked(authAPI.updateCurrentUser).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("action", "updateProfile");
      formData.append("email", "newemail@example.com");
      formData.append("phone", "+9876543210");

      const request = new Request("http://localhost/profile", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(authAPI.updateCurrentUser).toHaveBeenCalledWith(
        {
          email: "newemail@example.com",
          phone: "+9876543210",
        },
        expect.any(Request)
      );
      expect(result).toEqual({
        success: true,
        message: "Profile updated successfully",
      });
    });

    it("should change password successfully", async () => {
      vi.mocked(authAPI.changePassword).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("action", "changePassword");
      formData.append("currentPassword", "oldpass123");
      formData.append("newPassword", "newpass123");

      const request = new Request("http://localhost/profile", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(authAPI.changePassword).toHaveBeenCalledWith(
        "oldpass123",
        "newpass123",
        expect.any(Request)
      );
      expect(result).toEqual({
        success: true,
        message: "Password changed successfully",
      });
    });

    it("should return error on invalid action", async () => {
      const formData = new FormData();
      formData.append("action", "invalidAction");

      const request = new Request("http://localhost/profile", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        success: false,
        error: "Invalid action",
      });
    });

    it("should return error on API failure", async () => {
      vi.mocked(authAPI.updateCurrentUser).mockRejectedValue(new Error("Update failed"));

      const formData = new FormData();
      formData.append("action", "updateProfile");
      formData.append("email", "newemail@example.com");

      const request = new Request("http://localhost/profile", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        success: false,
        error: "Update failed",
      });
    });
  });
});

