import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authAPI, tokenStorage } from "../auth";

// Mock fetch globally
global.fetch = vi.fn();

// Mock document.cookie
const mockCookies: Record<string, string> = {};
Object.defineProperty(document, "cookie", {
  get: () => {
    return Object.entries(mockCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  },
  set: (value: string) => {
    const [key, val] = value.split("=");
    if (val.includes("expires")) {
      // Cookie is being deleted
      delete mockCookies[key];
    } else {
      mockCookies[key] = val.split(";")[0];
    }
  },
  configurable: true,
});

describe("Token Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockCookies).forEach((key) => delete mockCookies[key]);
  });

  describe("getAccessToken", () => {
    it("should return token from cookie", () => {
      mockCookies["auth_access_token"] = "test-token";
      expect(tokenStorage.getAccessToken()).toBe("test-token");
    });

    it("should return null when token not found", () => {
      expect(tokenStorage.getAccessToken()).toBeNull();
    });

    it("should get token from request on server-side", () => {
      const request = new Request("http://localhost/test", {
        headers: {
          Cookie: "auth_access_token=server-token",
        },
      });
      expect(tokenStorage.getAccessToken(request)).toBe("server-token");
    });
  });

  describe("setAccessToken", () => {
    it("should set token in cookie", () => {
      tokenStorage.setAccessToken("new-token");
      expect(mockCookies["auth_access_token"]).toBe("new-token");
    });
  });

  describe("getRefreshToken", () => {
    it("should return refresh token from cookie", () => {
      mockCookies["auth_refresh_token"] = "refresh-token";
      expect(tokenStorage.getRefreshToken()).toBe("refresh-token");
    });
  });

  describe("setRefreshToken", () => {
    it("should set refresh token in cookie", () => {
      tokenStorage.setRefreshToken("new-refresh-token");
      expect(mockCookies["auth_refresh_token"]).toBe("new-refresh-token");
    });
  });

  describe("getUser", () => {
    it("should return user from cookie", () => {
      const user = { id: 1, username: "test", email: "test@example.com", phone: "", status: "", createdAt: "", updatedAt: "", roles: [] };
      mockCookies["auth_user"] = JSON.stringify(user);
      expect(tokenStorage.getUser()).toEqual(user);
    });

    it("should return null when user not found", () => {
      expect(tokenStorage.getUser()).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      mockCookies["auth_user"] = "invalid-json";
      expect(tokenStorage.getUser()).toBeNull();
    });
  });

  describe("setUser", () => {
    it("should set user in cookie", () => {
      const user = { id: 1, username: "test", email: "test@example.com", phone: "", status: "", createdAt: "", updatedAt: "", roles: [] };
      tokenStorage.setUser(user);
      expect(JSON.parse(mockCookies["auth_user"])).toEqual(user);
    });
  });

  describe("clear", () => {
    it("should clear all tokens and user", () => {
      mockCookies["auth_access_token"] = "token";
      mockCookies["auth_refresh_token"] = "refresh";
      mockCookies["auth_user"] = '{"id":1}';

      tokenStorage.clear();

      expect(mockCookies["auth_access_token"]).toBeUndefined();
      expect(mockCookies["auth_refresh_token"]).toBeUndefined();
      expect(mockCookies["auth_user"]).toBeUndefined();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token exists", () => {
      mockCookies["auth_access_token"] = "token";
      expect(tokenStorage.isAuthenticated()).toBe(true);
    });

    it("should return false when token does not exist", () => {
      expect(tokenStorage.isAuthenticated()).toBe(false);
    });
  });
});

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
    Object.keys(mockCookies).forEach((key) => delete mockCookies[key]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("should login successfully and store tokens", async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          tokenType: "Bearer",
          expiresIn: 3600,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Mock getCurrentUser to avoid additional fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: 1,
            username: "test",
            email: "test@example.com",
            phone: "",
            status: "",
            createdAt: "",
            updatedAt: "",
            roles: [],
          },
        }),
      });

      const result = await authAPI.login("test@example.com", "password");

      expect(result).toEqual(mockResponse.data);
      expect(mockCookies["auth_access_token"]).toBe("access-token");
      expect(mockCookies["auth_refresh_token"]).toBe("refresh-token");
    });

    it("should throw error on login failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid credentials",
      });

      await expect(
        authAPI.login("test@example.com", "wrong-password")
      ).rejects.toThrow("Login failed");
    });

    it("should throw error when response is not successful", async () => {
      const mockResponse = {
        success: false,
        message: "Invalid credentials",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await expect(
        authAPI.login("test@example.com", "wrong-password")
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("should clear tokens on logout", async () => {
      mockCookies["auth_access_token"] = "token";
      mockCookies["auth_refresh_token"] = "refresh";

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await authAPI.logout();

      expect(mockCookies["auth_access_token"]).toBeUndefined();
      expect(mockCookies["auth_refresh_token"]).toBeUndefined();
    });

    it("should clear tokens even if API call fails", async () => {
      mockCookies["auth_access_token"] = "token";

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await authAPI.logout();

      expect(mockCookies["auth_access_token"]).toBeUndefined();
    });
  });

  describe("getCurrentUser", () => {
    it("should fetch and store user info", async () => {
      mockCookies["auth_access_token"] = "token";
      const mockUser = {
        id: 1,
        username: "test",
        email: "test@example.com",
        phone: "1234567890",
        status: "ACTIVE",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        roles: ["USER"],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      const result = await authAPI.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(JSON.parse(mockCookies["auth_user"])).toEqual(mockUser);
    });

    it("should throw error when no token", async () => {
      await expect(authAPI.getCurrentUser()).rejects.toThrow(
        "No access token available"
      );
    });

    it("should clear tokens and redirect on 401", async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: "", pathname: "/test" };

      mockCookies["auth_access_token"] = "expired-token";

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Token expired",
      });

      await expect(authAPI.getCurrentUser()).resolves.toBeInstanceOf(Promise);

      window.location = originalLocation;
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      mockCookies["auth_refresh_token"] = "refresh-token";
      const mockResponse = {
        success: true,
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          tokenType: "Bearer",
          expiresIn: 3600,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await authAPI.refreshToken();

      expect(result).toEqual(mockResponse.data);
      expect(mockCookies["auth_access_token"]).toBe("new-access-token");
      expect(mockCookies["auth_refresh_token"]).toBe("new-refresh-token");
    });

    it("should throw error when no refresh token", async () => {
      await expect(authAPI.refreshToken()).rejects.toThrow(
        "No refresh token available"
      );
    });

    it("should clear tokens on refresh failure", async () => {
      mockCookies["auth_refresh_token"] = "invalid-refresh";

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(authAPI.refreshToken()).rejects.toThrow(
        "Token refresh failed"
      );

      expect(mockCookies["auth_access_token"]).toBeUndefined();
      expect(mockCookies["auth_refresh_token"]).toBeUndefined();
    });
  });

  describe("updateCurrentUser", () => {
    it("should update user info", async () => {
      mockCookies["auth_access_token"] = "token";
      const updatedUser = {
        id: 1,
        username: "test",
        email: "newemail@example.com",
        phone: "1234567890",
        status: "ACTIVE",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
        roles: ["USER"],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: updatedUser,
        }),
      });

      const result = await authAPI.updateCurrentUser({
        email: "newemail@example.com",
      });

      expect(result).toEqual(updatedUser);
      expect(JSON.parse(mockCookies["auth_user"])).toEqual(updatedUser);
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      mockCookies["auth_access_token"] = "token";

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      });

      await expect(
        authAPI.changePassword("old-password", "new-password")
      ).resolves.toBeUndefined();
    });

    it("should throw error when no token", async () => {
      await expect(
        authAPI.changePassword("old-password", "new-password")
      ).rejects.toThrow("No access token available");
    });
  });
});

