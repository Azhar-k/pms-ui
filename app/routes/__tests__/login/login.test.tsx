import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import LoginPage, { loader, action } from "../../login/login";
import { authAPI, tokenStorage } from "../../../services/auth";

// Mock the API
vi.mock("../../../services/auth", () => ({
  authAPI: {
    login: vi.fn(),
  },
  tokenStorage: {
    clear: vi.fn(),
  },
}));

// Mock requireGuest to allow testing
vi.mock("../../../utils/auth", () => ({
  requireGuest: vi.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRouter = (initialEntries = ["/login"]) => {
    return createMemoryRouter(
      [
        {
          path: "/login",
          element: <LoginPage />,
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
    it("should return null", async () => {
      const result = await loader({} as any);
      expect(result).toBeNull();
    });
  });

  describe("Rendering", () => {
    it("should render login page with title", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Hotel PMS")).toBeInTheDocument();
        expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
      });
    });

    it("should render login form with all fields", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
      });
    });

    it("should render error message when actionData has error", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
      });

      // Submit form with missing credentials to trigger error
      const form = screen.getByRole("button", { name: /Sign in/i }).closest("form");
      expect(form).toBeInTheDocument();

      fireEvent.submit(form!);

      await waitFor(() => {
        // Error message should be displayed when credentials are missing
        expect(screen.getByText("Username/Email and password are required")).toBeInTheDocument();
      });
    });

    it("should disable form fields when submitting", async () => {
      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/Username or Email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

        expect(usernameInput.disabled).toBe(false);
        expect(passwordInput.disabled).toBe(false);
      });
    });

    it("should show 'Signing in...' text when submitting", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.login).mockImplementation(() => new Promise(() => {})); // Never resolves

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Username or Email/i), "test@example.com");
      await user.type(screen.getByLabelText(/Password/i), "password123");

      const submitButton = screen.getByRole("button", { name: /Sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Signing in...")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with username and password", async () => {
      const user = userEvent.setup();
      vi.mocked(authAPI.login).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const router = createRouter();
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Username or Email/i), "test@example.com");
      await user.type(screen.getByLabelText(/Password/i), "password123");

      const form = screen.getByRole("button", { name: /Sign in/i }).closest("form");
      expect(form).toBeInTheDocument();

      fireEvent.submit(form!);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should redirect to default path on successful login", async () => {
      vi.mocked(authAPI.login).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const formData = new FormData();
      formData.append("usernameOrEmail", "test@example.com");
      formData.append("password", "password123");

      const request = new Request("http://localhost/login", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toHaveProperty("status", 302);
      const location = result.headers.get("Location");
      expect(location).toContain("/front-desk");
      // Extract pathname from URL if it's a full URL
      const locationPath = location?.startsWith("http") 
        ? new URL(location).pathname 
        : location;
      expect(locationPath).toBe("/front-desk");
    });

    it("should redirect to custom redirect path when provided", async () => {
      vi.mocked(authAPI.login).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const formData = new FormData();
      formData.append("usernameOrEmail", "test@example.com");
      formData.append("password", "password123");

      const request = new Request("http://localhost/login?redirect=/dashboard", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toHaveProperty("status", 302);
      const location = result.headers.get("Location");
      expect(location).toContain("/dashboard");
      // Extract pathname from URL if it's a full URL
      const locationPath = location?.startsWith("http") 
        ? new URL(location).pathname 
        : location;
      expect(locationPath).toBe("/dashboard");
    });

    it("should return error when credentials are missing", async () => {
      const formData = new FormData();
      formData.append("usernameOrEmail", "");

      const request = new Request("http://localhost/login", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        error: "Username/Email and password are required",
      });
    });

    it("should return error on login failure", async () => {
      vi.mocked(authAPI.login).mockRejectedValue(new Error("Invalid credentials"));

      const formData = new FormData();
      formData.append("usernameOrEmail", "test@example.com");
      formData.append("password", "wrongpassword");

      const request = new Request("http://localhost/login", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        error: "Invalid credentials",
      });
    });

    it("should set cookies on successful login", async () => {
      vi.mocked(authAPI.login).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const formData = new FormData();
      formData.append("usernameOrEmail", "test@example.com");
      formData.append("password", "password123");

      const request = new Request("http://localhost/login", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as any);

      const cookies = result.headers.get("Set-Cookie");
      expect(cookies).toContain("auth_access_token");
      expect(cookies).toContain("auth_refresh_token");
    });
  });
});

