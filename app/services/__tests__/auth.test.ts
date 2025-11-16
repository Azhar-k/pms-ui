import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authAPI, tokenStorage } from "../auth";

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
global.localStorage = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  }),
  length: 0,
  key: vi.fn(),
} as any;

// Mock document.cookie
const mockCookies: Record<string, string> = {};
Object.defineProperty(document, "cookie", {
  get: () => {
    // Return cookies in format: "name=value; name2=value2"
    // getCookie expects encoded values, so return them as stored (encoded)
    return Object.entries(mockCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  },
  set: (value: string) => {
    // Parse cookie string: "name=encoded_value;expires=...;path=..."
    const parts = value.split(";");
    const [nameValue] = parts;
    if (nameValue) {
      const [key, ...valueParts] = nameValue.split("=");
      if (key) {
        const trimmedKey = key.trim();
        // Check if it's a delete (expires in past or empty value)
        if (valueParts.length === 0 || valueParts.join("=") === "" || value.includes("expires=Thu, 01 Jan 1970")) {
          delete mockCookies[trimmedKey];
        } else {
          // Store the encoded value as-is (setCookie encodes it)
          mockCookies[trimmedKey] = valueParts.join("=");
        }
      }
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
      // getCookie expects encoded values in document.cookie, so encode when setting manually
      mockCookies["auth_access_token"] = encodeURIComponent("test-token");
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
      // setCookie encodes the value, so check the encoded version
      const cookieValue = mockCookies["auth_access_token"];
      expect(cookieValue).toBe("new-token"); // The value is stored encoded in the mock
    });
  });

  describe("getRefreshToken", () => {
    it("should return refresh token from cookie", () => {
      // getCookie expects encoded values in document.cookie
      mockCookies["auth_refresh_token"] = encodeURIComponent("refresh-token");
      expect(tokenStorage.getRefreshToken()).toBe("refresh-token");
    });
  });

  describe("setRefreshToken", () => {
    it("should set refresh token in cookie", () => {
      tokenStorage.setRefreshToken("new-refresh-token");
      const cookieValue = mockCookies["auth_refresh_token"];
      // setCookie encodes it, so the stored value is encoded
      expect(cookieValue).toBe("new-refresh-token");
    });
  });

  describe("getUser", () => {
    it("should return user from cookie", () => {
      const user = { id: 1, username: "test", email: "test@example.com", phone: "", status: "", createdAt: "", updatedAt: "", roles: [] };
      // getCookie expects encoded values, so encode the JSON string
      mockCookies["auth_user"] = encodeURIComponent(JSON.stringify(user));
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
      // Cookie value is JSON stringified and then encoded by setCookie
      const cookieValue = mockCookies["auth_user"];
      expect(cookieValue).toBeDefined();
      // getCookie will decode it, so we can parse it directly
      // But since our mock stores it encoded, we need to decode it
      const decoded = decodeURIComponent(cookieValue);
      expect(JSON.parse(decoded)).toEqual(user);
    });
  });

  describe("clear", () => {
    it("should clear all tokens and user", () => {
      mockCookies["auth_access_token"] = encodeURIComponent("token");
      mockCookies["auth_refresh_token"] = encodeURIComponent("refresh");
      mockCookies["auth_user"] = encodeURIComponent('{"id":1}');

      tokenStorage.clear();

      expect(mockCookies["auth_access_token"]).toBeUndefined();
      expect(mockCookies["auth_refresh_token"]).toBeUndefined();
      expect(mockCookies["auth_user"]).toBeUndefined();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token exists", () => {
      mockCookies["auth_access_token"] = encodeURIComponent("token");
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

      const mockHeaders = new Headers();
      mockHeaders.set("content-type", "application/json");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      // Mock getCurrentUser to avoid additional fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
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
      // setCookie encodes values, so check the encoded values in mock
      // getCookie will decode them when reading
      expect(mockCookies["auth_access_token"]).toBe("access-token");
      expect(mockCookies["auth_refresh_token"]).toBe("refresh-token");
    });

    it("should throw error on login failure", async () => {
      const mockHeaders = new Headers();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: mockHeaders,
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

      const mockHeaders = new Headers();
      mockHeaders.set("content-type", "application/json");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
      });

      await expect(
        authAPI.login("test@example.com", "wrong-password")
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("should clear tokens on logout", async () => {
      mockCookies["auth_access_token"] = encodeURIComponent("token");
      mockCookies["auth_refresh_token"] = encodeURIComponent("refresh");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await authAPI.logout();

      expect(mockCookies["auth_access_token"]).toBeUndefined();
      expect(mockCookies["auth_refresh_token"]).toBeUndefined();
    });

    it("should clear tokens even if API call fails", async () => {
      mockCookies["auth_access_token"] = encodeURIComponent("token");

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await authAPI.logout();

      expect(mockCookies["auth_access_token"]).toBeUndefined();
    });
  });

  describe("getCurrentUser", () => {
    it("should fetch and store user info", async () => {
      mockCookies["auth_access_token"] = encodeURIComponent("token");
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

      const mockHeaders = new Headers();
      mockHeaders.set("content-type", "application/json");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      const result = await authAPI.getCurrentUser();

      expect(result).toEqual(mockUser);
      // setUser stores JSON stringified and encoded value
      const userCookie = mockCookies["auth_user"];
      expect(userCookie).toBeDefined();
      // Decode and parse to verify
      const decoded = decodeURIComponent(userCookie);
      expect(JSON.parse(decoded)).toEqual(mockUser);
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

      mockCookies["auth_access_token"] = encodeURIComponent("expired-token");

      const mockHeaders = new Headers();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: mockHeaders,
        text: async () => "Token expired",
      });

      // Call getCurrentUser - clear() is called when 401 response is processed
      const promise = authAPI.getCurrentUser();
      
      // Wait for the promise to start processing (the response check happens in the promise chain)
      // Use Promise.race to wait a bit but not wait forever (since it returns a never-resolving promise)
      await Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, 10))
      ]);
      
      // Should return a promise that never resolves (for redirect)
      expect(promise).toBeInstanceOf(Promise);
      // tokenStorage.clear should be called when 401 response is processed
      expect(mockCookies["auth_access_token"]).toBeUndefined();

      window.location = originalLocation;
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      mockCookies["auth_refresh_token"] = encodeURIComponent("refresh-token");
      const mockResponse = {
        success: true,
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          tokenType: "Bearer",
          expiresIn: 3600,
        },
      };

      const mockHeaders = new Headers();
      mockHeaders.set("content-type", "application/json");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
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
      mockCookies["auth_refresh_token"] = encodeURIComponent("invalid-refresh");

      const mockHeaders = new Headers();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: mockHeaders,
        text: async () => "Unauthorized",
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
      mockCookies["auth_access_token"] = encodeURIComponent("token");
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

      const mockHeaders = new Headers();
      mockHeaders.set("content-type", "application/json");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({
          success: true,
          data: updatedUser,
        }),
      });

      const result = await authAPI.updateCurrentUser({
        email: "newemail@example.com",
      });

      expect(result).toEqual(updatedUser);
      // setUser stores JSON stringified and encoded value
      const userCookie = mockCookies["auth_user"];
      expect(userCookie).toBeDefined();
      // Decode and parse to verify
      const decoded = decodeURIComponent(userCookie);
      expect(JSON.parse(decoded)).toEqual(updatedUser);
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      mockCookies["auth_access_token"] = encodeURIComponent("token");

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

